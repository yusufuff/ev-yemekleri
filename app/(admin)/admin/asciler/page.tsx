'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminAscilerPage() {
  const [chefs, setChefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/chefs').then(r => r.json()).then(d => { setChefs(d.chefs ?? []); setLoading(false) })
  }, [])

  const BADGE_META: Record<string, string> = { new:'🌱 Yeni', trusted:'⭐ Güvenilir', master:'🏅 Usta', chef:'👑 Şef' }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:24 }}>
        <Link href="/admin" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18, textDecoration:'none' }}>EV YEMEKLERİ · Admin</Link>
        {[['Dashboard','/admin'],['Aşçılar','/admin/asciler'],['Kullanıcılar','/admin/kullanicilar'],['Siparişler','/admin/siparisler'],['Ödemeler','/admin/odemeler']].map(([l,h])=>(
          <Link key={h} href={h} style={{ color:'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none' }}>{l}</Link>
        ))}
      </nav>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', marginBottom:20 }}>Aşçılar</h1>
        {loading ? <div style={{ textAlign:'center', padding:48, color:'#8A7B6B' }}>Yükleniyor…</div> : (
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAF6EF' }}>
                  {['Ad Soyad','Telefon','Rozet','Puan','Sipariş','Durum','İşlem'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8A7B6B', textTransform:'uppercase', borderBottom:'1px solid #E8E0D4' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chefs.map(chef => (
                  <tr key={chef.id} style={{ borderBottom:'1px solid rgba(232,224,212,0.4)' }}>
                    <td style={{ padding:'14px 16px', fontWeight:600, color:'#4A2C0E' }}>{chef.full_name}</td>
                    <td style={{ padding:'14px 16px', fontSize:13, color:'#8A7B6B' }}>{chef.phone}</td>
                    <td style={{ padding:'14px 16px' }}><span style={{ fontSize:12, fontWeight:600, color:'#D97706' }}>{BADGE_META[chef.badge] ?? chef.badge}</span></td>
                    <td style={{ padding:'14px 16px', fontSize:13 }}>⭐ {chef.avg_rating}</td>
                    <td style={{ padding:'14px 16px', fontSize:13, color:'#4A2C0E', fontWeight:600 }}>{chef.total_orders}</td>
                    <td style={{ padding:'14px 16px' }}>
                      {chef.pending_approval
                        ? <span style={{ background:'#FEF3C7', color:'#D97706', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>⏳ Onay Bekliyor</span>
                        : chef.is_active
                          ? <span style={{ background:'#ECFDF5', color:'#3D6B47', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>✅ Aktif</span>
                          : <span style={{ background:'#FEE2E2', color:'#DC2626', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>❌ Pasif</span>
                      }
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        {chef.pending_approval && <button style={{ padding:'5px 10px', background:'#ECFDF5', color:'#3D6B47', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>✅ Onayla</button>}
                        <button style={{ padding:'5px 10px', background:'#F5EDD8', color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>Detay</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}