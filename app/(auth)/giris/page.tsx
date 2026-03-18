'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: 'https://www.anneelim.com/auth/callback',
          shouldCreateUser: true,
        },
      })
      if (signInError) {
        setError('Link gonderilemedi: ' + signInError.message)
        return
      }
      setSent(true)
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

        {sent ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#4A2C0E', marginBottom:10 }}>
              Mail kutunuzu kontrol edin
            </div>
            <div style={{ fontSize:13, color:'#8A7B6B', lineHeight:1.6, marginBottom:20 }}>
              <strong>{email}</strong> adresine giris linki gonderdik. Linke tiklayarak giris yapabilirsiniz.
            </div>
            <button onClick={() => { setSent(false); setEmail('') }} style={{
              background:'none', border:'1.5px solid #E8E0D4', borderRadius:10,
              padding:'10px 20px', fontSize:13, color:'#8A7B6B', cursor:'pointer', fontFamily:'inherit',
            }}>
              Farkli mail ile dene
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink}>
            <div style={{ background:'#F5EDD8', borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:13, color:'#7A4A20', lineHeight:1.6 }}>
              E-posta adresinizi girin, size giris linki gondeRelim. Sifre gerekmez.
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>E-posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }}
                autoFocus
              />
            </div>

            {error && (
              <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !email.trim()} style={{
              width:'100%', padding:'13px 0',
              background: loading || !email.trim() ? '#E8E0D4' : '#E8622A',
              color: loading || !email.trim() ? '#8A7B6B' : 'white',
              border:'none', borderRadius:10, fontSize:14, fontWeight:700,
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>
              {loading ? 'Gonderiliyor...' : 'Giris Linki Gonder'}
            </button>
          </form>
        )}

        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #E8E0D4', textAlign:'center', fontSize:13, color:'#8A7B6B' }}>
          Hesabiniz yok mu?{' '}
          <Link href="/kayit" style={{ color:'#E8622A', fontWeight:700, textDecoration:'none' }}>Kayit Ol</Link>
        </div>
      </div>
    </div>
  )
}