// @ts-nocheck
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

const BADGE_META = {
  new:     { emoji: '🌱', label: 'Yeni Aşçı',  bg: '#F3F4F6', color: '#6B7280' },
  trusted: { emoji: '⭐', label: 'Güvenilir',  bg: '#D1FAE5', color: '#059669' },
  master:  { emoji: '🏅', label: 'Usta Eller', bg: '#FEF3C7', color: '#D97706' },
  chef:    { emoji: '👑', label: 'Ev Şefi',    bg: '#FEF3C7', color: '#B45309' },
}

const CATEGORY_LABELS: Record<string, string> = {
  main:    '🍽️ Ana Yemek',
  soup:    '🥣 Çorba',
  salad:   '🥗 Salata',
  dessert: '🍮 Tatlı',
  pastry:  '🥐 Börek & Hamur',
  drink:   '🥤 İçecek',
  other:   '🍱 Diğer',
}

export default function ChefProfileClient({ chef, menuItems }) {
  const { addItem, items: cartItems } = useCart()
  const [activeCategory, setActiveCategory] = useState('all')
  const [shareMsg, setShareMsg] = useState('')

  const badge = BADGE_META[chef.badge ?? 'new']
  const categories = ['all', ...Array.from(new Set(menuItems.map((i: any) => i.category).filter(Boolean)))]
  const filtered = activeCategory === 'all' ? menuItems : menuItems.filter((i: any) => i.category === activeCategory)

  const cartCount = cartItems.reduce((s: number, i: any) => s + i.quantity, 0)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: chef.full_name, text: `${chef.full_name} - Ev Yemekleri`, url })
    } else {
      await navigator.clipboard.writeText(url)
      setShareMsg('Link kopyalandı!')
      setTimeout(() => setShareMsg(''), 2000)
    }
  }

  const handleAddToCart = (item: any) => {
    addItem({
      menu_item_id: item.id,
      chef_id: chef.chef_id,
      name: item.name,
      price: item.price,
      quantity: 1,
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4A2C0E, #7A4A20)', padding: '32px 16px 24px', color: 'white' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8622A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {chef.avatar_url
                ? <img src={chef.avatar_url} alt={chef.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : chef.full_name?.charAt(0).toUpperCase()
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                {chef.full_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {badge && (
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {badge.emoji} {badge.label}
                  </span>
                )}
                <span style={{ fontSize: 12, opacity: 0.8 }}>📍 {chef.location_approx ?? 'Konum belirtilmemiş'}</span>
              </div>
            </div>
            <button onClick={handleShare} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {shareMsg || '📤 Paylaş'}
            </button>
          </div>

          {/* İstatistikler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Puan', value: chef.avg_rating ? chef.avg_rating.toFixed(1) : '—' },
              { label: 'Sipariş', value: chef.total_orders ?? 0 },
              { label: 'Yorum', value: chef.total_reviews ?? 0 },
              { label: 'Menü', value: chef.active_menu_count ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px' }}>

        {/* Durum & Teslimat */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(74,44,14,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: chef.is_open ? '#10B981' : '#9CA3AF' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: chef.is_open ? '#10B981' : '#9CA3AF' }}>
                {chef.is_open ? 'Şu an açık' : 'Şu an kapalı'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(chef.delivery_types ?? []).includes('delivery') && (
                <span style={{ fontSize: 12, background: '#EFF6FF', color: '#3B82F6', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>🛵 Teslimat</span>
              )}
              {(chef.delivery_types ?? []).includes('pickup') && (
                <span style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>🚶 Gel-Al</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: '#8A7B6B', fontWeight: 600 }}>Min. ₺{chef.min_order_amount}</span>
          </div>
          {chef.bio && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#6B5B4E', lineHeight: 1.6, borderTop: '1px solid #F5EDD8', paddingTop: 10 }}>
              {chef.bio}
            </div>
          )}
        </div>

        {/* Kategori filtresi */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                background: activeCategory === cat ? '#E8622A' : 'white',
                color: activeCategory === cat ? 'white' : '#8A7B6B',
                boxShadow: '0 1px 4px rgba(74,44,14,0.08)',
              }}>
                {cat === 'all' ? '🍱 Tümü' : (CATEGORY_LABELS[cat] ?? cat)}
              </button>
            ))}
          </div>
        )}

        {/* Menü */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8A7B6B', padding: 40 }}>Bu kategoride ürün yok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((item: any) => {
              const inCart = cartItems.find((c: any) => c.menu_item_id === item.id)
              const outOfStock = item.stock_remaining !== null && item.stock_remaining <= 0
              return (
                <div key={item.id} style={{
                  background: 'white', borderRadius: 14, padding: 14,
                  boxShadow: '0 2px 8px rgba(74,44,14,0.06)',
                  border: '1px solid #E8E0D4',
                  opacity: outOfStock ? 0.6 : 1,
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 3 }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: 12, color: '#8A7B6B', marginBottom: 4, lineHeight: 1.4 }}>{item.description}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#E8622A' }}>₺{item.price}</span>
                      {item.stock_remaining !== null && (
                        <span style={{ fontSize: 11, color: item.stock_remaining <= 3 ? '#DC2626' : '#8A7B6B' }}>
                          {outOfStock ? 'Tükendi' : `${item.stock_remaining} porsiyon kaldı`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => !outOfStock && handleAddToCart(item)}
                    disabled={outOfStock}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: outOfStock ? '#E8E0D4' : inCart ? '#3D6B47' : '#E8622A',
                      color: 'white', fontSize: 18, cursor: outOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                    {inCart ? '✓' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sepet butonu */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, padding: '0 16px', zIndex: 100 }}>
          <Link href="/odeme" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#E8622A', color: 'white', borderRadius: 14, padding: '14px 20px',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(232,98,42,0.4)',
            maxWidth: 720, margin: '0 auto',
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>{cartCount}</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Sepete Git →</span>
            <span style={{ fontWeight: 700 }}>₺{cartItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toFixed(0)}</span>
          </Link>
        </div>
      )}
    </div>
  )
}