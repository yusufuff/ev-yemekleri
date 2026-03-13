'use client'
// @ts-nocheck
import React, { useState } from 'react'
import Link from 'next/link'

export default function KayitPage() {
  const [role, setRole] = useState('buyer')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [referral, setReferral] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) { setError('Ad ve soyad zorunlu.'); return }
    if (!phone.match(/^05[0-9]{9}$/)) { setError('Geçerli bir telefon numarası girin.'); return }
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); return }
    if (!terms) { setError('Kullanım koşullarını kabul etmeniz gerekiyor.'); return }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: firstName.trim() + ' ' + lastName.trim(),
          phone: '+90' + phone.replace(/^0/, ''),
          password,
          role,
          referral: referral.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Kayıt başarısız.'); return }

      if (json.access_token && json.refresh_token) {
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token })
      }
      window.location.href = role === 'chef' ? '/dashboard' : '/?welcome=1'
    } catch { setError('Bağlantı hatası.') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'12px 14px', border:'1.5px solid #E8E0D4',
    borderRadius:'10px', fontSize:'14px', fontFamily:'inherit',
    outline:'none', boxSizing:'border-box', color:'#3D1F0A',
  }
  const labelStyle: React.CSSProperties = {
    fontSize:'12px', fontWeight:700, color:'#5A3A1A', display:'block', marginBottom:'7px',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{
        background:'white', borderRadius:'20px', padding:'40px 36px',
        width:'100%', maxWidth:'440px',
        boxShadow:'0 4px 32px rgba(74,44,14,0.08)',
        border:'1px solid rgba(232,224,212,0.6)',
      }}>
        {/* Baslik */}
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>✨</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'26px', fontWeight:900, color:'#3D1F0A', margin:'0 0 6px' }}>
            Yeni Hesap Oluştur
          </h1>
          <p style={{ fontSize:'13px', color:'#8A7B6B', margin:0 }}>Ücretsiz üye olun</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Rol Secimi */}
          <div style={{ display:'flex', gap:'12px', marginBottom:'20px' }}>
            {[
              { val:'buyer', icon:'🛒', label:'Alıcı', sub:'Sipariş vermek için' },
              { val:'chef', icon:'👩\u200d🍳', label:'Aşçı', sub:'Yemek satmak için' },
            ].map(({ val, icon, label, sub }) => (
              <button key={val} type="button" onClick={() => setRole(val)} style={{
                flex:1, padding:'14px 10px', borderRadius:'12px', cursor:'pointer',
                border: role === val ? '2px solid #E8622A' : '2px solid #E8E0D4',
                background: role === val ? '#FFF5EF' : 'white',
                textAlign:'center', fontFamily:'inherit',
              }}>
                <div style={{ fontSize:'24px', marginBottom:'6px' }}>{icon}</div>
                <div style={{ fontSize:'14px', fontWeight:700, color: role === val ? '#E8622A' : '#3D1F0A' }}>{label}</div>
                <div style={{ fontSize:'11px', color:'#8A7B6B', marginTop:'2px' }}>{sub}</div>
              </button>
            ))}
          </div>

          {/* Ad Soyad */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
            <div>
              <label style={labelStyle}>Ad</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Adınız" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Soyad</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Soyadınız" style={inputStyle} required />
            </div>
          </div>

          {/* Telefon */}
          <div style={{ marginBottom:'14px' }}>
            <label style={labelStyle}>Telefon *</label>
            <input type="tel" value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,11))}
              placeholder="O5XX XXX XX XX" style={inputStyle} required />
          </div>

          {/* Sifre */}
          <div style={{ marginBottom:'14px' }}>
            <label style={labelStyle}>Şifre *</label>
            <div style={{ position:'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                style={{ ...inputStyle, paddingRight:'42px' }} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Referans Kodu */}
          <div style={{ marginBottom:'16px' }}>
            <label style={labelStyle}>Referans Kodu <span style={{ fontWeight:400, color:'#8A7B6B' }}>(isteğe bağlı)</span></label>
            <input type="text" value={referral} onChange={e => setReferral(e.target.value)}
              placeholder="Örn: FTM-2847" style={inputStyle} />
          </div>

          {/* Kullanim kosullari */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', fontSize:'13px', color:'#5A3A1A', cursor:'pointer', lineHeight:'1.5' }}>
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
                style={{ width:'16px', height:'16px', marginTop:'2px', accentColor:'#E8622A', flexShrink:0 }} />
              <span>
                <Link href="/kullanim-kosullari" style={{ color:'#E8622A', fontWeight:700 }}>Kullanım Koşulları</Link>
                {' '}ve{' '}
                <Link href="/gizlilik" style={{ color:'#E8622A', fontWeight:700 }}>Gizlilik Politikası</Link>
                {'\u2019nı okudum, kabul ediyorum.'}
              </span>
            </label>
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#DC2626', marginBottom:'14px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading || !terms} style={{
            width:'100%', padding:'14px',
            background: (loading || !terms) ? '#ccc' : '#E8622A',
            color:'white', border:'none', borderRadius:'12px',
            fontSize:'15px', fontWeight:700,
            cursor: (loading || !terms) ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', marginBottom:'16px',
          }}>
            {loading ? 'Kaydediliyor...' : 'Ücretsiz Üye Ol →'}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:'13px', color:'#8A7B6B', margin:0 }}>
          Zaten hesabın var mı?{' '}
          <Link href="/giris" style={{ color:'#E8622A', fontWeight:700, textDecoration:'none' }}>Giriş Yap</Link>
        </p>
      </div>
    </div>
  )
}