'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [chefProfile, setChefProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const [chefForm, setChefForm] = useState({ bio: '', iban: '', radius: 5, min_order: 40 })
  const [notifs, setNotifs] = useState({ orders: true, favorites: true, reviews: true, campaigns: false, stock: true })

  useEffect(() => {
    const yukle = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      setUser(user)

      const { data: p } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (p) {
        setProfile(p)
        setForm({
          full_name: p.full_name ?? '',
          phone: p.phone ?? '',
          email: user.email ?? '',
        })
      }

      if (p?.role === 'chef') {
        const { data: cp } = await supabase
          .from('chef_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (cp) {
          setChefProfile(cp)
          setChefForm({
            bio: cp.bio ?? '',
            iban: cp.iban ?? '',
            radius: cp.delivery_radius_km ?? 5,
            min_order: cp.min_order_amount ?? 40,
          })
        }
      }

      setLoading(false)
    }
    yukle()
  }, [])

  const save = async () => {
    setSaving(true)
    const supabase = getSupabaseBrowserClient()
    await supabase.from('users').update({
      full_name: form.full_name,
      phone: form.phone,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    if (profile?.role === 'chef' && chefProfile) {
      await supabase.from('chef_profiles').update({
        bio: chefForm.bio,
        iban: chefForm.iban,
        delivery_radius_km: chefForm.radius,
        min_order_amount: chefForm.min_order,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const cikisYap = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7B6B', fontFamily: "'DM Sans', sans-serif" }}>
      Yükleniyor...
    </div>
  )

  const isChef = profile?.role === 'chef'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', marginBottom: 20 }}>
          Profil & Ayarlar
        </h1>

        {/* Rol göstergesi */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center',
            border: `2px solid ${!isChef ? '#E8622A' : '#E8E0D4'}`,
            background: !isChef ? '#FEF3EC' : 'white',
            color: !isChef ? '#E8622A' : '#8A7B6B',
            fontWeight: 700, fontSize: 14,
          }}>
            🛒 Alıcı {!isChef && '✓'}
          </div>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center',
            border: `2px solid ${isChef ? '#E8622A' : '#E8E0D4'}`,
            background: isChef ? '#FEF3EC' : 'white',
            color: isChef ? '#E8622A' : '#8A7B6B',
            fontWeight: 700, fontSize: 14,
          }}>
            👩‍🍳 Aşçı {isChef && '✓'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Kişisel Bilgiler */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
              Kişisel Bilgiler
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8622A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700 }}>
                {form.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E' }}>{form.full_name || 'İsim girilmemiş'}</div>
                <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 2 }}>{isChef ? '👩‍🍳 Aşçı' : '🛒 Alıcı'}</div>
              </div>
            </div>

            {[
              ['Ad Soyad', 'full_name', 'text'],
              ['Telefon', 'phone', 'tel'],
              ['E-posta', 'email', 'email'],
            ].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  disabled={key === 'email'}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', background: key === 'email' ? '#F5F5F5' : 'white', color: '#4A2C0E' }}
                />
              </div>
            ))}
          </div>

          {/* Aşçı Ayarları */}
          {isChef && (
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
                Aşçı Ayarları
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

          {/* Bildirimler */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
              Bildirim Tercihleri
            </div>
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
                <button onClick={() => setNotifs(p => ({ ...p, [key]: !p[key as keyof typeof notifs] }))} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: notifs[key as keyof typeof notifs] ? '#3D6B47' : '#E8E0D4', position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: notifs[key as keyof typeof notifs] ? 23 : 3, transition: 'left 0.2s' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Kaydet / Çıkış */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              flex: 1, padding: '12px 0', background: saved ? '#3D6B47' : '#E8622A',
              color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
            </button>
            <button onClick={cikisYap} style={{ padding: '12px 20px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Çıkış Yap
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}