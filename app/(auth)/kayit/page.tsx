'use client'
// @ts-nocheck
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function KayitPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('Ad en az 3 karakter olmalı.')
      return
    }
    if (!phone.match(/^05[0-9]{9}$/)) {
      setError('Geçerli bir telefon numarası girin (05XX XXX XX XX).')
      return
    }
    if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setError('Geçerli bir e-posta adresi girin.')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: '+90' + phone.replace(/^0/, ''),
          email: email.trim() || null,
          password,
          role,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Kayıt başarısız.')
        return
      }

      if (json.access_token && json.refresh_token) {
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        })
      }

      window.location.href = role === 'chef' ? '/dashboard' : '/?welcome=1'
    } catch (err) {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid var(--gray-light)', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)',
    display: 'block', marginBottom: '6px',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 4px 24px rgba(74,44,14,0.10)',
        border: '1px solid rgba(232,224,212,0.8)',
      }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--orange)',
            background: '#FEF3EC', padding: '4px 10px',
            borderRadius: '20px', display: 'inline-block', marginBottom: '14px',
          }}>Yeni Hesap</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px', fontWeight: 900,
            color: 'var(--brown)', margin: '0 0 8px',
          }}>Kayıt Ol<span style={{ color: 'var(--orange)' }}>.</span></h1>
          <p style={{ fontSize: '14px', color: 'var(--gray)', margin: 0 }}>
            Zaten hesabın var mı?{' '}
            <Link href="/giris" style={{ color: 'var(--orange)', fontWeight: 600 }}>Giriş Yap</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Ad Soyad */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Ad Soyad *</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Adınız Soyadınız" style={inputStyle} required />
          </div>

          {/* Telefon */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Telefon *</label>
            <input type="tel" value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="05XX XXX XX XX" style={inputStyle} required />
          </div>

          {/* E-posta */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>
              E-posta{' '}
              <span style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 400 }}>
                (isteğe bağlı — bildirimler için önerilir)
              </span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ornek@mail.com" style={inputStyle} />
          </div>

          {/* Sifre */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Şifre *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="En az 6 karakter" style={inputStyle} required />
          </div>

          {/* Hesap Turu */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Hesap Türü</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { val: 'buyer', icon: '🛒', label: 'Alıcı' },
                { val: 'chef', icon: '👩\u200d🍳', label: 'Aşçı' },
              ].map(({ val, icon, label }) => (
                <button key={val} type="button" onClick={() => setRole(val)} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  border: role === val ? '2px solid var(--orange)' : '2px solid var(--gray-light)',
                  background: role === val ? '#FEF3EC' : 'white',
                  color: role === val ? 'var(--orange)' : 'var(--gray)',
                  fontWeight: 600, fontSize: '13px', fontFamily: 'inherit',
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#DC2626', marginBottom: '14px',
            }}>⚠️ {error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? 'var(--gray)' : 'var(--orange)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>
            {loading ? 'Kaydediliyor...' : '✨ Hesap Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}