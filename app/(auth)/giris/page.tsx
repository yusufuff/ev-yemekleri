'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || loading) return
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) {
        setError('E-posta veya sifre hatali.')
        return
      }

      // Önce user_metadata'dan rol al
      let role = data.user?.user_metadata?.role

      // Yoksa DB'den çek
      if (!role) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        role = profile?.role ?? undefined
      }

      window.location.href = role === 'chef' ? '/dashboard' : role === 'admin' ? '/admin' : '/'
    } catch {
      setError('Baglanti hatasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif", padding:16 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 4px 32px rgba(74,44,14,0.12)' }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'#4A2C0E', textDecoration:'none' }}>
            EV YEMEKLERI
          </Link>
          <div style={{ fontSize:13, color:'#8A7B6B', marginTop:6 }}>Hesabiniza giris yapin</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Sifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email.trim() || !password} style={{
            width:'100%', padding:'13px 0',
            background: loading || !email.trim() || !password ? '#E8E0D4' : '#E8622A',
            color: loading || !email.trim() || !password ? '#8A7B6B' : 'white',
            border:'none', borderRadius:10, fontSize:14, fontWeight:700,
            cursor: loading || !email.trim() || !password ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', marginBottom:10,
          }}>
            {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
          </button>

          <div style={{ textAlign:'right' }}>
            <Link href="/giris/sifre-sifirla" style={{ fontSize:12, color:'#E8622A', textDecoration:'none' }}>Sifremi Unuttum</Link>
          </div>
        </form>

        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #E8E0D4', textAlign:'center', fontSize:13, color:'#8A7B6B' }}>
          Hesabiniz yok mu?{' '}
          <Link href="/kayit" style={{ color:'#E8622A', fontWeight:700, textDecoration:'none' }}>Kayit Ol</Link>
        </div>
      </div>
    </div>
  )
}