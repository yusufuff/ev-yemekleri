// app/(buyer)/profil/ProfilForm.tsx - Client Component
'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ProfilForm({ user, chefData, isAdmin }) {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: user.full_name, phone: user.phone, email: user.email })
  const [chefForm, setChefForm] = useState({ bio: chefData?.bio ?? '', iban: chefData?.iban ?? '', radius: chefData?.delivery_radius_km ?? 5, min_order: chefData?.min_order_amount ?? 40 })
  const [notifs, setNotifs] = useState({ orders: true, favorites: true, reviews: true, campaigns: false, stock: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationSaved, setLocationSaved] = useState(false)
  const [sifreForm, setSifreForm] = useState({ yeni: '', tekrar: '' })
  const [goster, setGoster] = useState({ yeni: false, tekrar: false })
  const [sifreSaving, setSifreSaving] = useState(false)
  const [sifreSaved, setSifreSaved] = useState(false)
  const [sifreHata, setSifreHata] = useState('')
  const [adreslerAcik, setAdreslerAcik] = useState(false)
  const [adresler, setAdresler] = useState([])
  const [adresYukleniyor, setAdresYukleniyor] = useState(false)
  const [adresForm, setAdresForm] = useState({ label: 'Ev', full_address: '', city: '' })
  const [adresFormAcik, setAdresFormAcik] = useState(false)
  const [adresDuzenleId, setAdresDuzenleId] = useState(null)
  const [adresSaving, setAdresSaving] = useState(false)
  const [adresSaved, setAdresSaved] = useState(false)
  const isChef = user.role === 'chef'
  const displayName = form.full_name || user.full_name || 'Isim girilmemis'
  const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', color: '#4A2C0E' }
  const labelIcon = (label) => label === 'Ev' ? '🏠' : label === 'Is' ? '💼' : '📍'

  useEffect(() => { if (adreslerAcik) adresleriYukle() }, [adreslerAcik])

  const adresleriYukle = async () => {
    setAdresYukleniyor(true)
    try {
      const supabase = getSupabaseBrowserClient() as any
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
      setAdresler(data ?? [])
    } catch (e) { console.log(e) }
    finally { setAdresYukleniyor(false) }
  }

  const adresKaydet = async () => {
    if (!adresForm.full_address.trim()) { alert('Adres bos olamaz'); return }
    setAdresSaving(true)
    try {
      const supabase = getSupabaseBrowserClient() as any
      if (adresDuzenleId) {
        await supabase.from('addresses').update({ label: adresForm.label, full_address: adresForm.full_address, city: adresForm.city }).eq('id', adresDuzenleId)
      } else {
        await supabase.from('addresses').insert({ user_id: user.id, label: adresForm.label, full_address: adresForm.full_address, city: adresForm.city, is_default: adresler.length === 0 })
      }
      setAdresSaved(true)
      setAdresFormAcik(false)
      setAdresDuzenleId(null)
      setAdresForm({ label: 'Ev', full_address: '', city: '' })
      await adresleriYukle()
      setTimeout(() => setAdresSaved(false), 2000)
    } catch (e) { alert('Hata: ' + e.message) }
    finally { setAdresSaving(false) }
  }

  const adresSil = async (id) => {
    if (!confirm('Bu adresi silmek istiyor musunuz?')) return
    const supabase = getSupabaseBrowserClient() as any
    await supabase.from('addresses').delete().eq('id', id)
    await adresleriYukle()
  }

  const varsayilanYap = async (id) => {
    const supabase = getSupabaseBrowserClient() as any
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    await adresleriYukle()
  }

  const adresDuzenle = (addr) => {
    setAdresDuzenleId(addr.id)
    setAdresForm({ label: addr.label, full_address: addr.full_address, city: addr.city ?? '' })
    setAdresFormAcik(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: form.full_name, phone: form.phone, email: form.email, bio: chefForm.bio, iban: chefForm.iban, delivery_radius_km: chefForm.radius, min_order_amount: chefForm.min_order }) })
      const json = await res.json()
      if (!res.ok) { alert('Hata: ' + json.error); return }
      setSaved(true)
      setTimeout(() => { setSaved(false); router.refresh() }, 1000)
    } catch (e) { alert('Bir sorun olustu') }
    finally { setSaving(false) }
  }

  const saveNotifs = async () => {
    setNotifSaving(true)
    try {
      localStorage.setItem('notif_prefs', JSON.stringify(notifs))
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2000)
    } catch (e) { alert('Bir sorun olustu') }
    finally { setNotifSaving(false) }
  }

  const sifreDegistir = async () => {
    setSifreHata('')
    if (!sifreForm.yeni || sifreForm.yeni.length < 6) { setSifreHata('Sifre en az 6 karakter olmali'); return }
    if (sifreForm.yeni !== sifreForm.tekrar) { setSifreHata('Sifreler eslesmiyor'); return }
    setSifreSaving(true)
    try {
      const supabase = getSupabaseBrowserClient() as any
      const { error } = await supabase.auth.updateUser({ password: sifreForm.yeni })
      if (error) { setSifreHata(error.message.includes('different from the old password') ? 'Yeni sifre eski sifreden farkli olmali' : 'Hata: ' + error.message); return }
      setSifreSaved(true)
      setSifreForm({ yeni: '', tekrar: '' })
      setTimeout(() => setSifreSaved(false), 2000)
    } catch (e) { setSifreHata('Bir sorun olustu') }
    finally { setSifreSaving(false) }
  }

  const konumuGuncelle = () => {
    if (!navigator.geolocation) { alert('Tarayiciniz konum desteklemiyor.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const supabase = getSupabaseBrowserClient() as any
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        await supabase.rpc('update_chef_location', { p_user_id: authUser.id, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude })
        setLocationSaved(true)
        setTimeout(() => setLocationSaved(false), 3000)
      } catch (e) { alert('Konum kaydedilemedi.') }
      setLocating(false)
    }, () => { alert('Konum alinamadi.'); setLocating(false) })
  }

  const cikisYap = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center', border: `2px solid ${!isChef ? '#E8622A' : '#E8E0D4'}`, background: !isChef ? '#FEF3EC' : 'white', color: !isChef ? '#E8622A' : '#8A7B6B', fontWeight: 700, fontSize: 14 }}>
          Alici {!isChef && 'v'}
        </div>
        <div style={{ flex: 1, padding: '12px 0', borderRadius: 12, textAlign: 'center', border: `2px solid ${isChef ? '#E8622A' : '#E8E0D4'}`, background: isChef ? '#FEF3EC' : 'white', color: isChef ? '#E8622A' : '#8A7B6B', fontWeight: 700, fontSize: 14 }}>
          Asci {isChef && 'v'}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Kisisel Bilgiler</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8622A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 2 }}>{isChef ? 'Asci' : 'Alici'}</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Ad Soyad</label>
          <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Telefon</label>
          <input type="tel" value={form.phone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 11) setForm(p => ({ ...p, phone: val })) }} maxLength={11} placeholder="05XXXXXXXXX" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>E-posta</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
        </div>
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px 0', background: saved ? '#3D6B47' : '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, marginBottom: 20 }}>
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Bilgileri Kaydet'}
        </button>
        <div style={{ borderTop: '1px solid #F5EDD8', paddingTop: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#4A2C0E', marginBottom: 14 }}>Sifre Degistir</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Yeni Sifre</label>
            <div style={{ position: 'relative' }}>
              <input type={goster.yeni ? 'text' : 'password'} value={sifreForm.yeni} onChange={e => setSifreForm(p => ({ ...p, yeni: e.target.value }))} placeholder="En az 6 karakter" style={{ ...inputStyle, paddingRight: 44 }} />
              <button onClick={() => setGoster(p => ({ ...p, yeni: !p.yeni }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A7B6B' }}>
                {goster.yeni ? 'Gizle' : 'Goster'}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Yeni Sifre (Tekrar)</label>
            <div style={{ position: 'relative' }}>
              <input type={goster.tekrar ? 'text' : 'password'} value={sifreForm.tekrar} onChange={e => setSifreForm(p => ({ ...p, tekrar: e.target.value }))} placeholder="Sifreyi tekrar girin" style={{ ...inputStyle, paddingRight: 44 }} />
              <button onClick={() => setGoster(p => ({ ...p, tekrar: !p.tekrar }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A7B6B' }}>
                {goster.tekrar ? 'Gizle' : 'Goster'}
              </button>
            </div>
          </div>
          {sifreHata && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>{sifreHata}</div>}
          <button onClick={sifreDegistir} disabled={sifreSaving} style={{ width: '100%', padding: '12px 0', background: sifreSaved ? '#3D6B47' : '#4A2C0E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: sifreSaving ? 0.7 : 1 }}>
            {sifreSaving ? 'Degistiriliyor...' : sifreSaved ? 'Sifre Degistirildi!' : 'Sifreyi Degistir'}
          </button>
        </div>
      </div>

      {isChef && (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Asci Ayarlari</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Konum</label>
            <button onClick={konumuGuncelle} disabled={locating} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: locating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: locationSaved ? '#ECFDF5' : '#FEF3EC', border: `1.5px solid ${locationSaved ? '#3D6B47' : '#E8622A'}`, color: locationSaved ? '#3D6B47' : '#E8622A' }}>
              {locating ? 'Konum aliniyor...' : locationSaved ? 'Konum Guncellendi!' : 'Konumumu Guncelle'}
            </button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Biyografi</label>
            <textarea value={chefForm.bio} onChange={e => setChefForm(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>IBAN</label>
            <input value={chefForm.iban} onChange={e => setChefForm(p => ({ ...p, iban: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 8 }}>Teslimat Yaricapi: <span style={{ color: '#E8622A' }}>{chefForm.radius} km</span></label>
            <input type="range" min={1} max={10} value={chefForm.radius} onChange={e => setChefForm(p => ({ ...p, radius: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#E8622A' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Min. Siparis Tutari</label>
            <input type="number" value={chefForm.min_order} onChange={e => setChefForm(p => ({ ...p, min_order: Number(e.target.value) }))} style={inputStyle} />
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Bildirim Tercihleri</div>
        {[
          ['orders', 'Siparis Guncellemeleri', 'Onay, hazirlik, teslimat'],
          ['favorites', 'Favori Asci', 'Yeni menu paylasimlari'],
          ['reviews', 'Degerlendirme', 'Teslimdan 30 dk sonra'],
          ['campaigns', 'Kampanyalar', 'Promosyon bildirimleri'],
          ['stock', 'Stok Uyarisi', 'Son porsiyon uyarisi'],
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
        <button onClick={saveNotifs} disabled={notifSaving} style={{ width: '100%', padding: '12px 0', background: notifSaved ? '#3D6B47' : '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: notifSaving ? 0.7 : 1, marginTop: 4 }}>
          {notifSaving ? 'Kaydediliyor...' : notifSaved ? 'Tercihler Kaydedildi!' : 'Tercihleri Kaydet'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
        <button onClick={() => setAdreslerAcik(p => !p)} style={{ width: '100%', padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E' }}>Kayitli Adreslerim</span>
          <span style={{ fontSize: 20, color: '#8A7B6B' }}>{adreslerAcik ? '▲' : '▼'}</span>
        </button>
        {adreslerAcik && (
          <div style={{ padding: '0 24px 24px' }}>
            {adresYukleniyor ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#8A7B6B' }}>Yukleniyor...</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {adresler.length === 0 && <div style={{ color: '#8A7B6B', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Henuz kayitli adres yok.</div>}
                  {adresler.map(addr => (
                    <div key={addr.id} style={{ border: addr.is_default ? '2px solid #3D6B47' : '1.5px solid #E8E0D4', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: '#F5EDD8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {labelIcon(addr.label)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#4A2C0E' }}>{addr.label}</span>
                          {addr.is_default && <span style={{ background: '#ECFDF5', color: '#3D6B47', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>Varsayilan</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#4A2C0E' }}>{addr.full_address}</div>
                        {addr.city && <div style={{ fontSize: 11, color: '#8A7B6B' }}>{addr.city}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {!addr.is_default && (
                          <button onClick={() => varsayilanYap(addr.id)} style={{ padding: '5px 8px', background: '#ECFDF5', color: '#3D6B47', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>v</button>
                        )}
                        <button onClick={() => adresDuzenle(addr)} style={{ padding: '5px 8px', background: '#FEF3EC', color: '#E8622A', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Duzenle</button>
                        <button onClick={() => adresSil(addr.id)} style={{ padding: '5px 8px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>Sil</button>
                      </div>
                    </div>
                  ))}
                </div>
                {!adresFormAcik && (
                  <button onClick={() => { setAdresFormAcik(true); setAdresDuzenleId(null); setAdresForm({ label: 'Ev', full_address: '', city: '' }) }} style={{ width: '100%', padding: '10px 0', background: '#FEF3EC', color: '#E8622A', border: '1.5px dashed #E8622A', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Yeni Adres Ekle
                  </button>
                )}
                {adresFormAcik && (
                  <div style={{ background: '#FAF6EF', borderRadius: 12, padding: 16, border: '1.5px solid #E8E0D4' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 12 }}>{adresDuzenleId ? 'Adresi Duzenle' : 'Yeni Adres'}</div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Etiket</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['Ev', 'Is', 'Diger'].map(l => (
                          <button key={l} onClick={() => setAdresForm(p => ({ ...p, label: l }))} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: adresForm.label === l ? '#E8622A' : '#F5EDD8', color: adresForm.label === l ? 'white' : '#4A2C0E' }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Acik Adres</label>
                      <input value={adresForm.full_address} onChange={e => setAdresForm(p => ({ ...p, full_address: e.target.value }))} placeholder="Mahalle, cadde, sokak, bina no..." style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Ilce, Sehir</label>
                      <input value={adresForm.city} onChange={e => setAdresForm(p => ({ ...p, city: e.target.value }))} placeholder="Orn: Seyhan, Adana" style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={adresKaydet} disabled={adresSaving} style={{ flex: 1, padding: '11px 0', background: adresSaved ? '#3D6B47' : '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: adresSaving ? 0.7 : 1 }}>
                        {adresSaving ? '...' : adresSaved ? 'Kaydedildi!' : 'Kaydet'}
                      </button>
                      <button onClick={() => { setAdresFormAcik(false); setAdresDuzenleId(null) }} style={{ padding: '11px 16px', background: '#F5EDD8', color: '#4A2C0E', border: '1.5px solid #E8E0D4', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Iptal
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <a href="/admin" style={{ display: 'block', width: '100%', padding: '12px 0', background: '#4A2C0E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
          Admin Paneli
        </a>
      )}

      <button onClick={cikisYap} style={{ width: '100%', padding: '12px 0', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Cikis Yap
      </button>
    </div>
  )
}
