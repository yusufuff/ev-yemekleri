// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '',        label: 'Tümü',    emoji: '🍽️' },
  { value: 'main',    label: 'Ana Yemek', emoji: '🍲' },
  { value: 'soup',    label: 'Çorba',   emoji: '🥣' },
  { value: 'pastry',  label: 'Börek',   emoji: '🥐' },
  { value: 'dessert', label: 'Tatlı',   emoji: '🍮' },
  { value: 'salad',   label: 'Salata',  emoji: '🥗' },
]

const SORT_OPTIONS = [
  { value: 'default',    label: 'Varsayılan' },
  { value: 'price_asc',  label: 'Fiyat: Artan' },
  { value: 'price_desc', label: 'Fiyat: Azalan' },
  { value: 'rating',     label: 'En Yüksek Puan' },
]

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Yemek Kartı ──────────────────────────────────────────────────────────────

function FoodCard({ item }: { item: any }) {
  const { addItem, items: cartItems } = useCart()
  const inCart = cartItems.find(c => c.id === item.id)

  const cover = item.photos?.[0] ?? null
  const chef  = item.chef
  const chefName = chef?.user?.full_name ?? 'Aşçı'

  const stockPct = item.daily_stock > 0
    ? (item.remaining_stock / item.daily_stock) * 100
    : 100

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(74,44,14,0.07)',
      border: '1px solid rgba(232,224,212,0.5)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Görsel */}
      <div style={{
        height: 160,
        background: cover
          ? `url(${cover}) center/cover no-repeat`
          : 'linear-gradient(135deg,#FDE68A,#F59E0B)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 52,
        position: 'relative',
        flexShrink: 0,
      }}>
        {!cover && '🍽️'}

        {/* Stok uyarısı */}
        {item.remaining_stock <= 3 && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: '#DC2626',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 99,
          }}>
            ⚡ Son {item.remaining_stock} porsiyon
          </div>
        )}
      </div>

      {/* İçerik */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', lineHeight: 1.3 }}>{item.name}</div>

        {item.description && (
          <div style={{
            fontSize: 12,
            color: '#8A7B6B',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.description}
          </div>
        )}

        {/* Aşçı */}
        <Link href={`/asci/${item.chef_id}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#FDE68A,#F59E0B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
            }}>
              👩‍🍳
            </div>
            <span style={{ fontSize: 12, color: '#5A6B3E', fontWeight: 600 }}>{chefName}</span>
            {chef?.avg_rating > 0 && (
              <span style={{ fontSize: 11, color: '#8A7B6B', marginLeft: 'auto' }}>
                ⭐ {chef.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        </Link>

        {/* Stok çubuğu */}
        <div style={{ height: 4, background: '#F3EDE4', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${stockPct}%`,
            background: stockPct < 25 ? '#DC2626' : stockPct < 50 ? '#F59E0B' : '#3D6B47',
            borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>

        {/* Fiyat + Ekle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#E8622A' }}>
            ₺{item.price.toFixed(0)}
          </span>
          <button
            onClick={() => addItem({
              id: item.id,
              name: item.name,
              price: item.price,
              chef_id: item.chef_id,
              chef_name: chefName,
              photo: cover,
            })}
            style={{
              background: inCart ? '#3D6B47' : '#E8622A',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {inCart ? `🛒 ${inCart.quantity}` : '+ Ekle'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function AraPage() {
  const [query, setQuery]       = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort]         = useState('default')
  const [maxPrice, setMaxPrice] = useState(500)
  const [items, setItems]       = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 400)

  const search = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (debouncedQuery) params.set('q', debouncedQuery)
      if (category)       params.set('category', category)
      params.set('max_price', String(maxPrice))

      const res  = await fetch(`/api/search?${params}`)
      const data = await res.json()

      let sorted = data.items ?? []

      if (sort === 'price_asc')  sorted = [...sorted].sort((a, b) => a.price - b.price)
      if (sort === 'price_desc') sorted = [...sorted].sort((a, b) => b.price - a.price)
      if (sort === 'rating')     sorted = [...sorted].sort((a, b) =>
        (b.chef?.avg_rating ?? 0) - (a.chef?.avg_rating ?? 0)
      )

      setItems(sorted)
      setTotal(data.total ?? 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, category, maxPrice, sort])

  // Otomatik arama — her filtre değişiminde
  useEffect(() => {
    search()
  }, [search])

  // Input'a otomatik fokus
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF6' }}>

      {/* ─── Header ─── */}
      <div style={{
        background: 'linear-gradient(135deg,#4A2C0E,#7A4520)',
        padding: '24px 20px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ color: 'white', fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Geri</Link>
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            color: 'white',
            fontSize: 22,
            fontWeight: 900,
            marginBottom: 16,
          }}>
            🔍 Yemek Ara
          </div>

          {/* Arama kutusu */}
          <div style={{
            display: 'flex',
            background: 'white',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            <span style={{ padding: '0 14px', fontSize: 20, display: 'flex', alignItems: 'center' }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Kuru fasulye, börek, çorba..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 15,
                padding: '14px 0',
                color: '#4A2C0E',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  padding: '0 16px',
                  background: 'none',
                  border: 'none',
                  color: '#8A7B6B',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* ─── Filtreler ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>

          {/* Kategori chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 99,
                  border: '1.5px solid',
                  borderColor: category === cat.value ? '#E8622A' : '#E8E0D4',
                  background: category === cat.value ? '#E8622A' : 'white',
                  color: category === cat.value ? 'white' : '#4A2C0E',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Sort + Fiyat */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #E8E0D4',
                background: 'white',
                color: '#4A2C0E',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontSize: 12, color: '#8A7B6B', whiteSpace: 'nowrap' }}>
                Max ₺{maxPrice}
              </span>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#E8622A' }}
              />
            </div>
          </div>
        </div>

        {/* ─── Sonuç sayısı ─── */}
        {searched && !loading && (
          <div style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 16 }}>
            {total > 0
              ? `${total} yemek bulundu${query ? ` "${query}" için` : ''}`
              : 'Sonuç bulunamadı'}
          </div>
        )}

        {/* ─── Loading ─── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A7B6B' }}>
            <div style={{
              width: 36,
              height: 36,
              border: '3px solid #F3EDE4',
              borderTop: '3px solid #E8622A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <span>Aranıyor...</span>
          </div>
        )}

        {/* ─── Boş durum ─── */}
        {!loading && searched && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#4A2C0E', marginBottom: 8 }}>
              Yemek bulunamadı
            </div>
            <div style={{ fontSize: 13, color: '#8A7B6B' }}>
              Farklı bir arama deneyin veya filtreleri değiştirin
            </div>
          </div>
        )}

        {/* ─── İlk açılış ─── */}
        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#4A2C0E' }}>
              Ne yemek istersiniz?
            </div>
            <div style={{ fontSize: 13, color: '#8A7B6B', marginTop: 6 }}>
              Arama yapın veya kategori seçin
            </div>
          </div>
        )}

        {/* ─── Grid ─── */}
        {!loading && items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {items.map(item => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}