'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const ROLE_META: Record<string, {label: string; bg: string; color: string}> = {
  buyer: { label: '🛒 Alıcı', bg: '#EFF6FF', color: '#3B82F6' },
  chef:  { label: '👩‍🍳 Aşçı',  bg: '#FEF3C7', color: '#D97706' },
  admin: { label: '👑 Admin', bg: '#F3E8FF', color: '#9333EA' },
}

export default function AdminKullanicilarPage() {
  const [users,    setUsers]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [acting,   setActing]   = useState<string | null>(null)
  const [toast,    setToast]    = useState('')

  const LIMIT = 20

  const load = useCallback(async (p = page, q = search, r = filter) => {
    setLoading(true)
    const sp = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (q) sp.set('q', q)
    if (r !== 'all') sp.set('role', r)
    const res = await fetch('/api/admin/users?' + sp)
    const d   = await res.json()
    setUsers(d.users ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [page, search, filter])

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
    load(1, q, filter)
  }

  const handleFilter = (r: string) => {
    setFilter(r)
    setPage(1)
    load(1, search, r)
  }

  const handlePage = (p: number) => {
    setPage(p)
    load(p, search, filter)
  }

  const toggleBan = async (userId: string, isActive: boolean) => {
    setActing(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: isActive ? 'ban' : 'unban' }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
        showToast(isActive ? '🚫 Kullanıcı pasifleştirildi' : '✅ Kullanıcı aktifleştirildi')
      }
    } finally {
      setActing(null)
    }
  }

  const pages = Math.ceil(total / LIMIT)

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', gap:20, overflowX:'auto' }}>
        <Link href="/admin" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18, textDecoration:'none', flexShrink:0 }}>
          EV YEMEKLERİ · Admin
        </Link>
        {[['Dashboard','/admin'],['Aşçılar','/admin/asciler'],['Kullanıcılar','/admin/kullanicilar'],['Siparişler','/admin/siparisler'],['Ödemeler','/admin/odemeler']].map(([l,h]) => (
          <Link key={h} href={h} style={{ color: h==='/admin/kullanicilar' ? 'white' : 'rgba(255,255,255,0.65)', fontSize:13, textDecoration:'none', fontWeight: h==='/admin/kullanicilar' ? 700 : 400, flexShrink:0 }}>{l}</Link>
        ))}
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>

        {/* Başlık */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>Kullanıcılar</h1>
            <div style={{ fontSize:13, color:'#8A7B6B', marginTop:4 }}>Toplam {total.toLocaleString('tr-TR')} kullanıcı</div>
          </div>
        </div>

        {/* Filtreler */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="İsim veya telefon ara..."
            style={{ padding:'9px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontFamily:'inherit', width:240, outline:'none' }}
          />
          <div style={{ display:'flex', gap:8 }}>
            {[['all','Tümü'],['buyer','Alıcılar'],['chef','Aşçılar'],['admin','Adminler']].map(([val, label]) => (
              <button key={val} onClick={() => handleFilter(val)} style={{
                padding:'8px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer',
                border:'1.5px solid',
                borderColor: filter === val ? '#4A2C0E' : '#E8E0D4',
                background: filter === val ? '#4A2C0E' : 'white',
                color: filter === val ? 'white' : '#4A2C0E',
                fontFamily:'inherit',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Tablo */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#8A7B6B' }}>Yükleniyor…</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#8A7B6B' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
            <div>Kullanıcı bulunamadı</div>
          </div>
        ) : (
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr style={{ background:'#FAF6EF' }}>
                    {['Kullanıcı','Telefon','Rol','Durum','Kayıt','İşlem'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#8A7B6B', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #E8E0D4' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const role = ROLE_META[user.role] ?? ROLE_META.buyer
                    const isBusy = acting === user.id
                    return (
                      <tr key={user.id} style={{ borderBottom:'1px solid rgba(232,224,212,0.4)', transition:'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FDFAF6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        {/* İsim */}
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{
                              width:34, height:34, borderRadius:'50%',
                              background: user.role === 'chef' ? '#FEF3C7' : user.role === 'admin' ? '#F3E8FF' : '#EFF6FF',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:15, flexShrink:0,
                            }}>
                              {user.role === 'chef' ? '👩‍🍳' : user.role === 'admin' ? '👑' : '🛒'}
                            </div>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13, color:'#4A2C0E' }}>{user.full_name}</div>
                              <div style={{ fontSize:11, color:'#8A7B6B', marginTop:1 }}>
                                {user.id.slice(0, 8)}…
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Telefon */}
                        <td style={{ padding:'14px 16px', fontSize:13, color:'#5A4A3A' }}>
                          {user.phone ?? '—'}
                        </td>

                        {/* Rol */}
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ background:role.bg, color:role.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
                            {role.label}
                          </span>
                        </td>

                        {/* Durum */}
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{
                            background: user.is_active !== false ? '#ECFDF5' : '#FEE2E2',
                            color:      user.is_active !== false ? '#3D6B47' : '#DC2626',
                            fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
                          }}>
                            {user.is_active !== false ? '✅ Aktif' : '🚫 Pasif'}
                          </span>
                        </td>

                        {/* Kayıt tarihi */}
                        <td style={{ padding:'14px 16px', fontSize:12, color:'#8A7B6B' }}>
                          {new Date(user.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' })}
                        </td>

                        {/* İşlem */}
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => toggleBan(user.id, user.is_active !== false)}
                                disabled={isBusy}
                                style={{
                                  padding:'5px 12px', borderRadius:7, fontSize:11, fontWeight:700, cursor: isBusy ? 'not-allowed' : 'pointer',
                                  border:'1.5px solid',
                                  borderColor: user.is_active !== false ? '#FCA5A5' : '#86EFAC',
                                  background:  user.is_active !== false ? '#FEE2E2' : '#ECFDF5',
                                  color:       user.is_active !== false ? '#DC2626' : '#3D6B47',
                                  opacity: isBusy ? 0.6 : 1,
                                  fontFamily:'inherit',
                                }}
                              >
                                {isBusy ? '…' : user.is_active !== false ? '🚫 Pasifleştir' : '✅ Aktifleştir'}
                              </button>
                            )}
                            {user.role === 'chef' && (
                              <Link href={`/asci/${user.id}`} style={{
                                padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:700,
                                border:'1.5px solid #E8E0D4', background:'#F5EDD8', color:'#4A2C0E',
                                textDecoration:'none',
                              }}>
                                Profil →
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {pages > 1 && (
              <div style={{ padding:'12px 16px', borderTop:'1px solid #E8E0D4', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, color:'#8A7B6B' }}>
                  {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT, total)} / {total} kullanıcı
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => handlePage(page-1)} disabled={page === 1}
                    style={{ padding:'5px 12px', borderRadius:7, border:'1.5px solid #E8E0D4', background:'white', fontSize:12, fontWeight:600, cursor: page===1 ? 'not-allowed' : 'pointer', color:'#4A2C0E', opacity: page===1 ? 0.4 : 1 }}>
                    ← Önceki
                  </button>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button key={p} onClick={() => handlePage(p)}
                        style={{ padding:'5px 10px', borderRadius:7, border:'1.5px solid', borderColor: page===p ? '#E8622A' : '#E8E0D4', background: page===p ? '#E8622A' : 'white', color: page===p ? 'white' : '#4A2C0E', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => handlePage(page+1)} disabled={page === pages}
                    style={{ padding:'5px 12px', borderRadius:7, border:'1.5px solid #E8E0D4', background:'white', fontSize:12, fontWeight:600, cursor: page===pages ? 'not-allowed' : 'pointer', color:'#4A2C0E', opacity: page===pages ? 0.4 : 1 }}>
                    Sonraki →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#4A2C0E', color:'white', borderRadius:12, padding:'12px 20px', fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.15)', zIndex:999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}