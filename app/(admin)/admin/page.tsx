'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NAV_LINKS = [
  ['Dashboard', '/admin'],
  ['Asciler', '/admin/asciler'],
  ['Kullanicilar', '/admin/kullanicilar'],
  ['Siparisler', '/admin/siparisler'],
  ['Odemeler', '/admin/odemeler'],
  ['Uyelikler', '/admin/uyelikler'],
  ['Yoneticiler', '/admin/yoneticiler'],
  ['Yemek Fotolari', '/admin/yemekler'],
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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadData = async () => {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [ordersRes, chefsRes, stockRes] = await Promise.all([
        supabaseAdmin.from('orders').select('id, order_number, status, total_amount, subtotal, created_at, buyer_id, chef_id').order('created_at', { ascending: false }).limit(50),
        supabaseAdmin.from('chef_profiles').select('id, user_id, is_open, verification_status, pending_approval, avg_rating, total_orders').order('created_at', { ascending: false }),
        supabaseAdmin.from('menu_items').select('id, name, remaining_stock, daily_stock, chef_id').eq('is_active', true).lt('remaining_stock', 3),
      ])

      const allOrders = ordersRes.data ?? []
      const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today)
      const totalRevenue = todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + parseFloat(o.subtotal ?? o.total_amount ?? 0), 0)

      setOrders(allOrders)
      setChefs(chefsRes.data ?? [])
      setStock(stockRes.data ?? [])
      setStats({
        totalRevenue: Math.round(totalRevenue),
        commission: Math.round(totalRevenue * 0.1),
        orderCount: todayOrders.length,
        pendingChefs: (chefsRes.data ?? []).filter(c => c.pending_approval || c.verification_status === 'pending').length,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Realtime - orders
    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setNewOrderAlert(payload.new)
          setTimeout(() => setNewOrderAlert(null), 5000)
        }
        loadData()
      })
      .subscribe()

    // Realtime - chefs
    const chefsChannel = supabase
      .channel('admin-chefs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chef_profiles' }, () => loadData())
      .subscribe()

    // Realtime - stock
    const stockChannel = supabase
      .channel('admin-stock-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(chefsChannel)
      supabase.removeChannel(stockChannel)
    }
  }, [])

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const openChefs = chefs.filter(c => c.is_open)
  const now = Date.now()
  const lateOrders = activeOrders.filter(o => {
    const mins = (now - new Date(o.created_at).getTime()) / 60000
    return mins > 30 && o.status === 'preparing'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: '#4A2C0E', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, color: 'white', fontSize: 18 }}>ANNEELIM - Admin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {NAV_LINKS.map(([l, h]) => (
            <Link key={h} href={h} style={{ color: h === '/admin' ? 'white' : 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'none', fontWeight: h === '/admin' ? 700 : 500 }}>{l}</Link>
          ))}
        </div>
      </nav>

      {/* Yeni sipariş alert */}
      {newOrderAlert && (
        <div style={{ position: 'fixed', top: 70, right: 24, zIndex: 9999, background: '#E8622A', color: 'white', borderRadius: 16, padding: '16px 24px', boxShadow: '0 8px 32px rgba(232,98,42,0.4)', animation: 'slideIn 0.3s ease' }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>🛒 Yeni Sipariş!</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>#{newOrderAlert.order_number} · ₺{newOrderAlert.total_amount}</div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>
        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D6B47', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#3D6B47', fontWeight: 600 }}>Canlı İzleniyor</span>
          </div>
        </div>

        {/* Stat Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: "Bugünkü Ciro", value: `₺${stats.totalRevenue}`, icon: '💰', color: '#059669' },
            { label: "Komisyon Geliri", value: `₺${stats.commission}`, icon: '📊', color: '#7C3AED' },
            { label: "Bugünkü Sipariş", value: stats.orderCount, icon: '📦', color: '#E8622A' },
            { label: "Aktif Mutfak", value: openChefs.length, icon: '👩‍🍳', color: '#2563EB' },
            { label: "Onay Bekleyen", value: stats.pendingChefs, icon: '⏳', color: '#D97706' },
            { label: "Geç Kalan Sipariş", value: lateOrders.length, icon: '🚨', color: '#DC2626' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: '#8A7B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Sol - Siparişler */}
          <div>
            {/* Geç kalan uyarı */}
            {lateOrders.length > 0 && (
              <div style={{ background: '#FEE2E2', border: '2px solid #DC2626', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🚨</span>
                <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 14 }}>{lateOrders.length} sipariş 30 dakikayı geçti! Şefi ara.</span>
              </div>
            )}

            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>Aktif Siparişler ({activeOrders.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {activeOrders.length === 0 && <div style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#8A7B6B' }}>Aktif sipariş yok</div>}
              {activeOrders.map(order => {
                const st = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending
                const mins = Math.round((now - new Date(order.created_at).getTime()) / 60000)
                const isLate = mins > 30 && order.status === 'preparing'
                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 8px rgba(74,44,14,0.06)', border: isLate ? '2px solid #DC2626' : '1px solid #E8E0D4', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>{st.label}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E' }}>#{order.order_number}</div>
                      <div style={{ fontSize: 12, color: '#8A7B6B' }}>{mins} dk önce</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#E8622A' }}>₺{parseFloat(order.subtotal ?? order.total_amount ?? 0).toFixed(0)}</div>
                    {isLate && <span style={{ fontSize: 18 }}>🚨</span>}
                  </div>
                )
              })}
            </div>

            {/* Son siparişler */}
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>Son Siparişler</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).slice(0, 10).map(order => {
                const st = STATUS_COLOR[order.status] ?? STATUS_COLOR.delivered
                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #E8E0D4', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{st.label}</div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#4A2C0E' }}>#{order.order_number}</div>
                    <div style={{ fontSize: 13, color: '#8A7B6B' }}>₺{parseFloat(order.subtotal ?? order.total_amount ?? 0).toFixed(0)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sağ - Şefler + Stok */}
          <div>
            {/* Şef durumları */}
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>Mutfak Durumu</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {chefs.slice(0, 8).map(chef => (
                <div key={chef.id} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #E8E0D4', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: chef.is_open ? '#059669' : '#9CA3AF', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#4A2C0E' }}>Şef #{chef.id.slice(0, 6)}</div>
                  <div style={{ fontSize: 11, color: chef.is_open ? '#059669' : '#9CA3AF', fontWeight: 600 }}>{chef.is_open ? 'Açık' : 'Kapalı'}</div>
                  {(chef.pending_approval || chef.verification_status === 'pending') && (
                    <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Onay Bekliyor</span>
                  )}
                </div>
              ))}
            </div>

            {/* Stok alarmı */}
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>⚠️ Stok Alarmı</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stock.length === 0 && <div style={{ background: 'white', borderRadius: 10, padding: 16, textAlign: 'center', color: '#8A7B6B', fontSize: 13 }}>✅ Stok normal</div>}
              {stock.map(item => (
                <div key={item.id} style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', border: '1px solid #F59E0B' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#4A2C0E' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>Son {item.remaining_stock} porsiyon kaldı!</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  )
}