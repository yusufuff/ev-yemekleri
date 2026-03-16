'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function KayitPage() {
  const [form, setForm] = useState({ full_name:'', phone:'', email:'', password:'', role:'buyer' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form'|'otp'>('form')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')

    if (form.full_name.trim().length < 3) { setError('Ad en az 3 karakter olmalı.'); return }
    if (!form.phone.trim() && !form.email.trim()) { setError('Telefon veya e-posta gerekli.'); return }
    if (form.email && !form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return }
    if (form.email && form.password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }

    setLoading(true)

    try {
      if (form.email) {
        // E-posta ile kayıt
        const supabase = getSupabaseBrowserClient()
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name, role: form.role, phone: form.phone } }
        })
        if (signUpError) { setError(signUpError.message); return }
        // users tablosuna ekle
        if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            full_name: form.full_name,
            phone: form.phone || data.user.id.slice(0,10),
            role: form.role,
          }, { onConflict: 'id' })
        }
        window.location.href = form.role === 'chef' ? '/dashboard' : '/'
      } else {
        // Telefon ile kayıt - OTP gönder
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Kod gönderilemedi.'); return }
        // Profil bilgisini session'a kaydet
        sessionStorage.setItem('kayit_full_name', form.full_name)
        sessionStorage.setItem('kayit_role', form.role)
        window.location.href = '/giris/otp?phone=' + encodeURIComponent(form.phone) + '&kayit=1'
      }
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif", padding:16 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, width:'100%', maxWidth:440, boxShadow:'0 4px 32px rgba(74,44,14,0.12)' }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'#4A2C0E', textDecoration:'none' }}>
            EV YEMEKLERİ
          </Link>
          <div style={{ fontSize:13, color:'#8A7B6B', marginTop:6 }}>Yeni hesap oluşturun</div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Ad Soyad */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Ad Soyad *</label>
            <input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))}
              placeholder="Adınız Soyadınız"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>

          {/* Telefon */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Telefon Numarası</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
              placeholder="+90 555 123 45 67"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>

          {/* E-posta */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>E-posta <span style={{ color:'#8A7B6B', fontWeight:400 }}>(isteğe bağlı)</span></label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
              placeholder="ornek@mail.com"
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>

          {/* Şifre - sadece mail girilirse */}
          {form.email && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Şifre *</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                placeholder="En az 6 karakter"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
          )}

          {/* Rol seçimi */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:8 }}>Hesap Türü *</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['buyer','🛒','Alıcı','Sipariş ver'],['chef','👩‍🍳','Aşçı','Satış yap']].map(([r,icon,title,desc]) => (
                <button key={r} type="button" onClick={() => setForm(p => ({...p, role: r}))} style={{
                  padding:'14px 12px', borderRadius:12, border: `2px solid ${form.role === r ? '#E8622A' : '#E8E0D4'}`,
                  background: form.role === r ? '#FEF3EC' : 'white',
                  cursor:'pointer', textAlign:'center', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#4A2C0E' }}>{title}</div>
                  <div style={{ fontSize:11, color:'#8A7B6B' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:13, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>⚠️ {error}</div>}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'13px 0', background: loading ? '#E8E0D4' : '#E8622A',
            color: loading ? '#8A7B6B' : 'white', border:'none', borderRadius:10,
            fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          }}>{loading ? '⏳ Kayıt olunuyor...' : '✨ Kayıt Ol'}</button>

        </form>

        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #E8E0D4', textAlign:'center', fontSize:13, color:'#8A7B6B' }}>
          Zaten hesabınız var mı?{' '}
          <Link href="/giris" style={{ color:'#E8622A', fontWeight:700, textDecoration:'none' }}>Giriş Yap</Link>
        </div>
      </div>
    </div>
  )
}