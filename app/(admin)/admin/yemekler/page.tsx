'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const KATEGORILER = [
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
  // ── Fotoğraf state ──────────────────────────────────────────
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

  // ── Kategori state ──────────────────────────────────────────
  const [katList, setKatList]           = useState<any[]>([])
  const [katId, setKatId]               = useState('')
  const [katAd, setKatAd]               = useState('')
  const [katEmoji, setKatEmoji]         = useState('')
  const [katYukleniyor, setKatYukleniyor] = useState(false)
  const [katMesaj, setKatMesaj]         = useState<{tip: string, metin: string} | null>(null)
  const [katSilYukleniyor, setKatSilYukleniyor] = useState<string | null>(null)

  useEffect(() => { kayitlariYukle(); kategorileriYukle() }, [])

  useEffect(() => {
    if (aramaMetni.trim() === '') setFiltreli(kayitlar)
    else setFiltreli(kayitlar.filter(k => k.food_name.toLowerCase().includes(aramaMetni.toLowerCase())))
  }, [aramaMetni, kayitlar])

  // ── Fotoğraf fonksiyonları ──────────────────────────────────
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

  // ── Kategori fonksiyonları ──────────────────────────────────
  const kategorileriYukle = async () => {
    const res = await fetch('/api/admin/kategoriler')
    const d = await res.json()
    setKatList(d.categories ?? [])
  }

  const katEkle = async () => {
    if (!katId.trim() || !katAd.trim()) { setKatMesaj({ tip: 'hata', metin: 'ID ve Ad zorunludur.' }); return }
    setKatYukleniyor(true); setKatMesaj(null)
    try {
      const res = await fetch('/api/admin/kategoriler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: katId.trim(), name: katAd.trim(), emoji: katEmoji.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setKatMesaj({ tip: 'basari', metin: 'Kategori eklendi!' })
      setKatId(''); setKatAd(''); setKatEmoji('')
      await kategorileriYukle()
    } catch (e: any) {
      setKatMesaj({ tip: 'hata', metin: e.message })
    } finally { setKatYukleniyor(false) }
  }

  const katSil = async (id: string) => {
    if (!confirm(`"${id}" kategorisini silmek istediğinizden emin misiniz?`)) return
    setKatSilYukleniyor(id)
    try {
      await fetch('/api/admin/kategoriler', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await kategorileriYukle()
    } catch (e: any) { alert('Silme hatası: ' + e?.message) } finally { setKatSilYukleniyor(null) }
  }

  const gruplar: Record<string, any[]> = {}
  filtreli.forEach(k => { if (!gruplar[k.food_name]) gruplar[k.food_name] = []; gruplar[k.food_name].push(k) })

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
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
              {KATEGORILER.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
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
              <span style={{ fontSize: 12, color: '#888' }}>{fotograflar.length} fotoğraf · {KATEGORILER.find(k => k.id === fotograflar[0]?.category)?.label}</span>
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

      {/* ══════════════════════════════════════════════════════
          KATEGORİLER BÖLÜMÜ
      ══════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '2px solid #F0E8DC', margin: '32px 0 24px' }} />
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: '#4A2C0E', marginBottom: 20 }}>🏷️ Kategoriler</h2>
      <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 20, marginTop: -12 }}>
        Buradan eklediğiniz kategoriler mobil uygulamada aşçıların yemek eklerken göreceği kategoriler olacaktır.
      </p>

      {/* Kategori Ekleme Formu */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Yeni Kategori Ekle</h3>
        {katMesaj && (
          <div style={{ background: katMesaj.tip === 'basari' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${katMesaj.tip === 'basari' ? '#86efac' : '#fecaca'}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <span style={{ color: katMesaj.tip === 'basari' ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: 14 }}>{katMesaj.metin}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Kategori ID (İngilizce) *</label>
            <input value={katId} onChange={e => setKatId(e.target.value)} placeholder="Örn: main, soup, dessert"
              style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Görünen Ad *</label>
            <input value={katAd} onChange={e => setKatAd(e.target.value)} placeholder="Örn: Ana Yemek, Çorba"
              style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Emoji</label>
            <input value={katEmoji} onChange={e => setKatEmoji(e.target.value)} placeholder="🍽️"
              style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 18, boxSizing: 'border-box', textAlign: 'center' }} />
          </div>
          <button onClick={katEkle} disabled={katYukleniyor}
            style={{ padding: '10px 24px', background: '#E8622A', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: katYukleniyor ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {katYukleniyor ? '...' : '+ Ekle'}
          </button>
        </div>
      </div>

      {/* Kategori Listesi */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAF6EF' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#8A7B6B', letterSpacing: '0.05em' }}>EMOJİ</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#8A7B6B', letterSpacing: '0.05em' }}>ID</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#8A7B6B', letterSpacing: '0.05em' }}>AD</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#8A7B6B', letterSpacing: '0.05em' }}>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {katList.map((kat, i) => (
              <tr key={kat.id} style={{ borderTop: '1px solid #F5EDD8', background: i % 2 === 0 ? 'white' : '#FDFAF5' }}>
                <td style={{ padding: '14px 20px', fontSize: 22 }}>{kat.emoji}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#8A7B6B', fontFamily: 'monospace' }}>{kat.id}</td>
                <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#4A2C0E' }}>{kat.name}</td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button onClick={() => katSil(kat.id)} disabled={katSilYukleniyor === kat.id}
                    style={{ padding: '6px 16px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: katSilYukleniyor === kat.id ? 0.6 : 1 }}>
                    {katSilYukleniyor === kat.id ? '...' : 'Sil'}
                  </button>
                </td>
              </tr>
            ))}
            {katList.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 14 }}>Henüz kategori yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}