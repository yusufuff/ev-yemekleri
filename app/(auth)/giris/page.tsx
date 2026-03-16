'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type LoginMethod = 'phone' | 'email'

export default function GirisPage() {
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Kod gönderilemedi.'); return }
      window.location.href = '/giris/otp?phone=' + encodeURIComponent(phone.trim())
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || loading) return
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError('E-posta veya şifre hatalı.'); return }
      const role = data.user?.user_metadata?.role
      window.location.href = role === 'chef' ? '/dashboard' : role === 'admin' ? '/admin' : '/'
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif", padding:16 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 4px 32px rgba(74,44,14,0.12)' }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'#4A2C0E', textDecoration:'none' }}>
            EV YEMEKLERİ
          </Link>
          <div style={{ fontSize:13, color:'#8A7B6B', marginTop:6 }}>Hesabınıza giriş yapın</div>
        </div>

        {/* Yöntem seçimi */}
        <div style={{ display:'flex', background:'#F5EDD8', borderRadius:10, padding:4, marginBottom:24 }}>
          {[['phone','📱 Telefon'],['email','📧 E-posta']].map(([m, label]) => (
            <button key={m} onClick={() => { setMethod(m as LoginMethod); setError('') }} style={{
              flex:1, padding:'8px 0', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
              background: method === m ? 'white' : 'transparent',
              color: method === m ? '#E8622A' : '#8A7B6B',
              boxShadow: method === m ? '0 1px 4px rgba(74,44,14,0.1)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {method === 'phone' ? (
          <form onSubmit={handlePhone}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Telefon Numarası</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+90 555 123 45 67"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }}
                autoFocus />
            </div>
            {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading || !phone.trim()} style={{
              width:'100%', padding:'13px 0', background: loading ? '#E8E0D4' : '#E8622A',
              color: loading ? '#8A7B6B' : 'white', border:'none', borderRadius:10,
              fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            }}>{loading ? '⏳ Gönderiliyor...' : '📱 Kod Gönder'}</button>
          </form>
        ) : (
          <form onSubmit={handleEmail}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }}
                autoFocus />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Şifre</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading || !email.trim() || !password} style={{
              width:'100%', padding:'13px 0', background: loading ? '#E8E0D4' : '#E8622A',
              color: loading ? '#8A7B6B' : 'white', border:'none', borderRadius:10,
              fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', marginBottom:10,
            }}>{loading ? '⏳ Giriş yapılıyor...' : 'Giriş Yap'}</button>
            <div style={{ textAlign:'right' }}>
              <Link href="/giris/sifre-sifirla" style={{ fontSize:12, color:'#E8622A', textDecoration:'none' }}>Şifremi Unuttum</Link>
            </div>
          </form>
        )}

        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #E8E0D4', textAlign:'center', fontSize:13, color:'#8A7B6B' }}>
          Hesabınız yok mu?{' '}
          <Link href="/kayit" style={{ color:'#E8622A', fontWeight:700, textDecoration:'none' }}>Kayıt Ol</Link>
        </div>
      </div>
    </div>
  )
}