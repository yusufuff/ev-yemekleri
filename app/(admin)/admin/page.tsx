'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div style={{ background:'white', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', borderTop:`3px solid ${color}`, position:'relative' }}>
      <div style={{ position:'absolute', right:16, top:16, fontSize:24, opacity:0.12 }}>{icon}</div>
      <div style={{ fontSize:11, color:'#8A7B6B', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#4A2C0E' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'#3D6B47', fontWeight:600, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

export const NAV_LINKS = [
  ['Dashboard',    '/admin'],
  ['Aşçılar',      '/admin/asciler'],
  ['Kullanıcılar', '/admin/kullanicilar'],
  ['Siparişler',   '/admin/siparisler'],
  ['Ödemeler',     '/admin/odemeler'],
  ['Üyelikler',    '/admin/uyelikler'],
  ['Yöneticiler',  '/admin/yoneticiler'],
]

export function AdminNav() {
  return (
    <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18 }}>ANNEELİM · Admin</div>
      <div style={{ display:'flex', gap:20 }}>
        {NAV_LINKS.map(([l, h]) => (
          <Link key={h} href={h} style={{ color:'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', fontWeight:500 }}>{l}</Link>
        ))}
      </div>
    </nav>
  )
}

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'#8A7B6B' }}>Yukleniyor...</div>

  const chart = stats?.chart ?? []
  const maxRevenue = Math.max(...chart.map((c: any) => c.revenue), 1)

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <AdminNav />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', marginBottom:24 }}>Dashboard</h1>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:28 }}>
          <StatCard label="Toplam Kullanıcı"  value={stats?.total_users?.toLocaleString('tr-TR')} icon="👥" color="#3B82F6" />
          <StatCard label="Toplam Aşçı"       value={stats?.total_chefs} icon="👩‍🍳" color="#E8622A" sub={`${stats?.pending_chefs} onay bekliyor`} />
          <StatCard label="Bu Hafta Sipariş"  value={stats?.total_orders?.toLocaleString('tr-TR')} icon="📦" color="#3D6B47" sub={`Bugün: ${stats?.today_orders}`} />
          <StatCard label="Haftalık Gelir"    value={`₺${stats?.week_revenue?.toLocaleString('tr-TR')}`} icon="💰" color="#F59E0B" sub={stats?.revenue_growth} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:20 }}>Haftalık Gelir</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:160, marginBottom:10 }}>
              {chart.map((c: any) => (
                <div key={c.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:10, color:'#8A7B6B' }}>₺{(c.revenue/1000).toFixed(1)}k</div>
                  <div style={{ width:'100%', background:'#E8622A', borderRadius:'4px 4px 0 0', height:`${(c.revenue/maxRevenue)*100}%`, opacity:0.8 }} />
                  <div style={{ fontSize:11, color:'#8A7B6B', fontWeight:600 }}>{c.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:4 }}>Hızlı Erişim</div>
            {[
              ['👩‍🍳', 'Aşçıları Yönet',   '/admin/asciler',      '#FEF3EC', '#E8622A'],
              ['👥',   'Kullanıcılar',      '/admin/kullanicilar', '#EFF6FF', '#3B82F6'],
              ['📦',   'Siparişler',        '/admin/siparisler',   '#ECFDF5', '#3D6B47'],
              ['💸',   'Ödemeler',          '/admin/odemeler',     '#FFFBEB', '#F59E0B'],
              ['🏷️',  'Üyelik Yönetimi',   '/admin/uyelikler',    '#F5F3FF', '#8B5CF6'],
              ['🔑',   'Yöneticiler',       '/admin/yoneticiler',  '#FEE2E2', '#DC2626'],
            ].map(([icon, label, href, bg, color]) => (
              <Link key={href} href={href} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background: bg, borderRadius:10, textDecoration:'none' }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <span style={{ fontWeight:600, fontSize:13, color:'#4A2C0E' }}>{label}</span>
                <span style={{ marginLeft:'auto', color, fontWeight:700, fontSize:13 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}