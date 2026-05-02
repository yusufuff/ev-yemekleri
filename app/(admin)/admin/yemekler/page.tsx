'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FOTO_KATEGORILER = [
  { id: 'main',      label: 'Ana Yemek' },
  { id: 'soup',      label: 'Çorba' },
  { id: 'breakfast', label: 'Kahvaltı' },
  { id: 'dessert',   label: 'Tatlı' },
  { id: 'pastry',    label: 'Börek' },
  { id: 'cake',      label: 'Pasta' },
  { id: 'drink',     label: 'İçecek' },
  { id: 'salad',     label: 'Salata' },
]

export default function YemekFotolarPage() {
  // ── Fotoğraf state ──
  const [aramaMetni, setAramaMetni] = useState('')
  const [yemekAdı, setYemekAdı]     = useState('')
  const [kategori, setKategori]     = useState('main')
  const [fotolar, setFotolar]       = useState<File[]>([])
  const [onizleme, setOnizleme]     = useState<string[]>([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const [mesaj, setMesaj]           = useState<{tip: string, metin: string} | null>(null)
  const [kayitlar, setKayitlar]     = useState<any[]>([])
  const [filtreli, setFiltreli]     = useState<any[]>([])
  const [silYukleniyor, setSilYukleniyor] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Kategori state ──
  const [kategoriler, setKategoriler]   = useState<any[]>([])
  const [katLoading, setKatLoading]     = useState(true)
  const [katSaving, setKatSaving]       = useState(false)
  const [yeniKat, setYeniKat]           = useState({ id: '', ad: '', emoji: '' })
  const [katSilYukleniyor, setKatSilYukleniyor] = useState<string | null>(null)

  useEffect(() => { kayitlariYukle(); kategorileriYukle() }, [])

  useEffect(() => {
    if (aramaMetni.trim() === '') setFiltreli(kayitlar)
    else setFiltreli(kayitlar.filter(k => k.food_name.toLowerCase().includes(aramaMetni.toLowerCase())))
  }, [aramaMetni, kayitlar])

  // ── Fotoğraf fonksiyonları ──
  const kayitlariYukle = async () => {
    const { data } = await supabase.from('standard_food_photos').select('*').order('food_name')
    setKayitlar(data ?? []); setFiltreli(data ?? [])
  }

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length + fotolar.length > 20) { setMesaj({ tip: 'hata', metin: 'En fazla 20 fotoğraf ekleyebilirsiniz.' }); return }
    setFotolar(prev => [...prev, ...files])
    setOnizleme(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const fotoCikar = (i: number) => {
    setFotolar(prev => prev.filter((_, idx) => idx !== i))
    setOnizleme(prev => prev.filter((_, idx) => idx !== i))
  }

  const turkceTemizle = (str: string) =>
    str.toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')

  const kaydet = async () => {
    if (!yemekAdı.trim()) { setMesaj({ tip: 'hata', metin: 'Yemek adı gerekli.' }); return }
    if (fotolar.length < 1) { setMesaj({ tip: 'hata', metin: 'En az 1 fotoğraf ekleyin.' }); return }
    setYukleniyor(true); setMesaj(null)
    try {
      const insertler = []
      for (const foto of fotolar) {
        const uzanti = foto.name.split('.').pop()
        const dosyaAdi = turkceTemizle(yemekAdı) + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6) + '.' + uzanti
        const { error: uploadErr } = await supabase.storage.from('food-photos').upload(dosyaAdi, foto, { contentType: foto.type, upsert: false })
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from('food-photos').getPublicUrl(dosyaAdi)
        insertler.push({ food_name: yemekAdı.trim(), category: kategori, photo_url: urlData.publicUrl })
      }
      const { error } = await supabase.from('standard_food_photos').insert(insertler)
      if (error) throw error
      setMesaj({ tip: 'basari', metin: `${insertler.length} fotoğraf başarıyla yüklendi!` })
      setYemekAdı(''); setFotolar([]); setOnizleme([])
      if (fileRef.current) fileRef.current.value = ''
      await kayitlariYukle()
    } catch (e: any) {
      setMesaj({ tip: 'hata', metin: 'Hata: ' + (e?.message ?? 'Bilinmeyen hata') })
    } finally { setYukleniyor(false) }
  }

  const sil = async (id: string, photoUrl: string) => {
    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) return
    setSilYukleniyor(id)
    try {
      const dosyaAdi = photoUrl.split('/food-photos/')[1]
      if (dosyaAdi) await supabase.storage.from('food-photos').remove([dosyaAdi])
      await supabase.from('standard_food_photos').delete().eq('id', id)
      await kayitlariYukle()
    } catch (e: any) { alert('Silme hatası: ' + e?.message) } finally { setSilYukleniyor(null) }
  }

  // ── Kategori fonksiyonları ──
  const kategorileriYukle = async () => {
    setKatLoading(true)
    const { data, error } = await supabase.from('menu_categories').select('*').order('sira')
    console.log('kategoriler:', data, error)
    setKategoriler(data ?? [])
    setKatLoading(false)
  }

  const katEkle = async () => {
    if (!yeniKat.id.trim() || !yeniKat.ad.trim()) return
    setKatSaving(true)
    await supabase.from('menu_categories').insert({
      id: yeniKat.id.trim().toLowerCase().replace(/\s+/g, '_'),
      ad: yeniKat.ad.trim(),
      emoji: yeniKat.emoji.trim(),
      sira: kategoriler.length + 1,
    })
    setYeniKat({ id: '', ad: '', emoji: '' })
    setKatSaving(false)
    kategorileriYukle()
  }

  const katSil = async (id: string) => {
    if (!confirm(`"${id}" kategorisini silmek istediğinize emin misiniz?`)) return
    setKatSilYukleniyor(id)
    await supabase.from('menu_categories').delete().eq('id', id)
    setKatSilYukleniyor(null)
    kategorileriYukle()
  }

  const gruplar: Record<string, any[]> = {}
  filtreli.forEach(k => { if (!gruplar[k.food_name]) gruplar[k.food_name] = []; gruplar[k.food_name].push(k) })

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ══════════════════════════════════
          KATEGORİLER
      ══════════════════════════════════ */}
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 8 }}>Kategoriler</h1>
      <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 24 }}>Buradan eklediğiniz kategoriler mobil uygulamada aşçıların yemek eklerken göreceği kategoriler olacaktır.</p>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Yeni Kategori Ekle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kategori ID (İngilizce)</label>
            <input value={yeniKat.id} onChange={e => setYeniKat(p => ({ ...p, id: e.target.value }))} placeholder="ornek: breakfast" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Görünen Ad</label>
            <input value={yeniKat.ad} onChange={e => setYeniKat(p => ({ ...p, ad: e.target.value }))} placeholder="Kahvaltı" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Emoji</label>
            <input value={yeniKat.emoji} onChange={e => setYeniKat(p => ({ ...p, emoji: e.target.value }))} placeholder="🥚" style={inp} />
          </div>
        </div>
        <button onClick={katEkle} disabled={katSaving}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          {katSaving ? 'Ekleniyor...' : '+ Ekle'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden', marginBottom: 32 }}>
        {katLoading ? (
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
                    <button onClick={() => katSil(k.id)} disabled={katSilYukleniyor === k.id}
                      style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', opacity: katSilYukleniyor === k.id ? 0.6 : 1 }}>
                      {katSilYukleniyor === k.id ? '...' : 'Sil'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ borderTop: '2px solid #F0E8DC', marginBottom: 24 }} />
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>🍽️ Yemek Fotoğraf Kütüphanesi</h1>

      {/* ── Fotoğraf Ekleme Formu ── */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Yeni Fotoğraf Ekle</h2>
        {mesaj && (
          <div style={{ background: mesaj.tip === 'basari' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${mesaj.tip === 'basari' ? '#86efac' : '#fecaca'}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <span style={{ color: mesaj.tip === 'basari' ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: 14 }}>{mesaj.metin}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Yemek Adı *</label>
            <input value={yemekAdı} onChange={e => setYemekAdı(e.target.value)} placeholder="Örn: Sütlaç, Mercimek Çorbası..."
              style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Kategori</label>
            <select value={kategori} onChange={e => setKategori(e.target.value)}
              style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, background: 'white' }}>
              {FOTO_KATEGORILER.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '10px 20px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              📷 Fotoğraf Seç ({fotolar.length}/20)
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={dosyaSec} style={{ display: 'none' }} />
          </div>
        </div>
        {onizleme.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {onizleme.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #e0e0e0' }} />
                <button onClick={() => fotoCikar(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>×</button>
              </div>
            ))}
          </div>
        )}
        <button onClick={kaydet} disabled={yukleniyor}
          style={{ padding: '12px 28px', background: '#E8622A', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: yukleniyor ? 0.7 : 1 }}>
          {yukleniyor ? 'Yükleniyor...' : '💾 Kaydet'}
        </button>
      </div>

      {/* ── Arama ── */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="🔍 Yemek adı ara..."
          style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box' }} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>{Object.keys(gruplar).length} yemek, {filtreli.length} fotoğraf</div>
      </div>

      {/* ── Fotoğraf Galerisi ── */}
      {Object.entries(gruplar).map(([yemekAdi, fotograflar]) => (
        <div key={yemekAdi} style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>{yemekAdi}</h3>
              <span style={{ fontSize: 12, color: '#888' }}>{fotograflar.length} fotoğraf · {FOTO_KATEGORILER.find(k => k.id === fotograflar[0]?.category)?.label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: fotograflar.length >= 5 ? '#15803d' : '#E8622A' }}>
              {fotograflar.length >= 5 ? '✅ Yeterli' : `⚠️ ${fotograflar.length}/5`}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {fotograflar.map((f: any) => (
              <div key={f.id} style={{ position: 'relative' }}>
                <img src={f.photo_url} alt={f.food_name} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #f0f0f0' }} />
                <button onClick={() => sil(f.id, f.photo_url)} disabled={silYukleniyor === f.id}
                  style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {silYukleniyor === f.id ? '...' : '×'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(gruplar).length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
          <div>Henüz fotoğraf yok</div>
        </div>
      )}

      {/* ══════════════════════════════════
          KATEGORİLER
      ══════════════════════════════════ */}
      <div style={{ borderTop: '2px solid #F0E8DC', margin: '32px 0 24px' }} />
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: '#4A2C0E', marginBottom: 8 }}>Kategoriler</h2>
      <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 24 }}>Buradan eklediğiniz kategoriler mobil uygulamada aşçıların yemek eklerken göreceği kategoriler olacaktır.</p>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Yeni Kategori Ekle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kategori ID (İngilizce)</label>
            <input value={yeniKat.id} onChange={e => setYeniKat(p => ({ ...p, id: e.target.value }))} placeholder="ornek: breakfast" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Görünen Ad</label>
            <input value={yeniKat.ad} onChange={e => setYeniKat(p => ({ ...p, ad: e.target.value }))} placeholder="Kahvaltı" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Emoji</label>
            <input value={yeniKat.emoji} onChange={e => setYeniKat(p => ({ ...p, emoji: e.target.value }))} placeholder="🥚" style={inp} />
          </div>
        </div>
        <button onClick={katEkle} disabled={katSaving}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          {katSaving ? 'Ekleniyor...' : '+ Ekle'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
        {katLoading ? (
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
                    <button onClick={() => katSil(k.id)} disabled={katSilYukleniyor === k.id}
                      style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', opacity: katSilYukleniyor === k.id ? 0.6 : 1 }}>
                      {katSilYukleniyor === k.id ? '...' : 'Sil'}
                    </button>
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