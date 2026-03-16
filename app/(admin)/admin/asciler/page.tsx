'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const BADGE_META: Record<string, { label: string; bg: string; color: string }> = {
  new:     { label: '🌱 Yeni',      bg: '#F3F4F6', color: '#6B7280' },
  trusted: { label: '⭐ Güvenilir', bg: '#D1FAE5', color: '#059669' },
  master:  { label: '🏅 Usta',      bg: '#FEF3C7', color: '#D97706' },
  chef:    { label: '👑 Şef',       bg: '#FEF3C7', color: '#B45309' },
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: '⏳ Onay Bekliyor', bg: '#FEF3C7', color: '#D97706' },
  approved: { label: '✅ Onaylı',        bg: '#ECFDF5', color: '#059669' },
  rejected: { label: '❌ Reddedildi',    bg: '#FEE2E2', color: '#DC2626' },
}

export default function AdminAscilerPage() {
  const [chefs, setChefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadChefs = () => {
    fetch('/api/admin/chefs').then(r => r.json()).then(d => { setChefs(d.chefs ?? []); setLoading(false) })
  }

  useEffect(() => { loadChefs() }, [])

  const updateStatus = async (chefId: string, status: string) => {
    setActionLoading(chefId)
    try {
      await fetch('/api/admin/chefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chef_id: chefId, verification_status: status }),
      })
      setChefs(prev => prev.map(c => c.id === chefId ? { ...c, verification_status: status, pending_approval: false } : c))
    } finally {
      setActionLoading(null)
    }
  }

  const updateBadge = async (chefId: string, badge: string) => {
    setActionLoading(chefId + badge)
    try {
      await fetch('/api/admin/chefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chef_id: chefId, badge }),
      })
      setChefs(prev => prev.map(c => c.id === chefId ? { ...c, badge } : c))
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = chefs.filter(c => c.pending_approval || c.verification_status === 'pending').length

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:24 }}>
        <Link href="/admin" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18, textDecoration:'none' }}>EV YEMEKLERİ · Admin</Link>
        {[['Dashboard','/admin'],['Aşçılar','/admin/asciler'],['Kullanıcılar','/admin/kullanicilar'],['Siparişler','/admin/siparisler'],['Ödemeler','/admin/odemeler']].map(([l,h])=>(
          <Link key={h} href={h} style={{ color: h==='/admin/asciler' ? 'white' : 'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', fontWeight: h==='/admin/asciler' ? 700 : 400 }}>{l}</Link>
        ))}
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>Aşçılar</h1>
            {pendingCount > 0 && (
              <div style={{ fontSize:13, color:'#D97706', fontWeight:600, marginTop:4 }}>
                ⚠️ {pendingCount} aşçı onay bekliyor
              </div>
            )}
          </div>
        </div>

        {loading ? <div style={{ textAlign:'center', padding:48, color:'#8A7B6B' }}>Yükleniyor…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {chefs.map(chef => {
              const status = STATUS_META[chef.verification_status ?? 'pending']
              const badge = BADGE_META[chef.badge ?? 'new']
              const isPending = chef.pending_approval || chef.verification_status === 'pending'
              return (
                <div key={chef.id} style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', border: isPending ? '2px solid #F59E0B' : '1px solid rgba(232,224,212,0.6)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    {/* Avatar */}
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#FDE68A,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>👩‍🍳</div>

                    {/* Bilgiler */}
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontWeight:700, fontSize:16, color:'#4A2C0E' }}>{chef.full_name}</div>
                      <div style={{ fontSize:12, color:'#8A7B6B', marginTop:2 }}>{chef.phone}</div>
                      <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                        <span style={{ background:status.bg, color:status.color, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>{status.label}</span>
                        <span style={{ background:badge.bg, color:badge.color, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>{badge.label}</span>
                        <span style={{ fontSize:11, color:'#8A7B6B' }}>⭐ {chef.avg_rating ?? '-'} · {chef.total_orders} sipariş</span>
                      </div>
                    </div>

                    {/* Aksiyonlar */}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      {/* Onay/Red butonları */}
                      {(isPending || chef.verification_status !== 'approved') && (
                        <button
                          onClick={() => updateStatus(chef.id, 'approved')}
                          disabled={actionLoading === chef.id}
                          style={{ padding:'8px 16px', background:'#ECFDF5', color:'#059669', border:'1.5px solid #059669', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          ✅ Onayla
                        </button>
                      )}
                      {chef.verification_status === 'approved' && (
                        <button
                          onClick={() => updateStatus(chef.id, 'rejected')}
                          disabled={actionLoading === chef.id}
                          style={{ padding:'8px 16px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          🚫 Askıya Al
                        </button>
                      )}
                      {chef.verification_status === 'rejected' && (
                        <button
                          onClick={() => updateStatus(chef.id, 'approved')}
                          style={{ padding:'8px 16px', background:'#ECFDF5', color:'#059669', border:'1.5px solid #059669', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          ✅ Tekrar Onayla
                        </button>
                      )}

                      {/* Rozet güncelle */}
                      <select
                        value={chef.badge ?? 'new'}
                        onChange={e => updateBadge(chef.id, e.target.value)}
                        style={{ padding:'8px 12px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:12, fontFamily:'inherit', cursor:'pointer', color:'#4A2C0E' }}>
                        <option value="new">🌱 Yeni Aşçı</option>
                        <option value="trusted">⭐ Güvenilir</option>
                        <option value="master">🏅 Usta Eller</option>
                        <option value="chef">👑 Ev Şefi</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}