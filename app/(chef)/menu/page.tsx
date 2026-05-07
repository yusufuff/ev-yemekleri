'use client'
import { useState, useEffect } from 'react'

const CATEGORIES = [
  { value: 'main',    label: 'Ana Yemek', emoji: '🍲' },
  { value: 'soup',    label: 'Çorba',     emoji: '🥣' },
  { value: 'dessert', label: 'Tatlı',     emoji: '🍮' },
  { value: 'pastry',  label: 'Börek',     emoji: '🥐' },
  { value: 'salad',   label: 'Salata',    emoji: '🥗' },
]

const ALLERGENS = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'milk',   label: 'Süt' },
  { value: 'egg',    label: 'Yumurta' },
  { value: 'nuts',   label: 'Fındık' },
  { value: 'fish',   label: 'Balık' },
]

const STATUS_COLOR: Record<string, string> = {
  ok: '#3D6B47', low: '#E8622A', critical: '#DC2626', out_of_stock: '#9CA3AF'
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  description: string
  allergens: string[]
  prep_time_min: number
  remaining_stock: number
  daily_stock: number
  stock_status: string
  is_active: boolean
  photos: string[]
}

function MenuItemForm({ item, onSave, onClose }: { item?: MenuItem | null; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    price: item?.price ?? '',
    category: item?.category ?? 'main',
    description: item?.description ?? '',
    allergens: item?.allergens ?? [],
    prep_time_min: item?.prep_time_min ?? 30,
    daily_stock: item?.daily_stock ?? 10,
    is_active: item?.is_active ?? true,
    discount_percent: 0,
    publish_hours: 24,
    photo_url: item?.photos?.[0] ?? '',
  })
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [acikSekme, setAcikSekme] = useState<string | null>(null)

  useEffect(() => {
    if (form.name.length < 2) { setSuggestions([]); return }
    fetch(`/api/menu/food-photos?q=${encodeURIComponent(form.name)}`)
      .then(r => r.json())
      .then(d => setSuggestions(d.photos ?? []))
  }, [form.name])

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/menu/upload-photo', { method: 'POST', body: formData })
    const json = await res.json()
    if (json.url) setForm(p => ({ ...p, photo_url: json.url }))
    setUploading(false)
  }

  const toggleAllergen = (v: string) =>
    setForm(p => ({ ...p, allergens: p.allergens.includes(v) ? p.allergens.filter(a => a !== v) : [...p.allergens, v] }))

  const SekmeBaslik = ({ id, label }: { id: string; label: string }) => (
    <button onClick={() => setAcikSekme(acikSekme === id ? null : id)}
      style={{ width: '100%', padding: '12px 14px', background: acikSekme === id ? '#FEF3EC' : '#FAF6EF', border: '1.5px solid #E8E0D4', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, color: '#4A2C0E' }}>
      {label} <span>{acikSekme === id ? '▲' : '▼'}</span>
    </button>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(74,44,14,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#4A2C0E' }}>
            {item ? 'Yemeği Düzenle' : 'Yeni Yemek Ekle'}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#F5EDD8', border: '1.5px solid #E8E0D4', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Yemek Adı *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Örn: Kuru Fasulye & Pilav"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            {suggestions.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map((s: any) => (
                  <div key={s.id} onClick={() => setForm(p => ({ ...p, photo_url: s.photo_url }))}
                    style={{ cursor: 'pointer', border: form.photo_url === s.photo_url ? '2.5px solid #E8622A' : '2px solid #E8E0D4', borderRadius: 10, overflow: 'hidden', width: 70, height: 70 }}>
                    <img src={s.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Fotoğraf</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {form.photo_url && (
                <img src={form.photo_url} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1.5px solid #E8E0D4' }} />
              )}
              <label style={{ flex: 1, padding: '10px 14px', background: '#F5EDD8', border: '1.5px dashed #E8622A', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#E8622A', cursor: 'pointer', textAlign: 'center' }}>
                {uploading ? '⏳ Yükleniyor...' : '📷 Kendi Fotoğrafını Yükle'}
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Kategori *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setForm(p => ({ ...p, category: c.value }))} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                  background: form.category === c.value ? '#E8622A' : '#F5EDD8',
                  color: form.category === c.value ? 'white' : '#4A2C0E',
                }}>{c.emoji} {c.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Açıklama</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Yemeğin içeriği ve lezzet notu..."
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Alerjenler</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ALLERGENS.map(a => (
                <button key={a.value} onClick={() => toggleAllergen(a.value)} style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                  background: form.allergens.includes(a.value) ? '#FEF3C7' : '#F5EDD8',
                  color: form.allergens.includes(a.value) ? '#D97706' : '#8A7B6B',
                }}>{a.label}</button>
              ))}
            </div>
          </div>

          <SekmeBaslik id="fiyat" label={`💰 Fiyat & Stok${form.price ? ` · ₺${form.price}` : ''}`} />
          {acikSekme === 'fiyat' && (
            <div style={{ background: '#FAF6EF', borderRadius: 8, padding: 14, border: '1.5px solid #E8E0D4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Fiyat (₺) *</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="55" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Günlük Stok *</label>
                <input type="number" value={form.daily_stock} onChange={e => setForm(p => ({ ...p, daily_stock: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          <SekmeBaslik id="yayin" label={`⏰ Yayın Süresi · ${form.publish_hours} saat`} />
          {acikSekme === 'yayin' && (
            <div style={{ background: '#FAF6EF', borderRadius: 8, padding: 14, border: '1.5px solid #E8E0D4' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3, 6, 12, 24].map(h => (
                  <button key={h} onClick={() => setForm(p => ({ ...p, publish_hours: h }))} style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                    background: form.publish_hours === h ? '#E8622A' : '#F5EDD8',
                    color: form.publish_hours === h ? 'white' : '#4A2C0E',
                  }}>{h} saat</button>
                ))}
              </div>
            </div>
          )}

          <SekmeBaslik id="indirim" label={`🏷️ İndirim · %${form.discount_percent}`} />
          {acikSekme === 'indirim' && (
            <div style={{ background: '#FAF6EF', borderRadius: 8, padding: 14, border: '1.5px solid #E8E0D4' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 5, 10, 15, 20, 25, 30, 40, 50].map(p => (
                  <button key={p} onClick={() => setForm(prev => ({ ...prev, discount_percent: p }))} style={{
                    padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                    background: form.discount_percent === p ? '#E8622A' : '#F5EDD8',
                    color: form.discount_percent === p ? 'white' : '#4A2C0E',
                  }}>{p === 0 ? 'Yok' : `%${p}`}</button>
                ))}
              </div>
              {form.discount_percent > 0 && form.price && (
                <div style={{ marginTop: 10, fontSize: 13, color: '#3D6B47', fontWeight: 600 }}>
                  İndirimli fiyat: ₺{Math.round(Number(form.price) * (1 - form.discount_percent / 100))}
                </div>
              )}
            </div>
          )}

          <SekmeBaslik id="hazirlik" label={`⏱️ Hazırlık Süresi · ${form.prep_time_min} dk`} />
          {acikSekme === 'hazirlik' && (
            <div style={{ background: '#FAF6EF', borderRadius: 8, padding: 14, border: '1.5px solid #E8E0D4' }}>
              <input type="number" value={form.prep_time_min} onChange={e => setForm(p => ({ ...p, prep_time_min: Number(e.target.value) }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FAF6EF', borderRadius: 8, border: '1.5px solid #E8E0D4' }}>
            <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))} style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: form.is_active ? '#3D6B47' : '#E8E0D4', position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: form.is_active ? 23 : 3, transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: 13, color: '#4A2C0E', fontWeight: 600 }}>{form.is_active ? '✅ Aktif — Yayında' : '⏸️ Pasif — Yayında Değil'}</span>
          </div>

          <button onClick={() => onSave({ ...form, standard_photo: form.photo_url })}
            style={{ width: '100%', padding: '14px 0', background: '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
            {item ? '💾 Güncelle' : '🚀 Yayına Çıkar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(d => { setItems(d.items ?? []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleSave = async (data: any) => {
    if (editItem) {
      const res = await fetch(`/api/menu/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      setItems(prev => prev.map(i => i.id === editItem.id ? json.item : i))
    } else {
      const res = await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      setItems(prev => [...prev, json.item])
    }
    setShowForm(false)
    setEditItem(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu yemeği silmek istiyor musunuz?')) return
    await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleToggle = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const res = await fetch(`/api/menu/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !item.is_active }) })
    const json = await res.json()
    setItems(prev => prev.map(i => i.id === id ? json.item : i))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Menü Yönetimi</h1>
            <p style={{ color: '#8A7B6B', fontSize: 13, margin: '4px 0 0' }}>{items.length} yemek · Günlük stok takibi</p>
          </div>
          <button onClick={() => { setEditItem(null); setShowForm(true) }} style={{ padding: '10px 20px', background: '#E8622A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Yemek Ekle
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#8A7B6B' }}>Yükleniyor…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {items.map(item => {
              const cat = CATEGORIES.find(c => c.value === item.category)
              const stockPct = item.daily_stock > 0 ? (item.remaining_stock / item.daily_stock) * 100 : 0
              const stockColor = STATUS_COLOR[item.stock_status] ?? '#3D6B47'
              return (
                <div key={item.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)', opacity: item.is_active ? 1 : 0.6 }}>
                  <div style={{ height: 100, background: 'linear-gradient(135deg,#FFECD2,#FCB69F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative' }}>
                    {item.photos?.[0] ? <img src={item.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : cat?.emoji ?? '🍽️'}
                    <div style={{ position: 'absolute', top: 8, right: 8, background: item.is_active ? '#3D6B47' : '#9CA3AF', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>
                      {item.is_active ? 'AKTİF' : 'PASİF'}
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#E8622A', marginBottom: 8 }}>₺{item.price}</div>
                    <div style={{ fontSize: 11, color: '#8A7B6B', marginBottom: 8 }}>{cat?.label} · {item.prep_time_min} dk</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: '#8A7B6B' }}>Stok:</span>
                      <span style={{ fontWeight: 600, color: stockColor }}>{item.remaining_stock} / {item.daily_stock}</span>
                    </div>
                    <div style={{ background: '#E8E0D4', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${stockPct}%`, background: stockColor, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditItem(item); setShowForm(true) }} style={{ flex: 1, padding: '7px 0', background: '#F5EDD8', color: '#4A2C0E', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Düzenle</button>
                      <button onClick={() => handleToggle(item.id)} style={{ padding: '7px 10px', background: item.is_active ? '#FEE2E2' : '#ECFDF5', color: item.is_active ? '#DC2626' : '#3D6B47', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {item.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ padding: '7px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div onClick={() => { setEditItem(null); setShowForm(true) }} style={{ background: '#F5EDD8', borderRadius: 16, border: '2px dashed #E8622A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, cursor: 'pointer' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>➕</div>
              <div style={{ fontWeight: 700, color: '#E8622A', fontSize: 14 }}>Yeni Yemek Ekle</div>
              <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 4 }}>Menünüzü genişletin</div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <MenuItemForm
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}