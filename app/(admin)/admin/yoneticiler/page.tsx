// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'

export default function YoneticilerPage() {
  const [yoneticiler, setYoneticiler] = useState([])
  const [loading, setLoading] = useState(true)
  const [yeniEmail, setYeniEmail] = useState('')
  const [yeniIsim, setYeniIsim] = useState('')
  const [ekleniyor, setEkleniyor] = useState(false)
  const [siliyor, setSiliyor] = useState(null)
  const [hata, setHata] = useState('')
  const [basari, setBasari] = useState('')

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    try {
      const res = await fetch('/api/admin/yoneticiler')
      const json = await res.json()
      setYoneticiler(json.admins ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const ekle = async (e) => {
    e.preventDefault()
    setHata(''); setBasari(''); setEkleniyor(true)
    try {
      const res = await fetch('/api/admin/yoneticiler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: yeniEmail, full_name: yeniIsim }),
      })
      const json = await res.json()
      if (!res.ok) { setHata(json.error); return }
      setBasari(`${yeniIsim} başarıyla yönetici olarak eklendi.`)
      setYeniEmail(''); setYeniIsim(''); yukle()
    } catch { setHata('Bir hata oluştu.') } finally { setEkleniyor(false) }
  }

  const sil = async (id, isim) => {
    if (!confirm(`${isim} adlı yöneticiyi silmek istediğinize emin misiniz?`)) return
    setSiliyor(id)
    try {
      const res = await fetch('/api/admin/yoneticiler', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (res.ok) yukle()
    } catch { alert('Hata oluştu.') } finally { setSiliyor(null) }
  }

  const formatTarih = (t) => new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 4 }}>Yöneticiler</h1>
      <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 24 }}>Admin paneline erişim yetkisi olan kişiler.</p>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Mevcut Yöneticiler ({yoneticiler.length})</div>
        {loading ? (
          <div style={{ color: '#8A7B6B', textAlign: 'center', padding: 24 }}>Yükleniyor...</div>
        ) : yoneticiler.length === 0 ? (
          <div style={{ color: '#8A7B6B', textAlign: 'center', padding: 24 }}>Henüz yönetici eklenmemiş</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Ad Soyad','E-posta','Eklenme Tarihi','İşlem'].map(h => (
                  <th key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8A7B6B', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #E8E0D4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yoneticiler.map(y => (
                <tr key={y.id}>
                  <td style={{ padding: '14px', borderBottom: '1px solid rgba(232,224,212,0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#DC2626' }}>{y.full_name?.charAt(0) ?? '?'}</div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#4A2C0E' }}>{y.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', borderBottom: '1px solid rgba(232,224,212,0.4)', fontSize: 13, color: '#8A7B6B' }}>{y.email}</td>
                  <td style={{ padding: '14px', borderBottom: '1px solid rgba(232,224,212,0.4)', fontSize: 13, color: '#8A7B6B' }}>{formatTarih(y.created_at)}</td>
                  <td style={{ padding: '14px', borderBottom: '1px solid rgba(232,224,212,0.4)' }}>
                    <button onClick={() => sil(y.id, y.full_name)} disabled={siliyor === y.id}
                      style={{ padding: '6px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {siliyor === y.id ? 'Siliniyor...' : 'Yetkiyi Kaldır'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 8 }}>Yeni Yönetici Ekle</div>
        <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 16 }}>Eklenen kişi /admin/giris adresinden email ve admin şifresiyle giriş yapabilir.</p>

        {hata && <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>❌ {hata}</div>}
        {basari && <div style={{ background: '#ECFDF5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', marginBottom: 16 }}>✅ {basari}</div>}

        <form onSubmit={ekle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A2C0E', display: 'block', marginBottom: 6 }}>Ad Soyad</label>
              <input value={yeniIsim} onChange={e => setYeniIsim(e.target.value)} placeholder="Ahmet Yılmaz" required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A2C0E', display: 'block', marginBottom: 6 }}>E-posta</label>
              <input type="email" value={yeniEmail} onChange={e => setYeniEmail(e.target.value)} placeholder="ahmet@example.com" required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button type="submit" disabled={ekleniyor}
            style={{ padding: '12px 24px', background: '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: ekleniyor ? 0.7 : 1 }}>
            {ekleniyor ? 'Ekleniyor...' : '+ Yönetici Ekle'}
          </button>
        </form>
      </div>
    </div>
  )
}