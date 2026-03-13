'use client'
// @ts-nocheck
import React, { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function GirisPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!phone || !password || loading) return
    setError('')
    setLoading(true)
    try {
      const digits = phone.replace(/\D/g, '')
      const normalized = digits.startsWith('90') ? '+' + digits : digits.startsWith('0') ? '+90' + digits.slice(1) : '+90' + digits
      const email = normalized.replace('+', '') + '@phone.evyemekleri.internal'

      const supabase = getSupabase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError('Telefon numarası veya şifre hatalı.'); return }

      const role = data.user?.user_metadata?.role
      window.location.href = role === 'chef' ? '/dashboard' : role === 'admin' ? '/admin' : '/'
    } catch { setError('Bağlantı hatası.') }
    finally { setLoading(false) }
  }

  async function handleGoogle() {
    const supabase = getSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/api/auth/callback' }
    })
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{
        background:'white', borderRadius:'20px', padding:'40px 36px',
        width:'100%', maxWidth:'400px',
        boxShadow:'0 4px 32px rgba(74,44,14,0.08)',
        border:'1px solid rgba(232,224,212,0.6)',
      }}>
        {/* Baslik */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>👋</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'26px', fontWeight:900, color:'#3D1F0A', margin:'0 0 6px' }}>
            Tekrar Hoş Geldiniz
          </h1>
          <p style={{ fontSize:'13px', color:'#8A7B6B', margin:0 }}>Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Telefon */}
          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'12px', fontWeight:700, color:'#5A3A1A', display:'block', marginBottom:'7px' }}>
              Telefon Numarası
            </label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,11))}
              placeholder="O5XX XXX XX XX"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', color:'#3D1F0A' }}
              required
            />
          </div>

          {/* Sifre */}
          <div style={{ marginBottom:'10px' }}>
            <label style={{ fontSize:'12px', fontWeight:700, color:'#5A3A1A', display:'block', marginBottom:'7px' }}>
              Şifre
            </label>
            <div style={{ position:'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width:'100%', padding:'12px 42px 12px 14px', border:'1.5px solid #E8E0D4', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', color:'#3D1F0A' }}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Beni hatirla + Sifremi unuttum */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <label style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'13px', color:'#5A3A1A', cursor:'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ width:'15px', height:'15px', accentColor:'#E8622A' }} />
              Beni hatırla
            </label>
            <Link href="/sifremi-unuttum" style={{ fontSize:'13px', color:'#E8622A', fontWeight:600, textDecoration:'none' }}>
              Şifremi Unuttum
            </Link>
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#DC2626', marginBottom:'14px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'14px', background: loading ? '#ccc' : '#E8622A',
            color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', marginBottom:'16px',
          }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
          </button>
        </form>

        {/* Ayrac */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
          <div style={{ flex:1, height:'1px', background:'#E8E0D4' }} />
          <span style={{ fontSize:'12px', color:'#8A7B6B' }}>veya</span>
          <div style={{ flex:1, height:'1px', background:'#E8E0D4' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} style={{
          width:'100%', padding:'12px 14px', background:'white',
          border:'1.5px solid #E8E0D4', borderRadius:'12px', fontSize:'14px', fontWeight:600,
          cursor:'pointer', fontFamily:'inherit', color:'#3D1F0A',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'10px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile Giriş Yap
        </button>

        {/* Apple */}
        <button onClick={() => alert('Apple girişi yakında aktif olacak.')} style={{
          width:'100%', padding:'12px 14px', background:'white',
          border:'1.5px solid #E8E0D4', borderRadius:'12px', fontSize:'14px', fontWeight:600,
          cursor:'pointer', fontFamily:'inherit', color:'#3D1F0A',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'20px',
        }}>
          🍎 Apple ile Giriş Yap
        </button>

        <p style={{ textAlign:'center', fontSize:'13px', color:'#8A7B6B', margin:0 }}>
          Hesabın yok mu?{' '}
          <Link href="/kayit" style={{ color:'#E8622A', fontWeight:700, textDecoration:'none' }}>Kayıt Ol</Link>
        </p>
      </div>
    </div>
  )
}