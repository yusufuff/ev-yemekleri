// app/(buyer)/profil/ProfilForm.tsx - Client Component
'use client'
// @ts-nocheck
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ProfilForm({ user, chefData }) {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone,
    email: user.email,
  })
  const [chefForm, setChefForm] = useState({
    bio: chefData?.bio ?? '',
    iban: chefData?.iban ?? '',
    radius: chefData?.delivery_radius_km ?? 5,
    min_order: chefData?.min_order_amount ?? 40,
  })
  const [notifs, setNotifs] = useState({ orders: true, favorites: true, reviews: true, campaigns: false, stock: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationSaved, setLocationSaved] = useState(false)

  const isChef = user.role === 'chef'
  const displayName = form.full_name || user.full_name || 'İsim girilmemiş'

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          bio: chefForm.bio,
          iban: chefForm.iban,
          delivery_radius_km: chefForm.radius,
          min_order_amount: chefForm.min_order,
        }),
      })
      const json = await res.json()
      if (!res.ok) { alert('Hata: ' + json.error); return }
      setSaved(true)
      setTimeout(() => { setSaved(false); router.refresh() }, 1000)
    } catch (e) {
      alert('Bir sorun oluştu')
    } finally {
      setSaving(false)
    }
  }

  const konumuGuncelle = () => {
    if (!navigator.geolocation) { alert('Tarayıcınız konum desteklemiyor.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const supabase = getSupabaseBrowserClient() as any
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (!authUser) return

          // PostGIS formatında kaydet
          await supabase
            .rpc('update_chef_location', {
              p_user_id: authUser.id,
              p_lat: lat,
              p_lng: lng
            })

          setLocationSaved(true)
          setTimeout(() => setLocationSaved(false), 3000)
        } catch (e) {
          alert('Konum kaydedilemedi.')
        }
        setLocating(false)
      },
      () => { alert('Konum alınamadı.'); setLocating(false) }
    )
  }

  const cikisYap = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center', border: `2px solid ${!isChef ? '#E8622A' : '#E8E0D4'}`, background: !isChef ? '#FEF3EC' : 'white', color: !isChef ? '#E8622A' : '#8A7B6B', fontWeight: 700, fontSize: 14 }}>
          🛒 Alıcı {!isChef && '✓'}
        </div>
        <div style={{ flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center', border: `2px solid ${isChef ? '#E8622A' : '#E8E0D4'}`, background: isChef ? '#FEF3EC' : 'white', color: isChef ? '#E8622A' : '#8A7B6B', fontWeight: 700, fontSize: 14 }}>
          👩‍🍳 Aşçı {isChef && '✓'}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Kişisel Bilgiler</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8622A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 2 }}>{isChef ? '👩‍🍳 Aşçı' : '🛒 Alıcı'}</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Ad Soyad</label>
          <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Telefon</label>
          <input type="tel" value={form.phone}
            onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 11) setForm(p => ({ ...p, phone: val })) }}
            maxLength={11} placeholder="05XXXXXXXXX"
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>E-posta</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }} />
        </div>

        <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px 0', background: saved ? '#3D6B47' : '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s', opacity: saving ? 0.7 : 1 }}>
          {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Bilgileri Kaydet'}
        </button>
      </div>

      {isChef && (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Aşçı Ayarları</div>

          {/* Konum Güncelle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Konum</label>
            <button onClick={konumuGuncelle} disabled={locating} style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: locating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              background: locationSaved ? '#ECFDF5' : '#FEF3EC',
              border: `1.5px solid ${locationSaved ? '#3D6B47' : '#E8622A'}`,
              color: locationSaved ? '#3D6B47' : '#E8622A',
            }}>
              {locating ? '⏳ Konum alınıyor...' : locationSaved ? '✅ Konum Güncellendi!' : '📍 Konumumu Güncelle'}
            </button>
            <div style={{ fontSize: 11, color: '#8A7B6B', marginTop: 4 }}>
              Keşfet sayfasında doğru mesafe hesabı için konumunu güncelle
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Biyografi</label>
            <textarea value={chefForm.bio} onChange={e => setChefForm(p => ({ ...p, bio: e.target.value }))} rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>IBAN</label>
            <input value={chefForm.iban} onChange={e => setChefForm(p => ({ ...p, iban: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 8 }}>
              Teslimat Yarıçapı: <span style={{ color: '#E8622A' }}>{chefForm.radius} km</span>
            </label>
            <input type="range" min={1} max={10} value={chefForm.radius} onChange={e => setChefForm(p => ({ ...p, radius: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#E8622A' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Min. Sipariş Tutarı (₺)</label>
            <input type="number" value={chefForm.min_order} onChange={e => setChefForm(p => ({ ...p, min_order: Number(e.target.value) }))}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Bildirim Tercihleri</div>
        {[
          ['orders', '📦 Sipariş Güncellemeleri', 'Onay, hazırlık, teslimat'],
          ['favorites', '👩‍🍳 Favori Aşçı', 'Yeni menü paylaşımları'],
          ['reviews', '⭐ Değerlendirme', 'Teslimdan 30 dk sonra'],
          ['campaigns', '🎁 Kampanyalar', 'Promosyon bildirimleri'],
          ['stock', '📉 Stok Uyarısı', 'Son porsiyon uyarısı'],
        ].map(([key, title, desc]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #F5EDD8' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#4A2C0E' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#8A7B6B' }}>{desc}</div>
            </div>
            <button onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, background: notifs[key] ? '#3D6B47' : '#E8E0D4', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: notifs[key] ? 23 : 3, transition: 'left 0.2s' }} />
            </button>
          </div>
        ))}
      </div>

      <Link href="/adreslerim" style={{ display: 'block', width: '100%', padding: '12px 0', background: 'white', color: '#4A2C0E', border: '1.5px solid #E8E0D4', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
        📍 Kayıtlı Adreslerim
      </Link>

      <button onClick={cikisYap} style={{ width: '100%', padding: '12px 0', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        🚪 Çıkış Yap
      </button>
    </div>
  )
}