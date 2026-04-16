'use client'
import { useState, useEffect } from 'react'

export default function AdminAyarlarPage() {
  const [mevcutSifre, setMevcutSifre]   = useState('')
  const [yeniSifre, setYeniSifre]       = useState('')
  const [yeniSifre2, setYeniSifre2]     = useState('')
  const [sifreMsg, setSifreMsg]         = useState<{tip:'basari'|'hata', metin:string}|null>(null)
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)

  const [yeniEmail, setYeniEmail]       = useState('')
  const [yoneticiMsg, setYoneticiMsg]   = useState<{tip:'basari'|'hata', metin:string}|null>(null)
  const [yoneticiYukleniyor, setYoneticiYukleniyor] = useState(false)
  const [yoneticiler, setYoneticiler]   = useState<any[]>([])

  useEffect(() => { yoneticileriYukle() }, [])

  const yoneticileriYukle = async () => {
    const res = await fetch('/api/admin/yoneticiler')
    const json = await res.json()
    setYoneticiler(json.yoneticiler ?? [])
  }

  const sifreDegistir = async () => {
    setSifreMsg(null)
    if (!mevcutSifre || !yeniSifre || !yeniSifre2) { setSifreMsg({ tip: 'hata', metin: 'Tum alanlari doldurun.' }); return }
    if (yeniSifre !== yeniSifre2) { setSifreMsg({ tip: 'hata', metin: 'Yeni sifreler eslesmiyor.' }); return }
    if (yeniSifre.length < 6) { setSifreMsg({ tip: 'hata', metin: 'Sifre en az 6 karakter olmali.' }); return }

    setSifreYukleniyor(true)
    try {
      const res = await fetch('/api/admin/sifre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mevcutSifre, yeniSifre }),
      })
      const json = await res.json()
      if (!res.ok) { setSifreMsg({ tip: 'hata', metin: json.error ?? 'Hata olustu.' }); return }
      setSifreMsg({ tip: 'basari', metin: 'Sifre basariyla degistirildi!' })
      setMevcutSifre(''); setYeniSifre(''); setYeniSifre2('')
    } catch { setSifreMsg({ tip: 'hata', metin: 'Baglanti hatasi.' }) }
    finally { setSifreYukleniyor(false) }
  }

  const yoneticiEkle = async () => {
    setYoneticiMsg(null)
    if (!yeniEmail.trim()) { setYoneticiMsg({ tip: 'hata', metin: 'Email gerekli.' }); return }
    setYoneticiYukleniyor(true)
    try {
      const res = await fetch('/api/admin/yoneticiler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: yeniEmail.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (!res.ok) { setYoneticiMsg({ tip: 'hata', metin: json.error ?? 'Hata olustu.' }); return }
      setYoneticiMsg({ tip: 'basari', metin: yeniEmail + ' yonetici olarak eklendi.' })
      setYeniEmail('')
      yoneticileriYukle()
    } catch { setYoneticiMsg({ tip: 'hata', metin: 'Baglanti hatasi.' }) }
    finally { setYoneticiYukleniyor(false) }
  }

  const yoneticiSil = async (id: string, email: string) => {
    if (!confirm(email + ' yoneticiden kaldirilsin mi?')) return
    await fetch('/api/admin/yoneticiler', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    yoneticileriYukle()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: '#4A2C0E', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="/admin" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, color: 'white', fontSize: 18, textDecoration: 'none' }}>ANNEELIM · Admin</a>
        {[['Dashboard','/admin'],['Asccilar','/admin/asciler'],['Siparisler','/admin/siparisler'],['Ayarlar','/admin/ayarlar']].map(([l,h])=>(
          <a key={h} href={h} style={{ color: h==='/admin/ayarlar' ? 'white' : 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none', fontWeight: h==='/admin/ayarlar' ? 700 : 400 }}>{l}</a>
        ))}
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 24px' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>Ayarlar</h1>

        {/* Sifre Degistir */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>🔐 Sifre Degistir</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Sifre degistirince mobil admin paneline de yeni sifre ile girersin.</p>

          {sifreMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: sifreMsg.tip === 'basari' ? '#f0fdf4' : '#fef2f2', color: sifreMsg.tip === 'basari' ? '#15803d' : '#dc2626', fontSize: 13, fontWeight: 600 }}>
              {sifreMsg.metin}
            </div>
          )}

          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Mevcut Sifre</label>
          <input type="password" value={mevcutSifre} onChange={e => setMevcutSifre(e.target.value)} placeholder="Mevcut sifreniz" style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, marginTop: 12 }}>Yeni Sifre</label>
          <input type="password" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} placeholder="En az 6 karakter" style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, marginTop: 12 }}>Yeni Sifre (Tekrar)</label>
          <input type="password" value={yeniSifre2} onChange={e => setYeniSifre2(e.target.value)} placeholder="Yeni sifrenizi tekrar girin" style={inputStyle} />

          <button onClick={sifreDegistir} disabled={sifreYukleniyor} style={btnStyle}>
            {sifreYukleniyor ? 'Kaydediliyor...' : 'Sifreyi Degistir'}
          </button>
        </div>

        {/* Yoneticiler */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>👑 Yoneticiler</h2>

          {yoneticiler.map(y => (
            <div key={y.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{y.full_name ?? '-'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{y.email}</div>
              </div>
              <button onClick={() => yoneticiSil(y.id, y.email)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Kaldir
              </button>
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 10 }}>Yeni Yonetici Ekle</h3>
            {yoneticiMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 10, background: yoneticiMsg.tip === 'basari' ? '#f0fdf4' : '#fef2f2', color: yoneticiMsg.tip === 'basari' ? '#15803d' : '#dc2626', fontSize: 13, fontWeight: 600 }}>
                {yoneticiMsg.metin}
              </div>
            )}
            <input type="email" value={yeniEmail} onChange={e => setYeniEmail(e.target.value)} placeholder="ornek@email.com" style={inputStyle} />
            <button onClick={yoneticiEkle} disabled={yoneticiYukleniyor} style={{ ...btnStyle, marginTop: 10 }}>
              {yoneticiYukleniyor ? 'Ekleniyor...' : 'Yonetici Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e0e0e0',
  fontSize: 14, color: '#1a1a1a', background: '#f9f9f9', boxSizing: 'border-box', marginBottom: 4,
}

const btnStyle: React.CSSProperties = {
  background: '#E8622A', color: '#fff', border: 'none', borderRadius: 12,
  padding: '12px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 16,
}