'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const MOCK_FAVORITES = [
  {
    chef_id: 'chef-1',
    full_name: 'Fatma Hanım',
    avg_rating: 4.9,
    total_reviews: 127,
    distance_km: 1.2,
    badge: 'master',
    is_open: true,
    location_approx: 'Seyhan, Adana',
    delivery_types: ['pickup', 'delivery'],
    preview_items: [
      { name: 'Kuru Fasulye & Pilav', price: 55 },
      { name: 'Sütlaç', price: 35 },
    ],
    notify: true,
  },
  {
    chef_id: 'chef-2',
    full_name: 'Zeynep Arslan',
    avg_rating: 5.0,
    total_reviews: 203,
    distance_km: 0.9,
    badge: 'chef',
    is_open: true,
    location_approx: 'Yüreğir, Adana',
    delivery_types: ['delivery'],
    preview_items: [
      { name: 'Peynirli Börek', price: 40 },
      { name: 'Baklava', price: 60 },
    ],
    notify: true,
  },
  {
    chef_id: 'chef-3',
    full_name: 'Ayşe Kaya',
    avg_rating: 4.7,
    total_reviews: 58,
    distance_km: 2.8,
    badge: 'trusted',
    is_open: false,
    location_approx: 'Çukurova, Adana',
    delivery_types: ['pickup'],
    preview_items: [
      { name: 'Vegan Mercimek Köfte', price: 35 },
    ],
    notify: false,
  },
]

const BADGE_META: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  new:     { emoji: '🌱', label: 'Yeni Aşçı',  bg: '#F3F4F6', color: '#6B7280' },
  trusted: { emoji: '⭐', label: 'Güvenilir',  bg: '#D1FAE5', color: '#059669' },
  master:  { emoji: '🏅', label: 'Usta Eller', bg: '#FEF3C7', color: '#D97706' },
  chef:    { emoji: '👑', label: 'Ev Şefi',    bg: '#FEF3C7', color: '#B45309' },
}

const CARD_COLORS = [
  'linear-gradient(135deg, #FECACA, #F87171)',
  'linear-gradient(135deg, #FDE68A, #F59E0B)',
  'linear-gradient(135deg, #A7F3D0, #34D399)',
]

export default function FavorilerimPage() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES)
  const [tab, setTab] = useState<'chefs' | 'items'>('chefs')

  const toggleNotify = (chef_id: string) => {
    setFavorites(prev => prev.map(f =>
      f.chef_id === chef_id ? { ...f, notify: !f.notify } : f
    ))
  }

  const removeFav = (chef_id: string) => {
    setFavorites(prev => prev.filter(f => f.chef_id !== chef_id))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', marginBottom: 20 }}>
          Favorilerim
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E8E0D4', marginBottom: 24 }}>
          {[['chefs', `👩‍🍳 Favori Aşçılar (${favorites.length})`], ['items', '❤️ Favori Yemekler (0)']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)} style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'transparent', fontFamily: 'inherit',
              color: tab === key ? '#E8622A' : '#8A7B6B',
              borderBottom: `2px solid ${tab === key ? '#E8622A' : 'transparent'}`,
              marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        {tab === 'chefs' && (
          <>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#4A2C0E', marginBottom: 8 }}>Henüz favori aşçınız yok</div>
                <div style={{ color: '#8A7B6B', fontSize: 13, marginBottom: 20 }}>Aşçı profillerinden ❤️ ile ekleyebilirsiniz</div>
                <Link href="/kesif" style={{ display: 'inline-block', padding: '10px 20px', background: '#E8622A', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                  Aşçıları Keşfet →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {favorites.map((chef, i) => {
                  const badge = BADGE_META[chef.badge ?? 'new']
                  return (
                    <div key={chef.chef_id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)' }}>
                      {/* Renkli header */}
                      <div style={{ background: CARD_COLORS[i % CARD_COLORS.length], height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative' }}>
                        👩‍🍳
                        <button onClick={() => removeFav(chef.chef_id)} style={{
                          position: 'absolute', top: 8, right: 8,
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.9)', border: 'none',
                          cursor: 'pointer', fontSize: 14, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}>❤️</button>
                      </div>

                      <div style={{ padding: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 4 }}>{chef.full_name}</div>
                        <div style={{ fontSize: 12, color: '#E8622A', fontWeight: 600, marginBottom: 4 }}>
                          ⭐ {chef.avg_rating} <span style={{ color: '#8A7B6B', fontWeight: 400 }}>({chef.total_reviews})</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#8A7B6B', marginBottom: 8 }}>📍 {chef.distance_km} km · {chef.location_approx}</div>

                        {/* Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, marginBottom: 10 }}>
                          {badge.emoji} {badge.label}
                        </div>

                        {/* Durum */}
                        <div style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 10, fontSize: 11, fontWeight: 600, background: chef.is_open ? '#ECFDF5' : '#FEE2E2', color: chef.is_open ? '#3D6B47' : '#DC2626' }}>
                          {chef.is_open ? '✅ Bugün açık' : '❌ Bugün kapalı'}
                        </div>

                        {/* Bildirim toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 11, color: '#8A7B6B' }}>🔔 Bildirim</span>
                          <button onClick={() => toggleNotify(chef.chef_id)} style={{
                            width: 40, height: 22, borderRadius: 11, border: 'none',
                            background: chef.notify ? '#3D6B47' : '#E8E0D4',
                            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                          }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%', background: 'white',
                              position: 'absolute', top: 3, left: chef.notify ? 21 : 3,
                              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                          </button>
                        </div>

                        <Link href={`/asci/${chef.chef_id}`} style={{
                          display: 'block', textAlign: 'center', padding: '8px 0',
                          background: chef.is_open ? '#E8622A' : '#E8E0D4',
                          color: chef.is_open ? 'white' : '#8A7B6B',
                          borderRadius: 8, textDecoration: 'none',
                          fontSize: 12, fontWeight: 700,
                          pointerEvents: chef.is_open ? 'auto' : 'none',
                        }}>
                          {chef.is_open ? 'Menüye Git →' : 'Kapalı'}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'items' && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#4A2C0E', marginBottom: 8 }}>Favori yemek yok</div>
            <div style={{ color: '#8A7B6B', fontSize: 13 }}>Yemek detay sayfasından ❤️ ile ekleyebilirsiniz</div>
          </div>
        )}

      </div>
    </div>
  )
}