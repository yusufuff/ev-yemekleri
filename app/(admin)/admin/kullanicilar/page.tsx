'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ROLE_META: Record<string, {label: string; bg: string; color: string}> = {
  buyer: { label: 'Alıcı', bg: '#EFF6FF', color: '#3B82F6' },
  chef:  { label: 'Aşçı',  bg: '#FEF3C7', color: '#D97706' },
  admin: { label: 'Admin', bg: '#F3E8FF', color: '#9333EA' },
}

export default function AdminKullanicilarPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users ?? []); setLoading(false) })
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
    const matchFilter = filter === 'all' || u.role === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:24 }}>
        <Link href="/admin" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18, textDecoration:'none' }}>EV YEMEKLERİ · Admin</Link>
        {[['Dashboard','/admin'],['Aşçılar','/admin/asciler'],['Kullanıcılar','/admin/kullanicilar'],['Siparişler','/admin/siparisler'],['Ödemeler','/admin/odemeler']].map(([l,h])=>(
          <Link key={h} href={h} style={{ color: h==='/admin/kullanicilar' ? 'white' : 'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', fontWeight: h==='/admin/kullanicilar' ? 700 : 400 }}>{l}</Link>
        ))}
      </nav>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>Kullanıcılar</h1>
          <div style={{ display:'flex', gap:10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya telefon ara..."
              style={{ padding:'8px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', width:220 }} />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding:'8px 12px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit' }}>
              <option value="all">Tümü</option>
              <option value="buyer">Alıcılar</option>
              <option value="chef">Aşçılar</option>
            </select>
          </div>
        </div>

        {loading ? <div style={{ textAlign:'center', padding:48, color:'#8A7B6B' }}>Yükleniyor…</div> : (
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAF6EF' }}>
                  {['Ad Soyad','Telefon','Rol','Sipariş','Durum','Kayıt Tarihi','İşlem'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8A7B6B', textTransform:'uppercase', borderBottom:'1px solid #E8E0D4' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const role = ROLE_META[user.role] ?? ROLE_META.buyer
                  return (
                    <tr key={user.id} style={{ borderBottom:'1px solid rgba(232,224,212,0.4)' }}>
                      <td style={{ padding:'14px 16px', fontWeight:600, color:'#4A2C0E' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'#E8622A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:700, flexShrink:0 }}>
                            {user.full_name.charAt(0)}
                          </div>
                          {user.full_name}
                        </div>
                      </td>
                      <td style={{ padding:'14px 16px', fontSize:13, color:'#8A7B6B' }}>{user.phone}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background:role.bg, color:role.color, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>{role.label}</span>
                      </td>
                      <td style={{ padding:'14px 16px', fontSize:13, fontWeight:600, color:'#4A2C0E' }}>{user.order_count}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background: user.is_active ? '#ECFDF5' : '#FEE2E2', color: user.is_active ? '#3D6B47' : '#DC2626', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>
                          {user.is_active ? '✅ Aktif' : '❌ Pasif'}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px', fontSize:12, color:'#8A7B6B' }}>{new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <button style={{ padding:'5px 10px', background:'#F5EDD8', color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>
                          {user.is_active ? '🚫 Pasifleştir' : '✅ Aktifleştir'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding:'12px 16px', background:'#FAF6EF', fontSize:12, color:'#8A7B6B', borderTop:'1px solid #E8E0D4' }}>
              Toplam {filtered.length} kullanıcı
            </div>
          </div>
        )}
      </div>
    </div>
  )
}