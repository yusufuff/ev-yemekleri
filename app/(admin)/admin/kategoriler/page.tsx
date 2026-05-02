'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const VARSAYILAN_KATEGORILER = [
  { id: 'main',      ad: 'Ana Yemek',  emoji: '🍲' },
  { id: 'soup',      ad: 'Çorba',      emoji: '🥣' },
  { id: 'dessert',   ad: 'Tatlı',      emoji: '🍰' },
  { id: 'pastry',    ad: 'Börek',      emoji: '🥐' },
  { id: 'salad',     ad: 'Salata',     emoji: '🥗' },
  { id: 'drink',     ad: 'İçecek',     emoji: '🥤' },
  { id: 'breakfast', ad: 'Kahvaltı',   emoji: '🥚' },
]

export default function AdminKategoriler() {
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [yeni, setYeni] = useState({ id: '', ad: '', emoji: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    setLoading(true)
    const { data } = await supabase.from('menu_categories').select('*').order('sira')
    if (data && data.length > 0) {
      setKategoriler(data)
    } else {
      setKategoriler(VARSAYILAN_KATEGORILER)
    }
    setLoading(false)
  }

  const ekle = async () => {
    if (!yeni.id.trim() || !yeni.ad.trim() || !yeni.emoji.trim()) return
    setSaving(true)
    await supabase.from('menu_categories').insert({
      id: yeni.id.trim().toLowerCase().replace(/\s+/g, '_'),
      ad: yeni.ad.trim(),
      emoji: yeni.emoji.trim(),
      sira: kategoriler.length + 1,
    })
    setYeni({ id: '', ad: '', emoji: '' })
    setSaving(false)
    yukle()
  }

  const sil = async (id: string) => {
    if (!confirm(`"${id}" kategorisini silmek istediğinize emin misiniz?`)) return
    await supabase.from('menu_categories').delete().eq('id', id)
    yukle()
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 8 }}>Kategoriler</h1>
      <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 24 }}>Buradan eklediğiniz kategoriler mobil uygulamada aşçıların yemek eklerken göreceği kategoriler olacaktır.</p>

      {/* Yeni kategori ekle */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Yeni Kategori Ekle</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kategori ID (İngilizce)</label>
            <input value={yeni.id} onChange={e => setYeni(p => ({ ...p, id: e.target.value }))} placeholder="ornek: breakfast" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Görünen Ad</label>
            <input value={yeni.ad} onChange={e => setYeni(p => ({ ...p, ad: e.target.value }))} placeholder="Kahvaltı" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Emoji</label>
            <input value={yeni.emoji} onChange={e => setYeni(p => ({ ...p, emoji: e.target.value }))} placeholder="🥚" style={inp} />
          </div>
        </div>
        <button onClick={ekle} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          {saving ? 'Ekleniyor...' : '+ Ekle'}
        </button>
      </div>

      {/* Mevcut kategoriler */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8A7B6B' }}>Yükleniyor...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FAF6EF' }}>
                {['Emoji', 'ID', 'Ad', 'İşlem'].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8A7B6B', padding: '12px 16px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kategoriler.map(k => (
                <tr key={k.id} style={{ borderBottom: '1px solid #FAF6EF' }}>
                  <td style={{ padding: '12px 16px', fontSize: 24 }}>{k.emoji}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#8A7B6B', fontFamily: 'monospace' }}>{k.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#4A2C0E' }}>{k.ad}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => sil(k.id)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer' }}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}