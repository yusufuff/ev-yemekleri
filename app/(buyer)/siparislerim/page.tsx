// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { DeliveryMap } from '@/components/orders/DeliveryMap'
import { useCart } from '@/hooks/useCart'

const STATUS_META = {
  pending:           { label: 'Onay Bekleniyor',  color: '#E8622A', bg: '#FEF3EC', step: 0 },
  confirmed:         { label: 'Onaylandi',         color: '#3D6B47', bg: '#ECFDF5', step: 1 },
  preparing:         { label: 'Hazirlaniyor',      color: '#8B5CF6', bg: '#F5F3FF', step: 2 },
  on_way:            { label: 'Yolda',             color: '#3B82F6', bg: '#EFF6FF', step: 3 },
  on_the_way:        { label: 'Yolda',             color: '#3B82F6', bg: '#EFF6FF', step: 3 },
  delivered_pending: { label: 'Teslim Edildi ⏳', color: '#F59E0B', bg: '#FFFBEB', step: 4 },
  delivered:         { label: 'Teslim Edildi',     color: '#3D6B47', bg: '#ECFDF5', step: 4 },
  cancelled:         { label: 'Iptal Edildi',      color: '#DC2626', bg: '#FEE2E2', step: -1 },
}
const STEPS = ['Alindi', 'Onaylandi', 'Hazirlaniyor', 'Yolda', 'Teslim']

function formatDate(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 60) return diff + ' dakika once'
  if (diff < 1440) return Math.floor(diff/60) + ' saat once'
  return new Date(iso).toLocaleDateString('tr-TR', { day:'numeric', month:'long' })
}

function ReviewModal({ orderId, chefName, chefId, onClose }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!chefId) { alert('Asci bilgisi eksik.'); return }
    setSaving(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, chef_id: chefId, rating, comment }),
    })
    if (res.ok) { setDone(true); setTimeout(onClose, 1500) }
    else { const json = await res.json(); console.error(json.error) }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(74,44,14,0.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'white', borderRadius:20, padding:28, width:'100%', maxWidth:420 }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#4A2C0E' }}>Tesekkurler!</div>
            <div style={{ fontSize:13, color:'#8A7B6B', marginTop:8 }}>Yorumunuz kaydedildi.</div>
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
                style={{ flex:1, padding:'12px 0', background:'#E8622A', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: saving ? 0.7 : 1 }}>
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
const [isChef, setIsChef] = useState(false)
const [isOpen, setIsOpen] = useState(false)
const [toggleSaving, setToggleSaving] = useState(false)
const [abonelik, setAbonelik] = useState(null)
const [kampanya, setKampanya] = useState(null)
const [stats, setStats] = useState({ pending: 0, today_earnings: 0, today_orders: 0, avg_rating: '—', profile_views: 0 })
  const loadOrders = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, status, delivery_type, total_amount, subtotal, created_at, delivery_address, chef_id')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      const orderIds = (ordersData ?? []).map(o => o.id)
      let itemsMap = {}
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('order_id, id, item_name, quantity, item_price, menu_item_id')
          .in('order_id', orderIds)
        ;(itemsData ?? []).forEach(i => {
          if (!itemsMap[i.order_id]) itemsMap[i.order_id] = []
          itemsMap[i.order_id].push(i)
        })
      }

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
        estimated_minutes: 0,
        chef_id: o.chef_id,
        chef_name: chefMap[o.chef_id] ?? 'Asci',
        delivery_address: typeof o.delivery_address === 'object' ? (o.delivery_address?.full_address ?? '') : (o.delivery_address ?? ''),
        items: (itemsMap[o.id] ?? []).map(i => ({
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
    if (!confirm('Siparisi iptal etmek istediginize emin misiniz?')) return
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
      loadOrders()
    } catch { alert('Iptal islemi basarisiz.') }
  }

  const siparisiOnayla = async (orderId) => {
    if (!confirm('Siparisi teslim aldiginizi onayliyor musunuz?')) return
    setOnaylaniyor(orderId)
    try {
      // Önce iyzico escrow -> asci hesabi transferi tetikle
      const approveRes = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const approveJson = await approveRes.json()
      if (!approveRes.ok) console.error('Approve hatasi:', approveJson.error)

      // Siparis durumunu guncelle
      const res = await fetch(`/api/chef/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      })
      const json = await res.json()
      if (!res.ok) { alert(`Hata: ${json.error}`); return }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
    } catch {
      alert('Onay islemi basarisiz.')
    } finally {
      setOnaylaniyor(null)
    }
  }

  const handleReorder = (order) => {
    clearCart()
    order.items?.forEach(item => {
      addItem({ menu_item_id: item.menu_item_id ?? item.id ?? String(Math.random()), chef_id: order.chef_id, chef_name: order.chef_name, name: item.name, price: item.price ?? 0, category: item.category ?? 'main', remaining_stock: null, quantity: item.quantity ?? 1, photo: undefined })
    })
    router.push('/odeme')
  }
useEffect(() => {
  const supabase = getSupabaseBrowserClient()
  supabase.auth.getUser().then(({ data }) => {
    if (!data?.user) return
    supabase.from('users').select('role').eq('id', data.user.id).single().then(({ data: profile }) => {
      if (profile?.role === 'chef') {
        setIsChef(true)
        loadChefStats()
        supabase.from('chef_profiles').select('is_open').eq('user_id', data.user.id).single().then(({ data: cp }) => {
          setIsOpen(cp?.is_open ?? false)
        })
      }
    })
  })
}, [])

const toggleOpen = async () => {
  setToggleSaving(true)
  const supabase = getSupabaseBrowserClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  await supabase.from('chef_profiles').update({ is_open: !isOpen }).eq('user_id', authUser.id)
  setIsOpen(v => !v)
  setToggleSaving(false)
}
const loadChefStats = async () => {
  const supabase = getSupabaseBrowserClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return
  const { data: cp } = await supabase.from('chef_profiles').select('id, avg_rating').eq('user_id', authData.user.id).single()
  if (!cp) return
  const { data: abone } = await supabase.from('chef_subscriptions').select('status, expires_at, amount_paid').eq('chef_id', cp.id).single()
  setAbonelik(abone ?? null)
  const { data: ayarlar } = await supabase.from('app_settings').select('key, value').in('key', ['kampanya_aktif', 'kampanya_bitis', 'kampanya_sart'])
  if (ayarlar) {
    const m = Object.fromEntries(ayarlar.map((d) => [d.key, d.value]))
    setKampanya({ aktif: m.kampanya_aktif === 'true', bitis: m.kampanya_bitis ?? '', sart: m.kampanya_sart ?? '' })
  }
  const today = new Date().toISOString().split('T')[0]
  const { data: todayOrders } = await supabase.from('orders').select('total_amount, status').eq('chef_id', cp.id).gte('created_at', today)
  const todayEarnings = (todayOrders ?? []).filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount ?? 0), 0)
  const { count: pendingCount } = await supabase.from('orders').select('id', { count: 'exact' }).eq('chef_id', cp.id).eq('status', 'pending')
  setStats({ pending: pendingCount ?? 0, today_earnings: todayEarnings, today_orders: (todayOrders ?? []).filter(o => o.status === 'delivered').length, avg_rating: cp.avg_rating?.toFixed(1) ?? '—', profile_views: 0 })
}
  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 30000)
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel('orders-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  const active = orders.filter(o => !['delivered','cancelled'].includes(o.status))
  const past   = orders.filter(o =>  ['delivered','cancelled'].includes(o.status))
  const shown  = tab === 'active' ? active : past

  return (
    <>
      <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
  <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', margin:0 }}>Siparişlerim</h1>
  {isChef && (
    <button onClick={toggleOpen} disabled={toggleSaving} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:13, background: isOpen ? '#ECFDF5' : '#FEE2E2', color: isOpen ? '#3D6B47' : '#DC2626' }}>
      <div style={{ width:36, height:20, borderRadius:10, background: isOpen ? '#3D6B47' : '#E8E0D4', position:'relative', transition:'background 0.2s' }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'white', position:'absolute', top:2, left: isOpen ? 18 : 2, transition:'left 0.2s' }} />
      </div>
      {toggleSaving ? '...' : isOpen ? '● Açık' : '○ Kapalı'}
    </button>
  )}
</div>
{isChef && (
  <>
    {abonelik === null ? (
      <div style={{ background:'#FEF3EC', border:'1px solid #F28B5E', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div><span style={{ fontWeight:700, color:'#E8622A', fontSize:14 }}>⚠️ Aktif üyeliğiniz yok</span><span style={{ fontSize:13, color:'#8A7B6B', marginLeft:8 }}>Platformda görünmek için üyelik başlatın.</span></div>
        <Link href="/uyelik" style={{ padding:'8px 18px', background:'#E8622A', color:'white', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>Üyelik Al →</Link>
      </div>
    ) : abonelik?.status === 'active' ? (
      <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <span style={{ fontSize:13, color:'#4A2C0E' }}>✅ <strong>Üyelik Aktif</strong><span style={{ color:'#8A7B6B', marginLeft:8 }}>· {Math.ceil((new Date(abonelik.expires_at).getTime() - Date.now()) / 86400000)} gün kaldı · ₺{abonelik.amount_paid}/ay</span></span>
        <Link href="/uyelik" style={{ fontSize:12, color:'#059669', textDecoration:'none', fontWeight:600 }}>Detay →</Link>
      </div>
    ) : null}
    {kampanya?.aktif && (
      <div style={{ background:'linear-gradient(135deg, #3D6B47, #2D5438)', borderRadius:12, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ fontWeight:700, color:'white', fontSize:14 }}>🎉 Ücretsiz Üyelik Kampanyası!</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>{kampanya.sart}{kampanya.bitis && ` · ${new Date(kampanya.bitis).toLocaleDateString('tr-TR')} tarihine kadar`}</div>
        </div>
        <Link href="/paylasim" style={{ padding:'8px 16px', background:'white', color:'#3D6B47', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>Hemen Paylaş →</Link>
      </div>
    )}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20 }}>
      {[
        { label:'Bekleyen Sipariş', value: String(stats.pending), icon:'🛒', color:'#E8622A' },
        { label:'Bugünkü Kazanç', value: `₺${stats.today_earnings}`, icon:'💰', color:'#3D6B47' },
        { label:'Tamamlanan', value: String(stats.today_orders), icon:'🍳', color:'#4A2C0E' },
        { label:'Puan Ortalaması', value: String(stats.avg_rating), icon:'⭐', color:'#3B82F6' },
      ].map(({ label, value, icon, color }) => (
        <div key={label} style={{ background:'white', borderRadius:12, padding:16, boxShadow:'0 2px 8px rgba(74,44,14,0.08)', borderTop:`3px solid ${color}`, position:'relative' }}>
          <div style={{ position:'absolute', right:12, top:12, fontSize:20, opacity:0.15 }}>{icon}</div>
          <div style={{ fontSize:10, color:'#8A7B6B', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{label}</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#4A2C0E' }}>{value}</div>
        </div>
      ))}
    </div>
  </>
)}

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
                            🚚 Asci siparisini teslim ettigini bildirdi. Aldiysaniz onaylayin!
                            <div style={{ fontSize:11, color:'#B45309', marginTop:4 }}>24 saat icinde onaylamazsaniz otomatik teslim edildi sayilir.</div>
                          </div>
                          <button onClick={() => siparisiOnayla(order.id)} disabled={onaylaniyor === order.id}
                            style={{ width:'100%', padding:'12px 0', background:'#22C55E', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: onaylaniyor === order.id ? 0.7 : 1 }}>
                            {onaylaniyor === order.id ? '⏳ Onaylaniyor...' : '✅ Siparisi Aldim'}
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
                            <button onClick={() => cancelOrder(order.id)} style={{ padding:'8px 14px', background:'#FEE2E2', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#DC2626' }}>❌ Iptal</button>
                          </div>
                        </div>
                      )}

                      {order.status === 'delivered' && (
                        <div style={{ display:'flex', gap:8, marginTop:10 }}>
                          <button onClick={() => handleReorder(order)} style={{ flex:1, padding:'8px 0', background:'#E8622A', color:'white', borderRadius:8, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit' }}>🔄 Tekrar Siparis</button>
                          <button onClick={() => setReviewOrder({ id: order.id, chef: order.chef_name, chefId: order.chef_id })} style={{ padding:'8px 14px', background:'#FEF3C7', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#D97706' }}>⭐ Degerlendir</button>
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
      {reviewOrder && <ReviewModal orderId={reviewOrder.id} chefName={reviewOrder.chef} chefId={reviewOrder.chefId} onClose={() => setReviewOrder(null)} />}
    </>
  )
}