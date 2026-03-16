'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SifreSifirlaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.anneelim.com/giris/yeni-sifre',
      })
      if (resetError) { setError(resetError.message); return }
      setSent(true)
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
          <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'#4A2C0E', textDecoration:'none' }}>EV YEMEKLERİ</Link>
          <div style={{ fontSize:13, color:'#8A7B6B', marginTop:6 }}>Şifrenizi sıfırlayın</div>
        </div>

        {sent ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#4A2C0E', marginBottom:8 }}>Mail Gönderildi!</div>
            <div style={{ fontSize:13, color:'#8A7B6B', lineHeight:1.6, marginBottom:20 }}>
              <strong>{email}</strong> adresine şifre sıfırlama linki gönderdik. Gelen kutunuzu kontrol edin.
            </div>
            <Link href="/giris" style={{ display:'inline-block', padding:'10px 24px', background:'#E8622A', color:'white', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:13 }}>
              Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>E-posta Adresi</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com" autoFocus
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading || !email.trim()} style={{
              width:'100%', padding:'13px 0', background: loading ? '#E8E0D4' : '#E8622A',
              color: loading ? '#8A7B6B' : 'white', border:'none', borderRadius:10,
              fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', marginBottom:16,
            }}>{loading ? '⏳ Gönderiliyor...' : '🔒 Sıfırlama Linki Gönder'}</button>
            <div style={{ textAlign:'center' }}>
              <Link href="/giris" style={{ fontSize:13, color:'#E8622A', textDecoration:'none', fontWeight:600 }}>← Giriş sayfasına dön</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}