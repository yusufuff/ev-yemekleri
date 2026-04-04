// app/(chef)/dashboard/DashboardClient.tsx - Client Component
'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)', borderTop: `3px solid ${color}`, position: 'relative' }}>
      <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 24, opacity: 0.15 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#8A7B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E' }}>{value}</div>
    </div>
  )
}

export default function DashboardClient({ initialData }) {
  const router = useRouter()
  const [data, setData] = useState(() => initialData)
  const [isOpen, setIsOpen] = useState(initialData?.is_open ?? true)
  const [guncelleniyor, setGuncelleniyor] = useState(null)
  const [abonelik, setAbonelik] = useState<any>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(async ({ data: authData }) => {
      if (!authData?.user) return
      const { data: cp } = await supabase
        .from('chef_profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()
      const cpId = (cp as any)?.id
      if (!cpId) return
      const { data: abone } = await supabase
        .from('chef_subscriptions')
        .select('status, expires_at, amount_paid')
        .eq('chef_id', cpId)
        .single()
      setAbonelik(abone ?? null)
    })
  }, [])

  const updateOrderStatus = async (orderId, status) => {
    setGuncelleniyor(orderId)
    try {
      const res = await fetch(`/api/chef/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) { alert(`Hata: ${json.error}`); return }

      setData(prev => {
        if (!prev) return prev
        const guncelle = orders => (orders ?? []).map(o => o.id === orderId ? { ...o, status } : o)
        return {
          ...prev,
          pending_orders: (status === 'confirmed' || status === 'cancelled')
            ? (prev.pending_orders ?? []).filter(o => o.id !== orderId)
            : guncelle(prev.pending_orders ?? []),
          active_orders: status === 'confirmed'
            ? [...(prev.active_orders ?? []), ...(prev.pending_orders ?? []).filter(o => o.id === orderId).map(o => ({ ...o, status }))]
            : status === 'cancelled'
            ? (prev.active_orders ?? []).filter(o => o.id !== orderId)
            : guncelle(prev.active_orders ?? []),
        }
      })
      router.refresh()
    } catch (err) {
      console.error('Order update error:', err)
    } finally {
      setGuncelleniyor(null)
    }
  }

  const toggleOpen = async () => {
    const next = !isOpen
    setIsOpen(next)
    await fetch('/api/chef/dashboard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: next }),
    })
  }

  const getSonrakiButon = order => {
    switch (order.status) {
      case 'confirmed':         return { label: '👨‍🍳 Hazırlamaya Başla', sonrakiStatus: 'preparing',         renk: '#8B5CF6', bgRenk: '#F5F3FF' }
      case 'preparing':         return { label: '🛵 Yola Çıktım',         sonrakiStatus: 'on_way',            renk: '#F97316', bgRenk: '#FFF7ED' }
      case 'on_way':            return { label: '✅ Teslim Ettim',         sonrakiStatus: 'delivered_pending', renk: '#22C55E', bgRenk: '#F0FDF4' }
      case 'delivered_pending': return { label: '⏳ Alıcı Onayı Bekleniyor', sonrakiStatus: null,             renk: '#9CA3AF', bgRenk: '#F9FAFB' }
      default: return null
    }
  }

  const stats = data?.stats ?? {}

  // Üyelik banner hesapla
  const kalanGun = abonelik?.expires_at
    ? Math.ceil((new Date(abonelik.expires_at).getTime() - Date.now()) / 86400000)
    : null
  const uyelikAktif = abonelik?.status === 'active' && kalanGun !== null && kalanGun > 0

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Üyelik Banner */}
        {abonelik === null ? (
          <div style={{ background:'#FEF3EC', border:'1px solid #F28B5E', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div>
              <span style={{ fontWeight:700, color:'#E8622A', fontSize:14 }}>⚠️ Aktif üyeliğiniz yok</span>
              <span style={{ fontSize:13, color:'#8A7B6B', marginLeft:8 }}>Platformda görünmek ve sipariş almak için üyelik başlatın.</span>
            </div>
            <Link href="/uyelik" style={{ padding:'8px 18px', background:'#E8622A', color:'white', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              Üyelik Al →
            </Link>
          </div>
        ) : !uyelikAktif ? (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <span style={{ fontWeight:700, color:'#DC2626', fontSize:14 }}>❌ Üyeliğinizin süresi doldu — sipariş alamazsınız.</span>
            <Link href="/uyelik" style={{ padding:'8px 18px', background:'#DC2626', color:'white', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              Yenile →
            </Link>
          </div>
        ) : kalanGun <= 7 ? (
          <div style={{ background:'#FEF3EC', border:'1px solid #F28B5E', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <span style={{ fontSize:13, color:'#4A2C0E' }}>
              ⚠️ <strong>Üyelik {kalanGun} gün içinde bitiyor</strong>
              <span style={{ color:'#8A7B6B', marginLeft:8 }}>· ₺{abonelik.amount_paid}/ay</span>
            </span>
            <Link href="/uyelik" style={{ padding:'8px 18px', background:'#E8622A', color:'white', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              Yenile →
            </Link>
          </div>
        ) : (
          <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:12, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <span style={{ fontSize:13, color:'#4A2C0E' }}>
              ✅ <strong>Üyelik Aktif</strong>
              <span style={{ color:'#8A7B6B', marginLeft:8 }}>· {kalanGun} gün kaldı · ₺{abonelik.amount_paid}/ay</span>
            </span>
            <Link href="/uyelik" style={{ fontSize:12, color:'#059669', textDecoration:'none', fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>
              Detay →
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Aşçı Paneli</h1>
            <p style={{ color: '#8A7B6B', fontSize: 13, margin: '4px 0 0' }}>Merhaba 👋</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isOpen ? '#3D6B47' : '#8A7B6B' }}>
              {isOpen ? '🟢 Açık' : '🔴 Kapalı'}
            </span>
            <button onClick={toggleOpen} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: isOpen ? '#3D6B47' : '#E8E0D4', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: isOpen ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Bekleyen Sipariş" value={String(data?.pending_orders?.length ?? 0)} icon="🛒" color="#E8622A" />
          <StatCard label="Bugünkü Kazanç" value={`₺${stats.today_earnings ?? 0}`} icon="💰" color="#3D6B47" />
          <StatCard label="Tamamlanan" value={String(stats.today_orders ?? 0)} icon="🍳" color="#4A2C0E" />
          <StatCard label="Puan Ortalaması" value={String(stats.avg_rating ?? '—')} icon="⭐" color="#3B82F6" />
          <StatCard label="Profil Görüntülenme" value={String(stats.profile_views ?? 0)} icon="👁️" color="#8B5CF6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 14 }}>Bekleyen Siparişler</h2>
            {(data?.pending_orders ?? []).length === 0 ? (
              <div style={{ background: 'white', borderRadius: 14, padding: 24, textAlign: 'center', color: '#8A7B6B', fontSize: 13 }}>Bekleyen sipariş yok ✨</div>
            ) : (data?.pending_orders ?? []).map(order => (
              <div key={order.id} style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', borderLeft: '4px solid #E8622A', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#8A7B6B' }}>#{order.order_number ?? order.id}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E' }}>{order.buyer_name}</div>
                    <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 2 }}>
                      {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#E8622A' }}>₺{order.total_amount}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateOrderStatus(order.id, 'confirmed')} disabled={guncelleniyor === order.id}
                    style={{ flex: 1, padding: '8px 0', background: '#ECFDF5', color: '#3D6B47', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: guncelleniyor === order.id ? 0.7 : 1 }}>
                    {guncelleniyor === order.id ? '⏳...' : '✅ Onayla'}
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    style={{ padding: '8px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>❌</button>
                  <button style={{ padding: '8px 14px', background: '#F5EDD8', color: '#4A2C0E', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>💬</button>
                </div>
              </div>
            ))}

            {(data?.active_orders ?? []).length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: '20px 0 14px' }}>Aktif Siparişler</h2>
                {data.active_orders.map(order => {
                  const buton = getSonrakiButon(order)
                  return (
                    <div key={order.id} style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', borderLeft: `4px solid ${buton?.renk ?? '#3D6B47'}`, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#8A7B6B' }}>#{order.order_number ?? order.id}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E' }}>{order.buyer_name}</div>
                          <div style={{ fontSize: 12, color: '#8A7B6B' }}>{order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: buton?.bgRenk ?? '#FEF3EC', color: buton?.renk ?? '#E8622A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'block', marginBottom: 4 }}>
                            {order.status === 'confirmed' ? '✅ Onaylandı'
                              : order.status === 'preparing' ? '👨‍🍳 Hazırlanıyor'
                              : order.status === 'on_way' ? '🛵 Yolda'
                              : order.status === 'delivered_pending' ? '⏳ Alıcı Onayı'
                              : order.status}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#E8622A' }}>₺{order.total_amount}</span>
                        </div>
                      </div>
                      {buton && (
                        <button onClick={() => buton.sonrakiStatus && updateOrderStatus(order.id, buton.sonrakiStatus)}
                          disabled={!buton.sonrakiStatus || guncelleniyor === order.id}
                          style={{ width: '100%', padding: '10px 0', marginTop: 8, background: buton.sonrakiStatus ? buton.renk : '#F3F4F6', color: buton.sonrakiStatus ? 'white' : '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: buton.sonrakiStatus ? 'pointer' : 'not-allowed', opacity: guncelleniyor === order.id ? 0.7 : 1 }}>
                          {guncelleniyor === order.id ? '⏳ Güncelleniyor...' : buton.label}
                        </button>
                      )}
                      {order.status === 'delivered_pending' && (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', textAlign: 'center', background: '#F9FAFB', borderRadius: 8, padding: '8px 12px' }}>
                          Alıcı 24 saat içinde onaylamazsa otomatik teslim edildi sayılır.
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 14 }}>Stok Durumu</h2>
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 20 }}>
              {(data?.stock ?? []).map(item => {
                const pct = item.daily_stock > 0 ? (item.remaining_stock / item.daily_stock) * 100 : 0
                const barColor = pct === 0 ? '#DC2626' : pct < 40 ? '#E8622A' : '#3D6B47'
                return (
                  <div key={item.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: '#4A2C0E' }}>{item.name}</span>
                      <span style={{ fontWeight: 600, color: barColor }}>{item.remaining_stock} / {item.daily_stock}</span>
                    </div>
                    <div style={{ background: '#E8E0D4', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                <Link href="/menu" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#F5EDD8', color: '#4A2C0E', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '1.5px solid #E8E0D4' }}>📦 Stok Güncelle</Link>
                <Link href="/asci-ayarlar" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#F5EDD8', color: '#4A2C0E', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '1.5px solid #E8E0D4' }}>⚙️ Profil Ayarları</Link>
                <Link href="/kazanc" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#F5EDD8', color: '#4A2C0E', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '1.5px solid #E8E0D4' }}>💰 Kazanç & Ödeme</Link>
                <Link href="/uyelik" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#FEF3EC', color: '#E8622A', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700, border: '1.5px solid #E8622A' }}>💳 Üyeliğim</Link>
                <Link href="/paylasim" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#F5EDD8', color: '#4A2C0E', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '1.5px solid #E8E0D4' }}>📲 Paylaşım & Kampanya</Link>
              </div>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 14 }}>Haftalık Kazanç</h2>
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginBottom: 8 }}>
                {(data?.weekly_earnings ?? []).map((v, i) => {
                  const max = Math.max(...(data?.weekly_earnings ?? [1]))
                  const pct = max > 0 ? (v / max) * 100 : 0
                  const isToday = i === 6
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 9, color: '#8A7B6B' }}>₺{Math.round(v)}</div>
                      <div style={{ width: '100%', height: `${pct}%`, minHeight: pct > 0 ? 4 : 0, background: isToday ? '#E8622A' : '#F28B5E', borderRadius: '4px 4px 0 0', opacity: isToday ? 1 : 0.7 }} />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8A7B6B' }}>
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}