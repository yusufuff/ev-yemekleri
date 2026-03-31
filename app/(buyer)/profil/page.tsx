// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const [chefForm, setChefForm] = useState({ bio: '', iban: '', radius: 5, min_order: 40 })
  const [notifs, setNotifs] = useState({ orders: true, favorites: true, reviews: true, campaigns: false, stock: true })
  const [sifreForm, setSifreForm] = useState({ yeni: '', tekrar: '' })
  const [sifreSaving, setSifreSaving] = useState(false)
  const [sifreSaved, setSifreSaved] = useState(false)
  const [sifreHata, setSifreHata] = useState('')

  const sessionYukle = async () => {
    const res = await fetch('/api/auth/session', { cache: 'no-store' })
    const session = await res.json()
    if (!session?.user?.id) { router.push('/giris'); return }
    setProfile(session.user)
    setForm({
      full_name: session.user.full_name ?? '',
      phone: session.user.phone ?? '',
      email: session.user.email ?? '',
    })
    if (session.user.role === 'chef') {
      try {
        const cpRes = await fetch('/api/chef/profile', { cache: 'no-store' })
        const cp = await cpRes.json()
        if (cp && !cp.error) {
          setChefForm({
            bio: cp.bio ?? '',
            iban: cp.iban ?? '',
            radius: cp.delivery_radius_km ?? 5,
            min_order: cp.min_order_amount ?? 40,
          })
        }
      } catch (e) {}
    }
  }

  useEffect(() => {
    sessionYukle().finally(() => setLoading(false))
  }, [])

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
      await sessionYukle()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('Bir sorun olustu')
    } finally {
      setSaving(false)
    }
  }

  const sifreDegistir = async () => {
    setSifreHata('')
    if (!sifreForm.yeni || sifreForm.yeni.length < 6) {
      setSifreHata('Şifre en az 6 karakter olmalı')
      return
    }
    if (sifreForm.yeni !== sifreForm.tekrar) {
      setSifreHata('Şifreler eşleşmiyor')
      return
    }
    setSifreSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password: sifreForm.yeni })
      if (error) { setSifreHata('Hata: ' + error.message); return }
      setSifreSaved(true)
      setSifreForm({ yeni: '', tekrar: '' })
      setTimeout(() => setSifreSaved(false), 2000)
    } catch (e) {
      setSifreHata('Bir sorun oluştu')
    } finally {
      setSifreSaving(false)
    }
  }

  const cikisYap = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7B6B', fontFamily: "'DM Sans', sans-serif" }}>
      Yükleniyor...
    </div>
  )

  const isChef = profile?.role === 'chef'
  const displayName = form.full_name || profile?.full_name || 'İsim girilmemiş'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', marginBottom: 20 }}>
          Profil & Ayarlar
        </h1>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center', border: `2px solid ${!isChef ? '#E8622A' : '#E8E0D4'}`, background: !isChef ? '#FEF3EC' : 'white', color: !isChef ? '#E8622A' : '#8A7B6B', fontWeight: 700, fontSize: 14 }}>
            🛒 Alıcı {!isChef && '✓'}
          </div>
          <div style={{ flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center', border: `2px solid ${isChef ? '#E8622A' : '#E8E0D4'}`, background: isChef ? '#FEF3EC' : 'white', color: isChef ? '#E8622A' : '#8A7B6B', fontWeight: 700, fontSize: 14 }}>
            👩‍🍳 Aşçı {isChef && '✓'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Kisisel Bilgiler */}
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>E-posta</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }} />
            </div>

            <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px 0', background: saved ? '#3D6B47' : '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s', opacity: saving ? 0.7 : 1 }}>
              {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Bilgileri Kaydet'}
            </button>
          </div>

          {/* Sifre Degistir */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>🔒 Şifre Değiştir</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Yeni Şifre</label>
              <input type="password" value={sifreForm.yeni} onChange={e => setSifreForm(p => ({ ...p, yeni: e.target.value }))}
                placeholder="En az 6 karakter"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Yeni Şifre (Tekrar)</label>
              <input type="password" value={sifreForm.tekrar} onChange={e => setSifreForm(p => ({ ...p, tekrar: e.target.value }))}
                placeholder="Şifreyi tekrar girin"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }} />
            </div>

            {sifreHata && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
                ❌ {sifreHata}
              </div>
            )}

            <button onClick={sifreDegistir} disabled={sifreSaving} style={{ width: '100%', padding: '12px 0', background: sifreSaved ? '#3D6B47' : '#4A2C0E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: sifreSaving ? 0.7 : 1 }}>
              {sifreSaving ? '⏳ Değiştiriliyor...' : sifreSaved ? '✅ Şifre Değiştirildi!' : '🔒 Şifreyi Değiştir'}
            </button>
          </div>

          {/* Asci Ayarlari */}
          {isChef && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Aşçı Ayarları</div>
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

          {/* Bildirimler */}
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

          {/* Cikis */}
          <button onClick={cikisYap} style={{ width: '100%', padding: '12px 0', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🚪 Çıkış Yap
          </button>

        </div>
      </div>
    </div>
  )
}