// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const STEPS = ['Temel Bilgiler', 'Konum & Teslimat', 'Çalışma Saatleri']

const DAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar']

const KITCHEN_TYPES = [
  '🍲 Türk Mutfağı', '🥗 Vejetaryen', '🌱 Vegan',
  '🍮 Tatlılar', '🥐 Börek & Hamur', '🥣 Çorbalar',
  '🍟 Deniz Ürünleri', '🫕 Et Yemekleri',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const [locating, setLocating] = useState(false)

  const [form, setForm] = useState({
    bio:            '',
    kitchen_types:  [],
    city:           '',
    district:       '',
    lat:            null,
    lng:            null,
    delivery_types: ['delivery'],
    delivery_radius: 5,
    working_days:   ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma'],
    open_time:      '09:00',
    close_time:     '20:00',
  })

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/giris'); return }
      setUserId(data.user.id)
    })
  }, [router])

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const toggleArr = (key, val) => {
    setForm(prev => {
      const arr = prev[key]
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Tarayıcınız konum desteklemiyor.'); return }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        set('lat', lat)
        set('lng', lng)

        // Reverse geocoding ile şehir/ilçe al
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=tr`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.province || ''
          const district = data.address?.suburb || data.address?.district || data.address?.county || ''
          if (city) set('city', city)
          if (district) set('district', district)
        } catch {}

        setLocating(false)
      },
      err => {
        setError('Konum alınamadı. Lütfen manuel girin.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = async () => {
    if (!userId) return
    if (!form.city.trim()) { setError('Şehir giriniz.'); return }

    setLoading(true)
    setError('')

    try {
      const supabase = getSupabaseBrowserClient()

      const updateData = {
        bio:              form.bio.trim() || null,
        location_approx:  `${form.district ? form.district + ', ' : ''}${form.city}`,
        delivery_types:   form.delivery_types,
        delivery_radius_km: form.delivery_radius,
        working_hours: {
          days:  form.working_days,
          open:  form.open_time,
          close: form.close_time,
        },
        kitchen_types:      form.kitchen_types,
        verification_status: 'pending',
        pending_approval:    true,
      }

      // GPS koordinatları varsa PostGIS formatında kaydet
      if (form.lat && form.lng) {
        updateData.location = `SRID=4326;POINT(${form.lng} ${form.lat})`
      }

      const { error: err } = await supabase
        .from('chef_profiles')
        .update(updateData)
        .eq('user_id', userId)

      if (err) throw err

      router.push('/dashboard?onboarding=done')
    } catch (e) {
      setError(e.message ?? 'Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 0) return form.bio.length >= 20
    if (step === 1) return form.city.trim().length > 0 && form.delivery_types.length > 0
    return form.working_days.length > 0
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ background: 'white', borderBottom: '1px solid #E8E0D4', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: '#4A2C0E' }}>EV YEMEKLERİ</div>
        <div style={{ fontSize: 13, color: '#8A7B6B' }}>Aşçı Profili Kurulumu</div>
      </div>

      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i <= step ? '#E8622A' : '#E8E0D4',
                  color: i <= step ? 'white' : '#8A7B6B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{i < step ? '✓' : i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 4, background: '#E8E0D4', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: '#E8622A', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 6 }}>Adım {step + 1} / {STEPS.length} — {STEPS[step]}</div>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '32px', boxShadow: '0 2px 20px rgba(74,44,14,0.08)' }}>

          {/* ADIM 0: Temel Bilgiler */}
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', marginBottom: 6 }}>
                👩‍🍳 Kendini tanıt
              </h2>
              <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 24 }}>Müşteriler seni bu bilgilerle tanıyacak.</p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Hakkında <span style={{ color: '#E8622A' }}>*</span></label>
                <textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Yemek pişirmeye olan tutkunu, uzmanlık alanlarını ve tecrübeni anlat... (en az 20 karakter)"
                  rows={4}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                />
                <div style={{ fontSize: 11, color: form.bio.length < 20 ? '#E8622A' : '#8A7B6B', marginTop: 4, textAlign: 'right' }}>
                  {form.bio.length} / 20 min
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mutfak türleri <span style={{ color: '#8A7B6B', fontWeight: 400 }}>(isteğe bağlı)</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {KITCHEN_TYPES.map(k => (
                    <button key={k} type="button" onClick={() => toggleArr('kitchen_types', k)} style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: form.kitchen_types.includes(k) ? '#E8622A' : '#E8E0D4',
                      background: form.kitchen_types.includes(k) ? '#FEF0EB' : 'white',
                      color: form.kitchen_types.includes(k) ? '#E8622A' : '#4A2C0E',
                      fontFamily: 'inherit',
                    }}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADIM 1: Konum & Teslimat */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', marginBottom: 6 }}>
                📍 Konum & Teslimat
              </h2>
              <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 20 }}>
                Müşterilere yaklaşık konumun gösterilir, kesin adresin gizlenir.
              </p>

              {/* Konum butonu */}
              <button onClick={getLocation} disabled={locating} style={{
                width: '100%', padding: '12px', borderRadius: 12, marginBottom: 16,
                background: form.lat ? '#ECFDF5' : '#FEF3EC',
                border: `1.5px solid ${form.lat ? '#3D6B47' : '#E8622A'}`,
                color: form.lat ? '#3D6B47' : '#E8622A',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {locating ? '⏳ Konum alınıyor...' : form.lat ? `✅ Konum Alındı (${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : '📍 Konumumu Otomatik Al'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Şehir <span style={{ color: '#E8622A' }}>*</span></label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="İstanbul" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>İlçe</label>
                  <input value={form.district} onChange={e => set('district', e.target.value)}
                    placeholder="Kadıköy" style={inputStyle} />
                </div>
              </div>

              {form.lat && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#166534', marginBottom: 16 }}>
                  ✅ GPS koordinatları kaydedildi — keşfet sayfasında gerçek mesafe hesaplanacak
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Teslimat şekli <span style={{ color: '#E8622A' }}>*</span></label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[['delivery', '🛵 Teslimat'], ['pickup', '🚶 Gel-Al']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => toggleArr('delivery_types', val)} style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      border: '2px solid',
                      borderColor: form.delivery_types.includes(val) ? '#E8622A' : '#E8E0D4',
                      background: form.delivery_types.includes(val) ? '#FEF0EB' : 'white',
                      color: form.delivery_types.includes(val) ? '#E8622A' : '#4A2C0E',
                      fontFamily: 'inherit',
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {form.delivery_types.includes('delivery') && (
                <div>
                  <label style={labelStyle}>Teslimat yarıçapı: <strong style={{ color: '#E8622A' }}>{form.delivery_radius} km</strong></label>
                  <input type="range" min={1} max={15} step={1}
                    value={form.delivery_radius}
                    onChange={e => set('delivery_radius', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#E8622A' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8A7B6B', marginTop: 4 }}>
                    <span>1 km</span><span>15 km</span>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginTop: 12 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ADIM 2: Çalışma Saatleri */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', marginBottom: 6 }}>
                ⏰ Çalışma Saatleri
              </h2>
              <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 24 }}>Hangi günler ve saatlerde sipariş kabul edeceksin?</p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Çalışma günleri <span style={{ color: '#E8622A' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleArr('working_days', day)} style={{
                      padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: form.working_days.includes(day) ? '#3D6B47' : '#E8E0D4',
                      background: form.working_days.includes(day) ? '#EBF5EE' : 'white',
                      color: form.working_days.includes(day) ? '#3D6B47' : '#4A2C0E',
                      fontFamily: 'inherit',
                    }}>{day}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Açılış saati</label>
                  <input type="time" value={form.open_time}
                    onChange={e => set('open_time', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kapanış saati</label>
                  <input type="time" value={form.close_time}
                    onChange={e => set('close_time', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {error && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginTop: 16 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ ...btnSecondary, flex: 1 }}>
                ← Geri
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                style={{ ...btnPrimary(canNext()), flex: 1 }}>
                Devam Et →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || !canNext()}
                style={{ ...btnPrimary(!loading && canNext()), flex: 1 }}>
                {loading ? 'Kaydediliyor…' : '🚀 Profili Tamamla'}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#8A7B6B', marginTop: 20 }}>
          Profilin admin onayına gönderilecek. Onay 1–2 iş günü içinde tamamlanır.
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#7A4A20', marginBottom: 6,
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #E8E0D4', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none',
  color: '#4A2C0E',
}

const btnPrimary = (active) => ({
  padding: '13px 0', borderRadius: 12, border: 'none',
  background: active ? '#E8622A' : '#E8E0D4',
  color: active ? 'white' : '#8A7B6B',
  fontSize: 14, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed',
  fontFamily: 'inherit', transition: 'all 0.15s',
})

const btnSecondary = {
  padding: '13px 0', borderRadius: 12,
  border: '1.5px solid #E8E0D4', background: 'white',
  color: '#4A2C0E', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}