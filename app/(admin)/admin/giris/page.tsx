'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminGirisPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [sifreGoster, setSifreGoster] = useState(false)

  const girisYap = async (e: any) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      const res = await fetch('/api/admin/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre }),
      })
      const json = await res.json()
      if (!res.ok) { setHata(json.error ?? 'Giriş başarısız.'); return }
      router.push('/admin')
      router.refresh()
    } catch {
      setHata('Bir hata oluştu, tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#4A2C0E', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ background:'white', borderRadius:20, padding:40, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color:'#4A2C0E' }}>ANNEELİM</div>
          <div style={{ fontSize:13, color:'#8A7B6B', marginTop:4 }}>Admin Paneli</div>
        </div>

        <form onSubmit={girisYap}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#4A2C0E', display:'block', marginBottom:6 }}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@anneelim.com"
              required
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#4A2C0E', display:'block', marginBottom:6 }}>Şifre</label>
            <div style={{ position:'relative' }}>
              <input
                type={sifreGoster ? 'text' : 'password'}
                value={sifre}
                onChange={e => setSifre(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width:'100%', padding:'12px 44px 12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}
              />
              <button
                type="button"
                onClick={() => setSifreGoster(p => !p)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#8A7B6B' }}
              >
                {sifreGoster ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {hata && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#DC2626', marginBottom:16 }}>
              ❌ {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            style={{ width:'100%', padding:'14px 0', background:'#4A2C0E', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: yukleniyor ? 0.7 : 1 }}
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20 }}>
          <a href="/" style={{ fontSize:12, color:'#8A7B6B', textDecoration:'none' }}>← Ana sayfaya dön</a>
        </div>
      </div>
    </div>
  )
}