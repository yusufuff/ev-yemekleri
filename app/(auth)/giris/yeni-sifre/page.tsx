'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function YeniSifrePage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) { setError(updateError.message); return }
      setDone(true)
      setTimeout(() => router.push('/giris'), 2000)
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
          <div style={{ fontSize:13, color:'#8A7B6B', marginTop:6 }}>Yeni şifrenizi belirleyin</div>
        </div>

        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#4A2C0E' }}>Şifre güncellendi!</div>
            <div style={{ fontSize:13, color:'#8A7B6B', marginTop:8 }}>Giriş sayfasına yönlendiriliyorsunuz...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Yeni Şifre</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter" autoFocus
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Şifre Tekrar</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px 0', background: loading ? '#E8E0D4' : '#E8622A',
              color: loading ? '#8A7B6B' : 'white', border:'none', borderRadius:10,
              fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            }}>{loading ? '⏳ Güncelleniyor...' : '🔒 Şifreyi Güncelle'}</button>
          </form>
        )}
      </div>
    </div>
  )
}