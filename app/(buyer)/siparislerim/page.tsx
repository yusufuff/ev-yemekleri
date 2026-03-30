// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { DeliveryMap } from '@/components/orders/DeliveryMap'
import { useCart } from '@/hooks/useCart'

const STATUS_META = {
  pending:           { label: 'Onay Bekleniyor',    color: '#E8622A', bg: '#FEF3EC', step: 0 },
  confirmed:         { label: 'Onaylandi',           color: '#3D6B47', bg: '#ECFDF5', step: 1 },
  preparing:         { label: 'Hazirlaniyor',        color: '#8B5CF6', bg: '#F5F3FF', step: 2 },
  on_way:            { label: 'Yolda',               color: '#3B82F6', bg: '#EFF6FF', step: 3 },
  on_the_way:        { label: 'Yolda',               color: '#3B82F6', bg: '#EFF6FF', step: 3 },
  delivered_pending: { label: 'Teslim Edildi ⏳',    color: '#F59E0B', bg: '#FFFBEB', step: 4 },
  delivered:         { label: 'Teslim Edildi',       color: '#3D6B47', bg: '#ECFDF5', step: 4 },
  cancelled:         { label: 'Iptal Edildi',        color: '#DC2626', bg: '#FEE2E2', step: -1 },
}
const STEPS = ['Alindi', 'Onaylandi', 'Hazirlaniyor', 'Yolda', 'Teslim']

function formatDate(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 60) return diff + ' dakika once'
  if (diff < 1440) return Math.floor(diff/60) + ' saat once'
  return new Date(iso).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })
}

function ReviewModal({ orderId, chefName, onClose }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setSaving(true)
    await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: orderId, rating, comment }) })
    setDone(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(74,44,14,0.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'white', borderRadius:20, padding:28, width:'100%', maxWidth:420 }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#4A2C0E' }}>Tesekkurler!</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#4A2C0E', marginBottom:4 }}>Degerlendirme</div>
            <div style={{ fontSize:13, color:'#8A7B6B', marginBottom:20 }}>👩‍🍳 {chefName}</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize:32, background:'none', border:'none', cursor:'pointer', opacity: s <= rating ? 1 : 0.3 }}>⭐</button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Deneyiminizi paylasin..."
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', resize:'none', boxSizing:'border-box', marginBottom:16 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={submit} disabled={saving}
                style={{ flex:1, padding:'12px 0', background:'#E8622A', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {saving ? 'Gonderiliyor...' : '⭐ Degerlendir'}
              </button>
              <button onClick={onClose}
                style={{ padding:'12px 20px', background:'#F5EDD8', color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Iptal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SiparislerimPage() {
  const router = useRouter()
  const { addItem, clear: clearCart } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [reviewOrder, setReviewOrder] = useState(null)
  const [onaylaniyor, setOnaylaniyor] = useState(null)

  const loadOrders = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { setLoading(false); return }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, status, delivery_type, total_amount, subtotal, created_at, delivery_address, estimated_minutes, chef_id, order_items(id, item_name, quantity, item_price, menu_item_id)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      const chefIds = [...new Set((ordersData ?? []).map(o => o.chef_id).filter(Boolean))]
      let chefMap = {}
      if (chefIds.length > 0) {
        const { data: chefData } = await supabase
          .from('chef_public_profiles')
          .select('chef_id, full_name')
          .in('chef_id', chefIds)
        ;(chefData ?? []).forEach(c => { chefMap[c.chef_id] = c.full_name })
      }

      setOrders((ordersData ?? []).map(o => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        delivery_type: o.delivery_type,
        total_amount: parseFloat(o.total_amount ?? o.subtotal ?? 0),
        created_at: o.created_at,
        estimated_minutes: o.estimated_minutes ?? 0,
        chef_id: o.chef_id,
        chef_name: chefMap[o.chef_id] ?? 'Asci',
        delivery_address: typeof o.delivery_address === 'object' ? (o.delivery_address?.full_address ?? '') : (o.delivery_address ?? ''),
        items: (o.order_items ?? []).map(i => ({
          id: i.id, name: i.item_name ?? i.name, quantity: i.quantity,
          price: parseFloat(i.item_price ?? 0), menu_item_id: i.menu_item_id,
        })),
      })))
    } catch (e) {
      console.error('loadOrders error:', e)
    } finally {
      setLoading(false)
    }
  }

  const cancelOrder = async (orderId) => {
    if (!confirm('Siparişi iptal etmek istediğinize emin misiniz?')) return
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
      loadOrders()
    } catch { alert('İptal işlemi başarısız.') }
  }

  const siparisiOnayla = async (orderId) => {
    if (!confirm('Siparişi teslim aldığınızı onaylıyor musunuz?')) return
    setOnaylaniyor(orderId)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId)
      loadOrders()
    } catch { alert('Onay işlemi başarısız.') }
    finally { setOnaylaniyor(null) }
  }

  const handleReorder = (order) => {
    clearCart()
    order.items?.forEach(item => {
      addItem({ menu_item_id: item.menu_item_id ?? item.id ?? String(Math.random()), chef_id: order.chef_id, chef_name: order.chef_name, name: item.name, price: item.price ?? 0, category: item.category ?? 'main', remaining_stock: null, quantity: item.quantity ?? 1, photo: undefined })
    })
    router.push('/odeme')
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 30000)
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel('orders-changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => loadOrders()).subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  const active = orders.filter(o => !['delivered','cancelled'].includes(o.status))
  const past   = orders.filter(o =>  ['delivered','cancelled'].includes(o.status))
  const shown  = tab === 'active' ? active : past

  return (
    <>
      <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px' }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', marginBottom:20 }}>Siparislerim</h1>

          <div style={{ display:'flex', borderBottom:'2px solid #E8E0D4', marginBottom:20 }}>
            {[['active', 'Aktif (' + active.length + ')'], ['past', 'Gecmis (' + past.length + ')']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'transparent', fontFamily:'inherit', color: tab === key ? '#E8622A' : '#8A7B6B', borderBottom: '2px solid ' + (tab === key ? '#E8622A' : 'transparent'), marginBottom:-2 }}>{label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:48, color:'#8A7B6B' }}>Yukleniyor...</div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
              <div style={{ fontWeight:700, fontSize:16, color:'#4A2C0E', marginBottom:8 }}>{tab === 'active' ? 'Aktif siparis yok' : 'Gecmis siparis yok'}</div>
              <Link href="/kesif" style={{ display:'inline-block', marginTop:8, padding:'10px 20px', background:'#E8622A', color:'white', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:13 }}>Siparis Ver</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {shown.map(order => {
                const meta = STATUS_META[order.status] ?? STATUS_META.pending
                const isActive = !['delivered','cancelled'].includes(order.status)
                const isDeliveredPending = order.status === 'delivered_pending'
                return (
                  <div key={order.id} style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(74,44,14,0.08)', border: isDeliveredPending ? '2px solid #F59E0B' : isActive ? '2px solid #E8622A' : '1px solid rgba(232,224,212,0.6)' }}>
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid #F5EDD8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:11, color:'#8A7B6B' }}>#{order.order_number ?? order.id} · {formatDate(order.created_at)}</div>
                        <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginTop:2 }}>👩‍🍳 {order.chef_name}</div>
                      </div>
                      <span style={{ background:meta.bg, color:meta.color, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>{meta.label}</span>
                    </div>
                    <div style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:13, color:'#4A2C0E', marginBottom:8 }}>{order.items?.map(i => i.name + ' x' + i.quantity).join(', ')}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'#8A7B6B' }}>{order.delivery_type === 'delivery' ? '🛵 Teslimat' : '🚶 Gel-Al'}</span>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#E8622A' }}>₺{order.total_amount}</span>
                      </div>

                      {order.status === 'on_way' && <DeliveryMap etaMin={15} etaMax={25} deliveryAddress={order.delivery_address ?? undefined} chefLocation={order.chef_name ?? undefined} />}

                      {isDeliveredPending && (
                        <div style={{ marginTop:14 }}>
                          <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#92400E' }}>
                            🚚 Aşçı siparişinizi teslim ettiğini bildirdi. Aldıysanız onaylayın!
                            <div style={{ fontSize:11, color:'#B45309', marginTop:4 }}>24 saat içinde onaylamazsanız otomatik teslim edildi sayılır.</div>
                          </div>
                          <button onClick={() => siparisiOnayla(order.id)} disabled={onaylaniyor === order.id}
                            style={{ width:'100%', padding:'12px 0', background:'#22C55E', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: onaylaniyor === order.id ? 0.7 : 1 }}>
                            {onaylaniyor === order.id ? '⏳ Onaylanıyor...' : '✅ Siparişi Aldım'}
                          </button>
                        </div>
                      )}

                      {isActive && !isDeliveredPending && order.status !== 'cancelled' && (
                        <div style={{ marginTop:14 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                            {STEPS.map((step, i) => (
                              <div key={i} style={{ textAlign:'center', flex:1 }}>
                                <div style={{ width:24, height:24, borderRadius:'50%', margin:'0 auto 4px', background: i <= meta.step ? '#E8622A' : '#E8E0D4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color: i <= meta.step ? 'white' : '#8A7B6B', fontWeight:700 }}>
                                  {i <= meta.step ? '✓' : i+1}
                                </div>
                                <div style={{ fontSize:9, color: i <= meta.step ? '#4A2C0E' : '#8A7B6B', fontWeight: i <= meta.step ? 700 : 400 }}>{step}</div>
                              </div>
                            ))}
                          </div>
                          {order.estimated_minutes > 0 && (
                            <div style={{ textAlign:'center', fontSize:12, color:'#E8622A', fontWeight:600, marginTop:8, background:'#FEF3EC', borderRadius:8, padding:'6px 12px' }}>
                              Tahmini teslim: {order.estimated_minutes} dakika
                            </div>
                          )}
                          <div style={{ display:'flex', gap:8, marginTop:10 }}>
                            <Link href={'/mesajlar?order_id=' + order.id} style={{ flex:1, padding:'8px 0', background:'white', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:12, fontWeight:600, color:'#4A2C0E', textDecoration:'none', textAlign:'center' }}>💬 Asciya Yaz</Link>
                            <button onClick={() => cancelOrder(order.id)} style={{ padding:'8px 14px', background:'#FEE2E2', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#DC2626' }}>❌ İptal</button>
                          </div>
                        </div>
                      )}

                      {order.status === 'delivered' && (
                        <div style={{ display:'flex', gap:8, marginTop:10 }}>
                          <button onClick={() => handleReorder(order)} style={{ flex:1, padding:'8px 0', background:'#E8622A', color:'white', borderRadius:8, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit' }}>🔄 Tekrar Siparis</button>
                          <button onClick={() => setReviewOrder({id: order.id, chef: order.chef_name})} style={{ padding:'8px 14px', background:'#FEF3C7', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#D97706' }}>⭐ Degerlendir</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {reviewOrder && <ReviewModal orderId={reviewOrder.id} chefName={reviewOrder.chef} onClose={() => setReviewOrder(null)} />}
    </>
  )
}