// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar']

const KITCHEN_TYPES = [
  '🍲 Türk Mutfağı', '🥗 Vejetaryen', '🌱 Vegan',
  '🍮 Tatlılar', '🥐 Börek & Hamur', '🥣 Çorbalar',
  '🐟 Deniz Ürünleri', '🫕 Et Yemekleri',
]

export default function AsciAyarlarPage() {
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [tab,      setTab]      = useState('profil')

  const [form, setForm] = useState({
    full_name:        '',
    bio:              '',
    location_approx:  '',
    delivery_types:   ['delivery'] as string[],
    delivery_radius_km: 5,
    kitchen_types:    [] as string[],
    open_time:        '09:00',
    close_time:       '20:00',
    working_days:     ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma'] as string[],
    is_open:          true,
  })

  useEffect(() => {
    fetch('/api/chef/profile').then(r => r.json()).then(d => {
      if (d.profile) {
        const wh = d.profile.working_hours ?? {}
        setForm({
          full_name:          d.user?.full_name ?? '',
          bio:                d.profile.bio ?? '',
          location_approx:    d.profile.location_approx ?? '',
          delivery_types:     d.profile.delivery_types ?? ['delivery'],
          delivery_radius_km: d.profile.delivery_radius_km ?? 5,
          kitchen_types:      d.profile.kitchen_types ?? [],
          open_time:          wh.open  ?? '09:00',
          close_time:         wh.close ?? '20:00',
          working_days:       wh.days  ?? ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma'],
          is_open:            d.profile.is_open ?? true,
        })
      }
      setLoading(false)
    })
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }))

  const toggleArr = (key: string, val: string) => {
    setForm(prev => {
      const arr: string[] = prev[key as keyof typeof prev] as string[]
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/chef/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:          form.full_name,
          bio:                form.bio,
          location_approx:    form.location_approx,
          delivery_types:     form.delivery_types,
          delivery_radius_km: form.delivery_radius_km,
          kitchen_types:      form.kitchen_types,
          is_open:            form.is_open,
          working_hours: {
            days:  form.working_days,
            open:  form.open_time,
            close: form.close_time,
          },
        }),
      })
      if (res.ok) showToast('✅ Profil kaydedildi')
      else showToast('⚠️ Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: any = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #E8E0D4', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit',
    boxSizing: 'border-box', outline: 'none', color: '#4A2C0E',
  }

  const labelStyle: any = {
    fontSize: 12, fontWeight: 700, color: '#7A4A20',
    display: 'block', marginBottom: 6,
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'#8A7B6B' }}>
      Yükleniyor…
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:'white', borderBottom:'1px solid #E8E0D4', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/dashboard" style={{ color:'#8A7B6B', textDecoration:'none', fontSize:13 }}>← Dashboard</Link>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:'#4A2C0E', margin:0 }}>Profil Ayarları</h1>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          padding:'8px 20px', background: saving ? '#F28B5E' : '#E8622A',
          color:'white', border:'none', borderRadius:10, fontSize:13,
          fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        }}>
          {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
        </button>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px' }}>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:0, marginBottom:24, background:'white', borderRadius:12, padding:4, boxShadow:'0 1px 8px rgba(74,44,14,0.06)' }}>
          {[['profil','👤 Profil'], ['teslimat','🛵 Teslimat'], ['saatler','⏰ Saatler']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer',
              background: tab === key ? '#E8622A' : 'transparent',
              color: tab === key ? 'white' : '#8A7B6B',
              fontSize:13, fontWeight:700, fontFamily:'inherit',
              transition:'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Profil Tab */}
        {tab === 'profil' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Açık/Kapalı toggle */}
            <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E' }}>Mağaza Durumu</div>
                <div style={{ fontSize:13, color: form.is_open ? '#3D6B47' : '#8A7B6B', marginTop:4 }}>
                  {form.is_open ? '🟢 Şu an açık — sipariş alınıyor' : '🔴 Şu an kapalı'}
                </div>
              </div>
              <div onClick={() => set('is_open', !form.is_open)} style={{
                width:52, height:28, borderRadius:14, cursor:'pointer',
                background: form.is_open ? '#3D6B47' : '#E8E0D4',
                position:'relative', transition:'background 0.2s',
              }}>
                <div style={{
                  width:22, height:22, borderRadius:'50%', background:'white',
                  position:'absolute', top:3, left: form.is_open ? 27 : 3,
                  transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>

            <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>Kişisel Bilgiler</h2>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Ad Soyad</label>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Hakkında</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                  rows={4} placeholder="Kendinizi ve mutfağınızı tanıtın…"
                  style={{ ...inputStyle, resize:'none', lineHeight:1.6 }} />
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Konum (yaklaşık)</label>
                <input value={form.location_approx} onChange={e => set('location_approx', e.target.value)}
                  placeholder="Örn: Kadıköy, İstanbul" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Mutfak Türleri</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {KITCHEN_TYPES.map(k => (
                    <button key={k} type="button" onClick={() => toggleArr('kitchen_types', k)} style={{
                      padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer',
                      border:'1.5px solid',
                      borderColor: form.kitchen_types.includes(k) ? '#E8622A' : '#E8E0D4',
                      background: form.kitchen_types.includes(k) ? '#FEF0EB' : 'white',
                      color: form.kitchen_types.includes(k) ? '#E8622A' : '#4A2C0E',
                      fontFamily:'inherit',
                    }}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teslimat Tab */}
        {tab === 'teslimat' && (
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>Teslimat Ayarları</h2>

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Teslimat Şekli</label>
              <div style={{ display:'flex', gap:12 }}>
                {[['delivery','🛵 Teslimat'], ['pickup','🚶 Gel-Al']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => toggleArr('delivery_types', val)} style={{
                    flex:1, padding:'12px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer',
                    border:'2px solid',
                    borderColor: form.delivery_types.includes(val) ? '#E8622A' : '#E8E0D4',
                    background: form.delivery_types.includes(val) ? '#FEF0EB' : 'white',
                    color: form.delivery_types.includes(val) ? '#E8622A' : '#4A2C0E',
                    fontFamily:'inherit',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {form.delivery_types.includes('delivery') && (
              <div>
                <label style={labelStyle}>
                  Teslimat Yarıçapı: <strong style={{ color:'#E8622A' }}>{form.delivery_radius_km} km</strong>
                </label>
                <input type="range" min={1} max={15} step={1}
                  value={form.delivery_radius_km}
                  onChange={e => set('delivery_radius_km', Number(e.target.value))}
                  style={{ width:'100%', accentColor:'#E8622A' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#8A7B6B', marginTop:4 }}>
                  <span>1 km</span><span>15 km</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saatler Tab */}
        {tab === 'saatler' && (
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>Çalışma Saatleri</h2>

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Çalışma Günleri</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleArr('working_days', day)} style={{
                    padding:'8px 14px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer',
                    border:'1.5px solid',
                    borderColor: form.working_days.includes(day) ? '#3D6B47' : '#E8E0D4',
                    background: form.working_days.includes(day) ? '#EBF5EE' : 'white',
                    color: form.working_days.includes(day) ? '#3D6B47' : '#4A2C0E',
                    fontFamily:'inherit',
                  }}>{day}</button>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={labelStyle}>Açılış Saati</label>
                <input type="time" value={form.open_time}
                  onChange={e => set('open_time', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Kapanış Saati</label>
                <input type="time" value={form.close_time}
                  onChange={e => set('close_time', e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Kaydet butonu (alt) */}
        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', marginTop:20, padding:'14px 0',
          background: saving ? '#F28B5E' : '#E8622A',
          color:'white', border:'none', borderRadius:12,
          fontSize:15, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        }}>
          {saving ? 'Kaydediliyor…' : '💾 Değişiklikleri Kaydet'}
        </button>

      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#4A2C0E', color:'white', borderRadius:12, padding:'12px 20px', fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.15)', zIndex:999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}