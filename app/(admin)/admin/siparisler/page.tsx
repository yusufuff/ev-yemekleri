'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const STATUS_META: Record<string, {label: string; bg: string; color: string}> = {
  pending:    { label: 'Bekliyor',     bg: '#FEF3C7', color: '#D97706' },
  confirmed:  { label: 'Onaylandı',   bg: '#EFF6FF', color: '#3B82F6' },
  preparing:  { label: 'Hazırlanıyor',bg: '#F3E8FF', color: '#9333EA' },
  on_the_way: { label: 'Yolda',       bg: '#ECFDF5', color: '#3D6B47' },
  delivered:  { label: 'Teslim',      bg: '#ECFDF5', color: '#3D6B47' },
  cancelled:  { label: 'İptal',       bg: '#FEE2E2', color: '#DC2626' },
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 60) return `${diff} dk önce`
  if (diff < 1440) return `${Math.floor(diff/60)} sa önce`
  return `${Math.floor(diff/1440)} gün önce`
}

export default function AdminSiparislerPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/orders').then(r => r.json()).then(d => { setOrders(d.orders ?? []); setLoading(false) })
    const interval = setInterval(() => {
      fetch('/api/admin/orders').then(r => r.json()).then(d => setOrders(d.orders ?? []))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:24 }}>
        <Link href="/admin" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18, textDecoration:'none' }}>EV YEMEKLERİ · Admin</Link>
        {[['Dashboard','/admin'],['Aşçılar','/admin/asciler'],['Kullanıcılar','/admin/kullanicilar'],['Siparişler','/admin/siparisler'],['Ödemeler','/admin/odemeler']].map(([l,h])=>(
          <Link key={h} href={h} style={{ color: h==='/admin/siparisler' ? 'white' : 'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', fontWeight: h==='/admin/siparisler' ? 700 : 400 }}>{l}</Link>
        ))}
      </nav>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>Siparişler</h1>
            <p style={{ color:'#8A7B6B', fontSize:13, margin:'4px 0 0' }}>30 saniyede bir otomatik güncellenir</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['all','pending','preparing','delivered','cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit',
                background: filter === s ? '#E8622A' : 'white', color: filter === s ? 'white' : '#8A7B6B',
                boxShadow:'0 1px 4px rgba(74,44,14,0.08)',
              }}>
                {s === 'all' ? 'Tümü' : STATUS_META[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ textAlign:'center', padding:48, color:'#8A7B6B' }}>Yükleniyor…</div> : (
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAF6EF' }}>
                  {['Sipariş','Alıcı','Aşçı','Durum','Tutar','Zaman'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8A7B6B', textTransform:'uppercase', borderBottom:'1px solid #E8E0D4' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const status = STATUS_META[order.status] ?? STATUS_META.pending
                  return (
                    <tr key={order.id} style={{ borderBottom:'1px solid rgba(232,224,212,0.4)' }}>
                      <td style={{ padding:'14px 16px', fontWeight:700, fontSize:13, color:'#4A2C0E' }}>#{order.id.slice(-4)}</td>
                      <td style={{ padding:'14px 16px', fontSize:13, color:'#4A2C0E' }}>{order.buyer_name}</td>
                      <td style={{ padding:'14px 16px', fontSize:13, color:'#4A2C0E' }}>👩‍🍳 {order.chef_name}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background:status.bg, color:status.color, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>{status.label}</span>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:"'Playfair Display',serif", fontWeight:700, color:'#E8622A' }}>₺{order.total_amount}</td>
                      <td style={{ padding:'14px 16px', fontSize:12, color:'#8A7B6B' }}>{timeAgo(order.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding:'12px 16px', background:'#FAF6EF', fontSize:12, color:'#8A7B6B', borderTop:'1px solid #E8E0D4' }}>
              {filtered.length} sipariş gösteriliyor
            </div>
          </div>
        )}
      </div>
    </div>
  )
}