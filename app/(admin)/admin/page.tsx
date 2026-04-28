'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NAV_LINKS = [
  ['Dashboard', '/admin'],
  ['Aşçılar', '/admin/asciler'],
  ['Kullanıcılar', '/admin/kullanicilar'],
  ['Siparişler', '/admin/siparisler'],
  ['Ödemeler', '/admin/odemeler'],
  ['Üyelikler', '/admin/uyelikler'],
  ['Yöneticiler', '/admin/yoneticiler'],
  ['Yemek Fotoları', '/admin/yemekler'],
  ['Destek', '/admin/destek'],
  ['Blog', '/admin/blog'],
  ['Kampanya', '/admin/kampanya'],
]

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pending:           { bg: '#FEF3C7', color: '#D97706', label: '⏳ Bekliyor' },
  confirmed:         { bg: '#DBEAFE', color: '#2563EB', label: '✅ Onaylandı' },
  preparing:         { bg: '#EDE9FE', color: '#7C3AED', label: '👩‍🍳 Hazırlanıyor' },
  on_way:            { bg: '#E0F2FE', color: '#0284C7', label: '🛵 Yolda' },
  delivered_pending: { bg: '#FEF3C7', color: '#B45309', label: '🚪 Kapıda' },
  delivered:         { bg: '#D1FAE5', color: '#059669', label: '✅ Teslim' },
  cancelled:         { bg: '#FEE2E2', color: '#DC2626', label: '❌ İptal' },
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [chefs, setChefs] = useState<any[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [stats, setStats] = useState({ totalRevenue: 0, commission: 0, orderCount: 0, pendingChefs: 0 })
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null)
  const [badges, setBadges] = useState<Record<string, number>>({})

  const loadData = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [ordersRes, chefsRes, stockRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, status, total_amount, subtotal, created_at, buyer_id, chef_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('chef_profiles').select('id, user_id, is_open, verification_status, pending_approval, avg_rating, total_orders').order('created_at', { ascending: false }),
        supabase.from('menu_items').select('id, name, remaining_stock, daily_stock, chef_id').eq('is_active', true).lt('remaining_stock', 3),
      ])

      const allOrders = ordersRes.data ?? []
      const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today)
      const totalRevenue = todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + parseFloat(o.subtotal ?? o.total_amount ?? 0), 0)
      const pendingCount = (chefsRes.data ?? []).filter(c => c.pending_approval || c.verification_status === 'pending').length
      const lateCount = allOrders.filter(o => {
        const mins = (Date.now() - new Date(o.created_at).getTime()) / 60000
        return mins > 30 && o.status === 'preparing'
      }).length

      setOrders(allOrders)
      setChefs(chefsRes.data ?? [])
      setStock(stockRes.data ?? [])
      setStats({ totalRevenue: Math.round(totalRevenue), commission: Math.round(totalRevenue * 0.1), orderCount: todayOrders.length, pendingChefs: pendingCount })
      setBadges({ siparisler: allOrders.filter(o => o.status === 'pending').length, destek: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const ch1 = supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
      if (payload.eventType === 'INSERT') { setNewOrderAlert(payload.new); setTimeout(() => setNewOrderAlert(null), 5000) }
      loadData()
    }).subscribe()
    const ch2 = supabase.channel('admin-chefs').on('postgres_changes', { event: '*', schema: 'public', table: 'chef_profiles' }, () => loadData()).subscribe()
    const ch3 = supabase.channel('admin-stock').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => loadData()).subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3) }
  }, [])

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
  const openChefs = chefs.filter(c => c.is_open)
  const now = Date.now()
  const lateOrders = activeOrders.filter(o => (now - new Date(o.created_at).getTime()) / 60000 > 30 && o.status === 'preparing')

  const badgeMap: Record<string, number> = {
    'Siparişler': badges.siparisler || 0,
    'Destek': badges.destek || 0,
    'Aşçılar': stats.pendingChefs || 0,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#4A2C0E', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 900, color: 'white' }}>ANNEELIM</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Admin Paneli</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV_LINKS.map(([label, href]) => {
            const isActive = href === '/admin'
            const badge = badgeMap[label] || 0
            return (
              <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', textDecoration: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: isActive ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: isActive ? 700 : 400 }}>{label}</span>
                {badge > 0 && <span style={{ background: '#E8622A', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3D6B47' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Canlı İzleniyor</span>
          </div>
          <Link href="/admin/giris" style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '6px 12px', textDecoration: 'none' }}>Çıkış Yap</Link>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>
        {/* Yeni sipariş alert */}
        {newOrderAlert && (
          <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#E8622A', color: 'white', borderRadius: 16, padding: '14px 20px', boxShadow: '0 8px 32px rgba(232,98,42,0.4)' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🛒 Yeni Sipariş!</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>#{newOrderAlert.order_number} · ₺{newOrderAlert.total_amount}</div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Dashboard</h1>
        </div>

        {/* Stat kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Bugünkü Ciro', value: `₺${stats.totalRevenue}`, color: '#059669', icon: '💰' },
            { label: 'Komisyon', value: `₺${stats.commission}`, color: '#7C3AED', icon: '📊' },
            { label: 'Bugünkü Sipariş', value: stats.orderCount, color: '#E8622A', icon: '📦' },
            { label: 'Aktif Mutfak', value: openChefs.length, color: '#2563EB', icon: '👩‍🍳' },
            { label: 'Onay Bekleyen', value: stats.pendingChefs, color: '#D97706', icon: '⏳' },
            { label: 'Geç Sipariş', value: lateOrders.length, color: '#DC2626', icon: '🚨' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: '#8A7B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#4A2C0E' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {lateOrders.length > 0 && (
          <div style={{ background: '#FEE2E2', border: '2px solid #DC2626', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 14 }}>{lateOrders.length} sipariş 30 dakikayı geçti! Şefi ara.</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>Aktif Siparişler ({activeOrders.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {activeOrders.length === 0 && <div style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#8A7B6B' }}>Aktif sipariş yok</div>}
              {activeOrders.map(order => {
                const st = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending
                const mins = Math.round((now - new Date(order.created_at).getTime()) / 60000)
                const isLate = mins > 30 && order.status === 'preparing'
                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 8px rgba(74,44,14,0.06)', border: isLate ? '2px solid #DC2626' : '1px solid #E8E0D4', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>{st.label}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#4A2C0E' }}>#{order.order_number}</div>
                      <div style={{ fontSize: 11, color: '#8A7B6B' }}>{mins} dk önce</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#E8622A', fontSize: 14 }}>₺{parseFloat(order.subtotal ?? order.total_amount ?? 0).toFixed(0)}</div>
                    {isLate && <span>🚨</span>}
                  </div>
                )
              })}
            </div>

            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>Son Siparişler</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pastOrders.slice(0, 10).map(order => {
                const st = STATUS_COLOR[order.status] ?? STATUS_COLOR.delivered
                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #E8E0D4', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{st.label}</div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#4A2C0E' }}>#{order.order_number}</div>
                    <div style={{ fontSize: 13, color: '#8A7B6B' }}>₺{parseFloat(order.subtotal ?? order.total_amount ?? 0).toFixed(0)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>Mutfak Durumu</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {chefs.slice(0, 8).map(chef => (
                <div key={chef.id} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #E8E0D4', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: chef.is_open ? '#059669' : '#9CA3AF', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#4A2C0E' }}>Şef #{chef.id.slice(0, 6)}</div>
                  <div style={{ fontSize: 11, color: chef.is_open ? '#059669' : '#9CA3AF', fontWeight: 600 }}>{chef.is_open ? 'Açık' : 'Kapalı'}</div>
                  {(chef.pending_approval || chef.verification_status === 'pending') && (
                    <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Onay</span>
                  )}
                </div>
              ))}
            </div>

            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>⚠️ Stok Alarmı</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stock.length === 0 && <div style={{ background: 'white', borderRadius: 10, padding: 14, textAlign: 'center', color: '#8A7B6B', fontSize: 13 }}>✅ Stok normal</div>}
              {stock.map(item => (
                <div key={item.id} style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', border: '1px solid #F59E0B' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#4A2C0E' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>Son {item.remaining_stock} porsiyon!</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}