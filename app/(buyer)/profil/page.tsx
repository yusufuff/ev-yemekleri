'use client'
import { useState } from 'react'

export default function ProfilPage() {
  const [form, setForm] = useState({
    full_name: 'Mehmet Yılmaz',
    phone: '+90 532 987 65 43',
    email: 'mehmet@gmail.com',
    role: 'buyer',
  })
  const [saved, setSaved] = useState(false)
  const [notifs, setNotifs] = useState({
    orders: true, favorites: true, reviews: true, campaigns: false, stock: true,
  })

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'24px 16px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', marginBottom:24 }}>
          Profil & Ayarlar
        </h1>

        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Profil Bilgileri */}
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:18 }}>Kişisel Bilgiler</div>

            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#E8622A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:700, flexShrink:0 }}>
                {form.full_name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E' }}>{form.full_name}</div>
                <div style={{ fontSize:12, color:'#8A7B6B', marginTop:2 }}>{form.role === 'buyer' ? '🛒 Alıcı' : '👩‍🍳 Aşçı'}</div>
              </div>
            </div>

            {[['Ad Soyad', 'full_name', 'text'], ['Telefon', 'phone', 'tel'], ['E-posta', 'email', 'email']].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }}
                />
              </div>
            ))}

            <button onClick={save} style={{ padding:'10px 24px', background: saved ? '#3D6B47' : '#E8622A', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s' }}>
              {saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
            </button>
          </div>

          {/* Bildirimler */}
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:18 }}>Bildirim Tercihleri</div>
            {[
              ['orders',    '📦 Sipariş Güncellemeleri', 'Onay, hazırlık, teslimat'],
              ['favorites', '👩‍🍳 Favori Aşçı Bildirimleri', 'Yeni menü paylaşımları'],
              ['reviews',   '⭐ Değerlendirme Hatırlatması', 'Teslimdan 30 dk sonra'],
              ['campaigns', '🎁 Kampanya & Fırsatlar', 'Promosyon bildirimleri'],
              ['stock',     '📉 Stok Uyarısı', 'Favori yemeklerde son porsiyon'],
            ].map(([key, title, desc]) => (
              <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:14, marginBottom:14, borderBottom:'1px solid #F5EDD8' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#4A2C0E' }}>{title}</div>
                  <div style={{ fontSize:11, color:'#8A7B6B', marginTop:2 }}>{desc}</div>
                </div>
                <button onClick={() => setNotifs(p => ({ ...p, [key]: !p[key as keyof typeof notifs] }))} style={{
                  width:44, height:24, borderRadius:12, border:'none',
                  background: notifs[key as keyof typeof notifs] ? '#3D6B47' : '#E8E0D4',
                  cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0,
                }}>
                  <div style={{
                    width:18, height:18, borderRadius:'50%', background:'white',
                    position:'absolute', top:3,
                    left: notifs[key as keyof typeof notifs] ? 23 : 3,
                    transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          {/* Hesap */}
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:18 }}>Hesap Güvenliği</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button style={{ padding:'10px 16px', background:'#F5EDD8', color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                🔒 Şifre Değiştir
              </button>
              <button style={{ padding:'10px 16px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                🗑️ Hesabı Sil
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}