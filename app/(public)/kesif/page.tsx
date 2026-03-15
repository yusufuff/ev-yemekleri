'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Tipler ────────────────────────────────────────────────────────────────────
interface Chef {
  chef_id: string
  full_name: string
  avg_rating: number | null
  total_reviews: number
  distance_km: number
  delivery_types: string[]
  badge: string | null
  is_open: boolean
  location_approx: string | null
  preview_items: { id: string; name: string; price: number; category: string; remaining_stock: number; stock_status: string }[]
}

// ── Renk paleti (sıralı) ──────────────────────────────────────────────────────
const CARD_COLORS = [
  'linear-gradient(135deg, #FECACA, #F87171)',
  'linear-gradient(135deg, #FDE68A, #F59E0B)',
  'linear-gradient(135deg, #A7F3D0, #34D399)',
  'linear-gradient(135deg, #BAE6FD, #38BDF8)',
  'linear-gradient(135deg, #DDD6FE, #8B5CF6)',
  'linear-gradient(135deg, #FBCFE8, #EC4899)',
]

const BADGE_META: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  new:     { emoji: '🌱', label: 'Yeni Aşçı',  bg: '#F3F4F6', color: '#6B7280' },
  trusted: { emoji: '⭐', label: 'Güvenilir',  bg: '#D1FAE5', color: '#059669' },
  master:  { emoji: '🏅', label: 'Usta Eller', bg: '#FEF3C7', color: '#D97706' },
  chef:    { emoji: '👑', label: 'Ev Şefi',    bg: '#FEF3C7', color: '#B45309' },
}

const FILTERS = [
  { key: 'radius_2',   label: '📍 2 km',          type: 'radius', value: '2' },
  { key: 'radius_5',   label: '📍 5 km',           type: 'radius', value: '5' },
  { key: 'radius_10',  label: '📍 10 km',          type: 'radius', value: '10' },
  { key: 'cat_main',   label: '🍽️ Ev Yemeği',     type: 'category', value: 'main' },
  { key: 'cat_vegan',  label: '🥗 Vegan',          type: 'category', value: 'vegan' },
  { key: 'cat_pastry', label: '🥐 Börek',          type: 'category', value: 'pastry' },
  { key: 'cat_dessert',label: '🍮 Tatlı',          type: 'category', value: 'dessert' },
  { key: 'cat_soup',   label: '🥣 Çorba',          type: 'category', value: 'soup' },
  { key: 'sort_rating',label: '⭐ En Yüksek Puan', type: 'sort', value: 'rating' },
  { key: 'sort_fast',  label: '⚡ En Hızlı',       type: 'sort', value: 'fast' },
  { key: 'sort_price', label: '💰 Uygun Fiyat',    type: 'sort', value: 'price' },
]

// ── Harita bileşeni (mock) ────────────────────────────────────────────────────
function MockMap({ chefs, radius, onRadius, selectedPin, onPinClick }: { chefs: Chef[]; radius: number; onRadius: (v: number) => void; selectedPin: string | null; onPinClick: (id: string | null) => void }) {
  return (
    <div style={{ position: 'sticky', top: '72px' }}>
      {/* Slider */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid #E8E0D4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8A7B6B', fontWeight: 600 }}>📍 Mesafe:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#E8622A' }}>{radius} km</span>
        </div>
        <input type="range" min={1} max={10} value={radius} onChange={e => onRadius(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#E8622A', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8A7B6B', marginTop: '4px' }}>
          <span>1 km</span><span>10 km</span>
        </div>
      </div>

      {/* Harita alanı */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E8E0D4', background: '#E8F4E8', position: 'relative', height: '420px' }}>
        {/* Grid arka plan */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

        {/* Yeşil bloklar (bina simülasyonu) */}
        {[[15,10,18,14],[40,25,14,20],[65,15,20,16],[20,50,22,18],[55,45,16,22],[30,70,24,16],[70,60,18,20],[10,75,16,14]].map(([l,t,w,h],i) => (
          <div key={i} style={{ position: 'absolute', left: `${l}%`, top: `${t}%`, width: `${w}px`, height: `${h}px`, background: 'rgba(100,160,100,0.35)', borderRadius: '3px' }} />
        ))}

        {/* Merkez — kullanıcı */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: `${radius * 18}px`, height: `${radius * 18}px`, borderRadius: '50%', border: '2.5px dashed #E8622A', background: 'rgba(232,98,42,0.08)', transform: 'translate(-50%,-50%)', position: 'absolute', top: '50%', left: '50%' }} />
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#E8622A', border: '3px solid white', boxShadow: '0 2px 8px rgba(232,98,42,0.5)', position: 'relative', zIndex: 2 }} />
          <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', background: '#E8622A', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>Siz</div>
        </div>

        {/* Aşçı pinleri */}
        {chefs.filter(c => c.is_open).map((chef, i) => {
          const angle = (i / chefs.length) * Math.PI * 2
          const dist = 0.3 + (chef.distance_km / 10) * 0.35
          const x = 50 + Math.cos(angle) * dist * 100
          const y = 50 + Math.sin(angle) * dist * 60
          return (
            <div key={chef.chef_id} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', zIndex: 3, cursor: 'pointer' }}
              onClick={() => onPinClick(selectedPin === chef.chef_id ? null : chef.chef_id)}>
              <div style={{ background: '#3D6B47', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>👩‍🍳</div>
              <div style={{ position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%)', background: 'white', color: '#4A2C0E', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                {chef.distance_km.toFixed(1)}km
              </div>
              {selectedPin === chef.chef_id && (
                <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: '10px', padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 10, border: '1px solid #E8E0D4' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#4A2C0E', marginBottom: '2px' }}>{chef.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#E8622A', marginBottom: '2px' }}>⭐ {chef.avg_rating?.toFixed(1)}</div>
                  <div style={{ fontSize: '11px', color: '#8A7B6B', marginBottom: '8px' }}>📍 {chef.distance_km.toFixed(1)} km</div>
                  <a href={`/asci/${chef.chef_id}`} style={{ display: 'block', textAlign: 'center', padding: '5px 0', background: '#E8622A', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>Profile Git →</a>
                </div>
              )}
            </div>
          )
        })}

        {/* Kapalı pinler */}
        {chefs.filter(c => !c.is_open).map((chef, i) => {
          const angle = (i / chefs.length) * Math.PI * 2 + 1
          const dist = 0.5 + (chef.distance_km / 10) * 0.3
          const x = 50 + Math.cos(angle) * dist * 90
          const y = 50 + Math.sin(angle) * dist * 55
          return (
            <div key={chef.chef_id} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', zIndex: 2 }}>
              <div style={{ background: '#9CA3AF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '2px solid white', opacity: 0.7 }}>👩‍🍳</div>
            </div>
          )
        })}

        {/* Açıklama */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(255,255,255,0.92)', borderRadius: '8px', padding: '8px 12px', fontSize: '10px', color: '#4A2C0E', lineHeight: 1.8 }}>
          🟢 Açık aşçı &nbsp;⚫ Kapalı<br />🔴 Konumunuz
        </div>
      </div>
    </div>
  )
}

// ── Chef Kart ─────────────────────────────────────────────────────────────────
function ChefCard({ chef, index }: { chef: Chef; index: number }) {
  const badge = BADGE_META[chef.badge ?? 'new']
  const color = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <Link href={`/asci/${chef.chef_id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)',
        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
        opacity: chef.is_open ? 1 : 0.65,
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(74,44,14,0.14)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(74,44,14,0.08)' }}
      >
        {/* Renkli başlık */}
        <div style={{ background: color, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: 'relative' }}>
          👩‍🍳
          {!chef.is_open && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px' }}>Kapalı</span>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div style={{ padding: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#4A2C0E', marginBottom: '4px' }}>{chef.full_name}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {chef.avg_rating && (
              <span style={{ color: '#E8622A', fontSize: '12px', fontWeight: 600 }}>
                ⭐ {chef.avg_rating.toFixed(1)} <span style={{ color: '#8A7B6B' }}>({chef.total_reviews})</span>
              </span>
            )}
            <span style={{ color: '#8A7B6B', fontSize: '12px' }}>📍 {chef.distance_km.toFixed(1)} km</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {chef.delivery_types.includes('delivery') && (
              <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>🛵 Teslimat</span>
            )}
            {chef.delivery_types.includes('pickup') && (
              <span style={{ fontSize: '11px', background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>🚶 Gel-Al</span>
            )}
            {chef.preview_items.slice(0, 2).map(item => (
              <span key={item.id} style={{ fontSize: '11px', background: '#FAF6EF', color: '#7A4A20', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>
                {item.category === 'main' ? '🍽️' : item.category === 'dessert' ? '🍮' : item.category === 'pastry' ? '🥐' : item.category === 'soup' ? '🥣' : '🥗'}
                {' '}{item.category === 'main' ? 'Ev Yemeği' : item.category === 'dessert' ? 'Tatlı' : item.category === 'pastry' ? 'Börek' : item.category === 'soup' ? 'Çorba' : 'Salata'}
              </span>
            ))}
          </div>

          {badge && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
              {badge.emoji} {badge.label}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: chef.is_open ? '#10B981' : '#9CA3AF' }} />
            <span style={{ fontSize: '11px', color: chef.is_open ? '#10B981' : '#9CA3AF', fontWeight: 600 }}>
              {chef.is_open ? 'Şu an açık' : 'Kapalı'}
            </span>
            {chef.is_open && chef.preview_items[0] && (
              <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#E8622A' }}>
                ₺{chef.preview_items[0].price}'den başlayan
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Ana içerik ────────────────────────────────────────────────────────────────
function KesifInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [chefs, setChefs] = useState<Chef[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<string[]>(['radius_5', 'cat_main'])
  const [radius, setRadius] = useState(Number(searchParams.get('km') ?? 5))
  const [selectedPin, setSelectedPin] = useState<string | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Aktif kategoriye göre sort/category belirle
  const activeSort = activeFilters.find(f => f.startsWith('sort_'))?.replace('sort_', '') ?? 'distance'
  const activeCategory = FILTERS.find(f => activeFilters.includes(f.key) && f.type === 'category')?.value ?? undefined

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ sort: activeSort === 'fast' ? 'distance' : activeSort })
    if (activeCategory && activeCategory !== 'vegan') params.set('category', activeCategory)
    fetch(`/api/discover?${params}`)
      .then(r => r.json())
      .then(data => { setChefs(data.chefs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeSort, activeCategory, radius])

  function toggleFilter(key: string, type: string) {
    setActiveFilters(prev => {
      const withoutSameType = prev.filter(f => {
        const meta = FILTERS.find(x => x.key === f)
        return meta?.type !== type
      })
      return prev.includes(key) ? withoutSameType : [...withoutSameType, key]
    })
  }

  async function handleAiSearch() {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiResult('Arama yapılıyor...')
    // Simüle edilmiş AI sonucu
    await new Promise(r => setTimeout(r, 800))
    setAiResult(`"${aiQuery}" için ${chefs.length} aşçı bulundu. En yakın ve en yüksek puanlı aşçılar listeleniyor.`)
    setAiLoading(false)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#FAF6EF' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>

        {/* AI Arama barı */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1.5px solid #E8E0D4', borderRadius: '12px', padding: '0 16px', boxShadow: '0 2px 8px rgba(74,44,14,0.06)' }}>
            <span style={{ fontSize: '16px' }}>🤖</span>
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
              placeholder="Doğal dilde ara: 'yakınımda börekçi var mı?' veya 'en ucuz tatlı'"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#4A2C0E', fontFamily: 'inherit', padding: '14px 0', background: 'transparent' }}
            />
          </div>
          <button onClick={handleAiSearch} disabled={aiLoading} style={{
            padding: '0 20px', background: '#E8622A', color: 'white', border: 'none',
            borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
            opacity: aiLoading ? 0.7 : 1,
          }}>
            ✨ AI ile Ara
          </button>
        </div>

        {/* AI sonucu */}
        {aiResult && (
          <div style={{ background: '#FEF3EC', border: '1px solid #F28B5E', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <span style={{ fontSize: '13px', color: '#4A2C0E' }}><strong>AI Arama Sonucu:</strong> {aiResult}</span>
            <button onClick={() => setAiResult('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8A7B6B', fontSize: '16px' }}>✕</button>
          </div>
        )}

        {/* Filtre çubuğu */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => toggleFilter(f.key, f.type)} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
              background: activeFilters.includes(f.key) ? '#E8622A' : 'white',
              color: activeFilters.includes(f.key) ? 'white' : '#8A7B6B',
              boxShadow: '0 1px 4px rgba(74,44,14,0.08)',
            }}>
              {f.label}
            </button>
          ))}
          <button style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #E8E0D4', background: 'white', color: '#4A2C0E', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚙️ Detaylı Filtre
          </button>
        </div>

        {/* İçerik: Sol (kartlar) + Sağ (harita) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px', alignItems: 'start' }}>

          {/* Sol: Header + 2'li grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ background: '#E8622A', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, marginRight: '8px' }}>2</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#E8622A', letterSpacing: '1px', textTransform: 'uppercase' }}>
                AŞÇI KARTLARI — 2'Lİ GRİD, TIKLAYINCA PROFİL SAYFASI
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ height: '220px', background: 'linear-gradient(90deg,#F5EDD8 25%,#FAF6EF 50%,#F5EDD8 75%)', backgroundSize: '200% 100%', borderRadius: '16px', animation: 'shimmer 1.4s infinite' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {chefs.map((chef, i) => <ChefCard key={chef.chef_id} chef={chef} index={i} />)}
              </div>
            )}
          </div>

          {/* Sağ: Harita */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ background: '#E8622A', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, marginRight: '8px' }}>3</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#E8622A', letterSpacing: '1px', textTransform: 'uppercase' }}>
                KONUM HARİTASI — 1-10 KM YARIÇAP, AŞÇI PİNLERİ
              </span>
            </div>
            <MockMap chefs={chefs} radius={radius} onRadius={setRadius} selectedPin={selectedPin} onPinClick={setSelectedPin} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 900px) {
          .kesif-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function KesifPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#8A7B6B', fontSize: 13 }}>Yükleniyor…</div>}>
      <KesifInner />
    </Suspense>
  )
}