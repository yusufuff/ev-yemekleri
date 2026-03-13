'use client'
// @ts-nocheck
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function GirisPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!identifier || !password || loading) return
    setError('')
    setLoading(true)

    try {
      // Telefon mu email mi?
      let email = identifier
      if (identifier.match(/^[05]/)) {
        // Telefon girildi
        const digits = identifier.replace(/\D/g, '')
        const phone = digits.startsWith('90') ? '+' + digits : digits.startsWith('0') ? '+90' + digits.slice(1) : '+90' + digits
        email = phone.replace('+', '') + '@phone.evyemekleri.internal'
      }

      const supabase = getSupabase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError('Telefon/e-posta veya şifre hatalı.')
        return
      }

      // Role gore yonlendir
      const role = data.user?.user_metadata?.role
      window.location.href = role === 'chef' ? '/dashboard' : role === 'admin' ? '/admin' : '/'
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    const supabase = getSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/api/auth/callback' }
    })
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
        {/* Baslik */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍽️</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px', fontWeight: 900, color: 'var(--brown)', margin: '0 0 8px',
          }}>Hoş Geldiniz<span style={{ color: 'var(--orange)' }}>.</span></h1>
          <p style={{ fontSize: '14px', color: 'var(--gray)', margin: 0 }}>
            Hesabınız yok mu?{' '}
            <Link href="/kayit" style={{ color: 'var(--orange)', fontWeight: 600 }}>Kayıt Ol</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '6px' }}>
              Telefon veya E-posta
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="05XX XXX XX XX veya ornek@mail.com"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '6px' }}>
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Şifreniz"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--gray-light)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link href="/sifremi-unuttum" style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: 600 }}>
              Şifremi Unuttum
            </Link>
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#DC2626', marginBottom: '14px',
            }}>⚠️ {error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#ccc' : 'var(--orange)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginBottom: '16px',
            }}
          >{loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}</button>
        </form>

        {/* Ayrac */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-light)' }} />
          <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 500 }}>veya</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-light)' }} />
        </div>

        {/* Sosyal giris butonlari */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '11px 14px',
              background: 'white', border: '1.5px solid var(--gray-light)',
              borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', color: 'var(--brown)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'border-color 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#4285F4'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--gray-light)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          <button
            style={{
              width: '100%', padding: '11px 14px',
              background: 'black', border: '1.5px solid black',
              borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
            onClick={() => alert('Apple girişi yakında aktif olacak.')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple ile Giriş Yap
          </button>
        </div>
      </div>
    </div>
  )
}