'use client'
import { useState } from 'react'

const MOCK_ADDRESSES = [
  { id: 'addr-1', label: 'Ev', icon: '🏠', name: 'Mehmet Yılmaz', address: 'Mimar Sinan Mah. Atatürk Cad. No:42 D:3', city: 'Seyhan, Adana', is_default: true },
  { id: 'addr-2', label: 'İş', icon: '💼', name: 'Mehmet Yılmaz', address: 'Çakmak Mah. Turhan Cemal Beriker Bul. No:145', city: 'Seyhan, Adana', is_default: false },
]

export default function AdreslerimPage() {
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: 'Ev', name: '', address: '', city: '' })

  const addAddress = () => {
    if (!form.address.trim()) return
    setAddresses(prev => [...prev, { id: `addr-${Date.now()}`, icon: form.label === 'Ev' ? '🏠' : form.label === 'İş' ? '💼' : '📍', is_default: false, ...form }])
    setForm({ label: 'Ev', name: '', address: '', city: '' })
    setShowForm(false)
  }

  const removeAddress = (id: string) => setAddresses(prev => prev.filter(a => a.id !== id))
  const setDefault = (id: string) => setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', margin:0 }}>Adreslerim</h1>
          <button onClick={() => setShowForm(!showForm)} style={{ padding:'10px 20px', background:'#E8622A', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            + Yeni Adres
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ background:'white', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 12px rgba(74,44,14,0.08)', border: addr.is_default ? '2px solid #3D6B47' : '1px solid rgba(232,224,212,0.6)', display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:44, height:44, background:'#F5EDD8', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{addr.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:'#4A2C0E' }}>{addr.label}</span>
                  {addr.is_default && <span style={{ background:'#ECFDF5', color:'#3D6B47', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>Varsayılan</span>}
                </div>
                <div style={{ fontSize:13, color:'#4A2C0E' }}>{addr.address}</div>
                <div style={{ fontSize:12, color:'#8A7B6B' }}>{addr.city}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {!addr.is_default && (
                  <button onClick={() => setDefault(addr.id)} style={{ padding:'6px 10px', background:'#ECFDF5', color:'#3D6B47', border:'none', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer' }}>✓ Varsayılan</button>
                )}
                <button onClick={() => removeAddress(addr.id)} style={{ width:32, height:32, background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:8, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', border:'1px solid rgba(232,224,212,0.6)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:18 }}>Yeni Adres Ekle</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Adres Etiketi</label>
              <div style={{ display:'flex', gap:8 }}>
                {['Ev', 'İş', 'Diğer'].map(l => (
                  <button key={l} onClick={() => setForm(p => ({...p, label: l}))} style={{
                    padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit',
                    background: form.label === l ? '#E8622A' : '#F5EDD8',
                    color: form.label === l ? 'white' : '#4A2C0E',
                  }}>{l === 'Ev' ? '🏠' : l === 'İş' ? '💼' : '📍'} {l}</button>
                ))}
              </div>
            </div>

            {[['Alıcı Adı', 'name', 'Kapıdaki kişi'], ['Açık Adres', 'address', 'Mahalle, cadde, sokak, bina no...'], ['İlçe, Şehir', 'city', 'Örn: Seyhan, Adana']].map(([label, key, placeholder]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                  placeholder={placeholder}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>
            ))}

            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={addAddress} style={{ flex:1, padding:'12px 0', background:'#E8622A', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>💾 Kaydet</button>
              <button onClick={() => setShowForm(false)} style={{ padding:'12px 20px', background:'#F5EDD8', color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>İptal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}