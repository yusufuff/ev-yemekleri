'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  useChefProfile,
  formatWorkingHours,
  isTodayOpen,
  BADGE_META,
} from '@/hooks/useChefProfile'
import { CATEGORY_META, ALLERGEN_META, type MenuItem, type MenuCategory } from '@/types/menu'
import { useCart } from '@/hooks/useCart'

// ─── Yıldız render ────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="stars-wrap" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#F59E0B' : '#E8E0D4', fontSize: size }}>★</span>
      ))}
    </span>
  )
}

// ─── Puan çubuğu ──────────────────────────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="rb-row">
      <span className="rb-star">{star}★</span>
      <div className="rb-track"><div className="rb-fill" style={{ width: `${pct}%` }} /></div>
      <span className="rb-count">{count}</span>
    </div>
  )
}

// ─── Fotoğraf galerisi ────────────────────────────────────────────────────────

function PhotoGallery({ photos, chefName }: { photos: string[]; chefName: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox,  setLightbox]  = useState(false)

  if (photos.length === 0) {
    return (
      <div className="pg-empty">
        <span style={{ fontSize: 64 }}>👩‍🍳</span>
      </div>
    )
  }

  const grid = photos.slice(0, 5)

  return (
    <>
      <div className="pg-grid">
        {/* Ana görsel */}
        <div className="pg-main" onClick={() => { setActiveIdx(0); setLightbox(true) }}>
          <img src={grid[0]} alt={chefName} className="pg-img" />
        </div>
        {/* Küçük görseller */}
        <div className="pg-thumbs">
          {grid.slice(1).map((url, i) => (
            <div
              key={url}
              className="pg-thumb"
              onClick={() => { setActiveIdx(i + 1); setLightbox(true) }}
            >
              <img src={url} alt={`${chefName} ${i + 2}`} className="pg-img" />
              {/* +N overlay */}
              {i === 3 && photos.length > 5 && (
                <div className="pg-more">+{photos.length - 4}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="pg-lightbox" onClick={() => setLightbox(false)}>
          <button className="pg-lb-close" onClick={() => setLightbox(false)} aria-label="Kapat">×</button>
          <button
            className="pg-lb-prev"
            onClick={e => { e.stopPropagation(); setActiveIdx(i => (i - 1 + photos.length) % photos.length) }}
            aria-label="Önceki"
          >‹</button>
          <img
            src={photos[activeIdx]}
            alt={`${chefName} ${activeIdx + 1}`}
            className="pg-lb-img"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="pg-lb-next"
            onClick={e => { e.stopPropagation(); setActiveIdx(i => (i + 1) % photos.length) }}
            aria-label="Sonraki"
          >›</button>
          <div className="pg-lb-counter">{activeIdx + 1} / {photos.length}</div>
        </div>
      )}
    </>
  )
}

// ─── Menü kartı (profil görünümü) ─────────────────────────────────────────────

function MenuItemCard({ item, chefId, chefName }: { item: MenuItem; chefId: string; chefName: string }) {
  const { addItem, items: cartItems } = useCart()
  const [added, setAdded] = useState(false)

  const inCart      = cartItems.find(c => c.menu_item_id === item.id)
  const isOutOfStock = (item.remaining_stock ?? 0) === 0
  const cat          = CATEGORY_META[item.category]
  const cover        = item.photos?.[0]

  const handleAdd = () => {
    addItem({
      menu_item_id:    item.id,
      chef_id:         chefId,
      chef_name:       chefName,
      name:            item.name,
      price:           item.price,
      category:        item.category,
      remaining_stock: item.remaining_stock ?? null,
      quantity:        1,
      photo:           cover,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={`mic-card ${isOutOfStock ? 'mic-card--out' : ''}`}>
      {/* Görsel */}
      <div className="mic-img">
        {cover
          ? <img src={cover} alt={item.name} className="mic-photo" />
          : <span className="mic-emoji">{cat?.emoji ?? '🍽️'}</span>
        }
        {isOutOfStock && <div className="mic-out-badge">Tükendi</div>}
      </div>

      <div className="mic-body">
        <Link href={`/yemek/${item.id}`} className="mic-name" style={{ textDecoration: 'none', color: 'inherit' }}>{item.name}</Link>

        {item.description && (
          <div className="mic-desc">{item.description}</div>
        )}

        {/* Alerjenler */}
        {item.allergens?.length > 0 && (
          <div className="mic-allergens">
            {item.allergens.map(a => (
              <span key={a} className="mic-allergen" title={ALLERGEN_META[a]?.label}>
                {ALLERGEN_META[a]?.emoji}
              </span>
            ))}
          </div>
        )}

        <div className="mic-footer">
          <div className="mic-meta">
            <div className="mic-price">₺{item.price.toFixed(0)}</div>
            {item.prep_time_min && (
              <div className="mic-prep">⏱️ {item.prep_time_min} dk</div>
            )}
          </div>

          {!isOutOfStock && (
            <button
              className={`mic-add-btn ${inCart ? 'mic-add-btn--in-cart' : ''} ${added ? 'mic-add-btn--added' : ''}`}
              onClick={handleAdd}
              disabled={isOutOfStock}
              type="button"
              aria-label={`${item.name} sepete ekle`}
            >
              {added ? '✓ Eklendi' : inCart ? `🛒 ${inCart.quantity}` : '+ Ekle'}
            </button>
          )}
        </div>

        {/* Stok durumu */}
        {!isOutOfStock && (item.remaining_stock ?? 0) <= 3 && (
          <div className="mic-stock-warn">
            ⚡ Son {item.remaining_stock} porsiyon!
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Yorum kartı ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: any }) {
  const [showReply, setShowReply] = useState(false)
  const name     = review.users?.full_name ?? 'Anonim'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const date     = new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="rc-card">
      <div className="rc-header">
        <div className="rc-avatar">
          {review.users?.avatar_url
            ? <img src={review.users.avatar_url} alt={name} className="rc-avatar-img" />
            : <span>{initials}</span>
          }
        </div>
        <div className="rc-meta">
          <div className="rc-name">{name}</div>
          <div className="rc-date">{date}</div>
        </div>
        <div className="rc-stars">
          <Stars rating={review.rating} size={13} />
        </div>
      </div>

      {review.comment && (
        <p className="rc-comment">"{review.comment}"</p>
      )}

      {/* Aşçı yanıtı */}
      {review.chef_reply && (
        <div className="rc-reply">
          <div className="rc-reply-label">👩‍🍳 Aşçının Yanıtı</div>
          <p className="rc-reply-text">{review.chef_reply}</p>
        </div>
      )}
    </div>
  )
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────

export default function AsciProfilPage({ params }: { params: { id: string } }) {
  const {
    data, loading, error,
    reviewPage, setReviewPage,
    isFavorited, favLoading, toggleFavorite,
  } = useChefProfile(params.id)

  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all')

  if (loading) return (
    <div className="ap-loading">
      <div className="ap-spinner" />
      <span>Profil yükleniyor…</span>
    </div>
  )

  if (error || !data) return (
    <div className="ap-error">
      <div style={{ fontSize: 48 }}>😔</div>
      <div>{error ?? 'Aşçı bulunamadı.'}</div>
      <Link href="/kesif" className="ap-back-btn">← Keşfete Dön</Link>
    </div>
  )

  const { profile, menu_items, reviews, review_count, review_pages, rating_dist, favorite_count } = data
  const user        = profile.users
  const badge       = profile.badge ? BADGE_META[profile.badge] : null
  const isOpen      = profile.is_open && isTodayOpen(profile.working_hours)
  const workingHrs  = formatWorkingHours(profile.working_hours)
  const totalReviews = Object.values(rating_dist).reduce((a, b) => a + b, 0)

  // Fotoğraflar — menü öğelerinden topla
  const allPhotos = menu_items.flatMap(m => m.photos ?? []).slice(0, 8)

  // Kategoriler
  const cats = Array.from(new Set(menu_items.map(m => m.category)))
  const filteredMenu = activeCategory === 'all'
    ? menu_items
    : menu_items.filter(m => m.category === activeCategory)

  return (
    <div className="ap-page">

      {/* ── Üst çubuk (geri + aksiyonlar) ── */}
      <div className="ap-topbar">
        <Link href="/kesif" className="ap-back">← Geri</Link>
        <div className="ap-topbar-actions">
          <button
            className={`ap-fav-btn ${isFavorited ? 'ap-fav-btn--active' : ''}`}
            onClick={toggleFavorite}
            disabled={favLoading}
            type="button"
            aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            {isFavorited ? '❤️' : '🤍'} {isFavorited ? 'Takipte' : 'Takip Et'}
          </button>
          <button
  type="button"
  onClick={() => {
    const url = `https://www.anneelim.com/asci/${params.id}`
    const text = `${user.full_name} ev yemekleri! Siparis icin: ${url} #anneelim #evyemekleri`
    if (navigator.share) {
      navigator.share({ title: user.full_name + ' - Anneelim', text, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link kopyalandi!')
    }
  }}
  style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #E8E0D4', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#4A2C0E' }}
>
  Paylas
</button>
        </div>
      </div>

      {/* ── Fotoğraf galerisi ── */}
      <div className="ap-gallery">
        <PhotoGallery photos={allPhotos} chefName={user.full_name} />
      </div>

      <div className="ap-body">
        <div className="ap-left">

          {/* ── Profil başlık kartı ── */}
          <div className="ap-card ap-profile-card">
            <div className="ap-profile-top">
              {/* Avatar */}
              <div className="ap-avatar">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.full_name} className="ap-avatar-img" />
                  : <span className="ap-avatar-initials">
                      {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                }
              </div>

              <div className="ap-profile-info">
                <h1 className="ap-chef-name">{user.full_name}</h1>

                {/* Rozet */}
                {badge && (
                  <div className={`rozet ${badge.cls}`} style={{ display: 'inline-flex', marginBottom: 6 }}>
                    {badge.emoji} {badge.label}
                  </div>
                )}

                {/* Puan */}
                <div className="ap-rating-row">
                  <Stars rating={profile.avg_rating ?? 0} size={16} />
                  <span className="ap-rating-num">{profile.avg_rating?.toFixed(1) ?? '—'}</span>
                  <span className="ap-rating-count">({review_count} yorum)</span>
                </div>
              </div>

              {/* Durum */}
              <div className={`ap-status ${isOpen ? 'ap-status--open' : 'ap-status--closed'}`}>
                <span className="ap-status-dot" />
                {isOpen ? 'Şu an açık' : 'Şu an kapalı'}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="ap-bio">{profile.bio}</p>
            )}

            <hr className="ap-divider" />

            {/* Meta bilgiler */}
            <div className="ap-meta-grid">
              <div className="ap-meta-item">
                <span className="ap-meta-icon">📍</span>
                <div>
                  <div className="ap-meta-label">Konum</div>
                  <div className="ap-meta-value">{profile.location_approx ?? 'Belirtilmemiş'}</div>
                </div>
              </div>
              <div className="ap-meta-item">
                <span className="ap-meta-icon">🛵</span>
                <div>
                  <div className="ap-meta-label">Teslimat</div>
                  <div className="ap-meta-value">
                    {profile.delivery_types?.includes('delivery') ? 'Teslimat' : ''}
                    {profile.delivery_types?.includes('delivery') && profile.delivery_types?.includes('pickup') ? ' & ' : ''}
                    {profile.delivery_types?.includes('pickup') ? 'Gel-Al' : ''}
                  </div>
                </div>
              </div>
              <div className="ap-meta-item">
                <span className="ap-meta-icon">⏰</span>
                <div>
                  <div className="ap-meta-label">Çalışma Saati</div>
                  <div className="ap-meta-value">{workingHrs}</div>
                </div>
              </div>
              <div className="ap-meta-item">
                <span className="ap-meta-icon">📦</span>
                <div>
                  <div className="ap-meta-label">Toplam Sipariş</div>
                  <div className="ap-meta-value">{profile.total_orders.toLocaleString('tr-TR')}</div>
                </div>
              </div>
              <div className="ap-meta-item">
                <span className="ap-meta-icon">❤️</span>
                <div>
                  <div className="ap-meta-label">Takipçi</div>
                  <div className="ap-meta-value">{favorite_count}</div>
                </div>
              </div>
              <div className="ap-meta-item">
                <span className="ap-meta-icon">📏</span>
                <div>
                  <div className="ap-meta-label">Teslimat Yarıçapı</div>
                  <div className="ap-meta-value">{profile.delivery_radius_km} km</div>
                </div>
              </div>
            </div>

            {/* Yaklaşık konum (harita placeholder) */}
            <div className="ap-map-placeholder">
              <div className="ap-map-inner">
                🗺️
                <div className="ap-map-label">Yaklaşık Konum (Kesin Adres Gizlidir)</div>
              </div>
            </div>
          </div>

          {/* ── Puan dağılımı ── */}
          {totalReviews > 0 && (
            <div className="ap-card">
              <div className="ap-card-title">Puan Dağılımı</div>
              <div className="ap-rating-summary">
                <div className="ap-rating-big">
                  <div className="ap-rating-num-big">{profile.avg_rating?.toFixed(1) ?? '—'}</div>
                  <Stars rating={profile.avg_rating ?? 0} size={20} />
                  <div className="ap-rating-total">{totalReviews} değerlendirme</div>
                </div>
                <div className="ap-rating-bars">
                  {[5, 4, 3, 2, 1].map(s => (
                    <RatingBar key={s} star={s} count={rating_dist[s] ?? 0} total={totalReviews} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ap-right">

          {/* ── Menü ── */}
          <div className="ap-card" id="menu">
            <div className="ap-card-title">
              Bugünkü Menü
              <span className="ap-menu-count">{menu_items.length} yemek</span>
            </div>

            {/* Kategori filtresi */}
            {cats.length > 1 && (
              <div className="ap-cat-filter">
                <button
                  className={`ap-cat-chip ${activeCategory === 'all' ? 'ap-cat-chip--active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                  type="button"
                >
                  Tümü
                </button>
                {cats.map(key => {
                  const meta = CATEGORY_META[key]
                  return (
                    <button
                      key={key}
                      className={`ap-cat-chip ${activeCategory === key ? 'ap-cat-chip--active' : ''}`}
                      onClick={() => setActiveCategory(key)}
                      type="button"
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  )
                })}
              </div>
            )}

            {filteredMenu.length === 0 ? (
              <div className="ap-menu-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
                <div>Bu kategoride yemek yok.</div>
              </div>
            ) : (
              <div className="ap-menu-grid">
                {filteredMenu.map(item => (
                  <MenuItemCard key={item.id} item={item} chefId={profile.id} chefName={profile.users?.full_name ?? ''} />
                ))}
              </div>
            )}
          </div>

          {/* ── Yorumlar ── */}
          <div className="ap-card">
            <div className="ap-card-title">
              Müşteri Yorumları
              <span className="ap-menu-count">{review_count} yorum</span>
            </div>

            {reviews.length === 0 ? (
              <div className="ap-reviews-empty">
                Henüz yorum yok. İlk siparişi veren siz olun!
              </div>
            ) : (
              <>
                <div className="ap-reviews-list">
                  {reviews.map(r => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>

                {/* Sayfalama */}
                {review_pages > 1 && (
                  <div className="ap-pagination">
                    <button
                      className="ap-page-btn"
                      onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      type="button"
                    >
                      ‹ Önceki
                    </button>
                    <span className="ap-page-info">
                      {reviewPage} / {review_pages}
                    </span>
                    <button
                      className="ap-page-btn"
                      onClick={() => setReviewPage(p => Math.min(review_pages, p + 1))}
                      disabled={reviewPage === review_pages}
                      type="button"
                    >
                      Sonraki ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky sipariş butonu (mobil) ── */}
      <div className="ap-sticky-order">
        <div className="ap-sticky-info">
          <div className="ap-sticky-name">{user.full_name}</div>
          <div className="ap-sticky-sub">
            {isOpen ? '🟢 Açık' : '🔴 Kapalı'} · {menu_items.length} yemek
          </div>
        </div>
        <a href="#menu" className="ap-sticky-btn">
          Sipariş Ver →
        </a>
      </div>

      <style>{`
        /* ── Sayfa ─────────────────────────── */
        .ap-page {
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 80px;
        }

        /* ── Yükleniyor / Hata ─────────────── */
        .ap-loading, .ap-error {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 60vh; gap: 14px;
          font-size: 14px; color: var(--gray);
          text-align: center; padding: 24px;
        }

        .ap-spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .ap-back-btn {
          padding: 10px 20px; background: var(--orange); color: white;
          border-radius: 10px; text-decoration: none; font-weight: 700;
          font-size: 13px;
        }

        /* ── Üst çubuk ─────────────────────── */
        .ap-topbar {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }

        .ap-back {
          font-size: 13.5px; font-weight: 700;
          color: var(--brown); text-decoration: none;
          padding: 8px 14px; background: var(--warm);
          border-radius: 10px; border: 1.5px solid var(--gray-light);
          transition: all 0.15s;
        }

        .ap-back:hover { border-color: var(--orange); color: var(--orange); }

        .ap-topbar-actions { display: flex; gap: 8px; }

        .ap-fav-btn {
          padding: 8px 16px;
          background: var(--white); color: var(--gray);
          border: 1.5px solid var(--gray-light);
          border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }

        .ap-fav-btn--active {
          background: #FFF0F3; color: #E11D48;
          border-color: #FECDD3;
        }

        .ap-fav-btn:hover:not(:disabled) { border-color: #E11D48; }
        .ap-fav-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Galeri ────────────────────────── */
        .ap-gallery { padding: 0 24px 20px; }

        .pg-empty {
          height: 220px; background: linear-gradient(135deg, var(--warm), var(--gray-light));
          border-radius: 16px; display: flex; align-items: center; justify-content: center;
        }

        .pg-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 4px; height: 220px;
          border-radius: 16px; overflow: hidden;
        }

        .pg-main { cursor: pointer; overflow: hidden; }

        .pg-thumbs {
          display: grid; grid-template-rows: repeat(2, 1fr); gap: 4px;
        }

        .pg-thumb { position: relative; overflow: hidden; cursor: pointer; }

        .pg-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.3s;
        }

        .pg-main:hover .pg-img,
        .pg-thumb:hover .pg-img { transform: scale(1.04); }

        .pg-more {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 18px; font-weight: 800;
        }

        /* Lightbox */
        .pg-lightbox {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
        }

        .pg-lb-img {
          max-width: 90vw; max-height: 85vh;
          border-radius: 8px; object-fit: contain;
        }

        .pg-lb-close {
          position: absolute; top: 20px; right: 20px;
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.15); border: none;
          border-radius: 50%; color: white; font-size: 22px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }

        .pg-lb-prev, .pg-lb-next {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 48px; height: 48px;
          background: rgba(255,255,255,0.15); border: none;
          border-radius: 50%; color: white; font-size: 28px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }

        .pg-lb-prev { left: 20px; }
        .pg-lb-next { right: 20px; }
        .pg-lb-prev:hover, .pg-lb-next:hover { background: rgba(255,255,255,0.3); }

        .pg-lb-counter {
          position: absolute; bottom: 20px; left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.7); font-size: 13px;
        }

        /* ── İki sütunlu gövde ─────────────── */
        .ap-body {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          padding: 0 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .ap-body { grid-template-columns: 1fr; }
          .ap-sticky-order { display: flex; }
        }

        .ap-left, .ap-right {
          display: flex; flex-direction: column; gap: 16px;
        }

        /* ── Kart ──────────────────────────── */
        .ap-card {
          background: var(--white);
          border-radius: 16px; padding: 20px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(232,224,212,0.6);
        }

        .ap-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700;
          color: var(--brown); margin-bottom: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .ap-menu-count {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: var(--gray); font-weight: 600;
        }

        /* ── Profil kartı ──────────────────── */
        .ap-profile-top {
          display: flex; gap: 16px; align-items: flex-start;
          margin-bottom: 14px; flex-wrap: wrap;
        }

        .ap-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #FDE68A, #F59E0B);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
          font-size: 26px; font-weight: 800; color: #78350F;
          border: 3px solid var(--warm);
        }

        .ap-avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .ap-profile-info { flex: 1; }

        .ap-chef-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 900; color: var(--brown);
          margin-bottom: 6px;
        }

        .ap-rating-row {
          display: flex; align-items: center; gap: 6px; margin-top: 6px;
        }

        .ap-rating-num   { font-size: 14px; font-weight: 700; color: var(--brown); }
        .ap-rating-count { font-size: 12px; color: var(--gray); }

        .ap-status {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
          flex-shrink: 0;
        }

        .ap-status--open   { background: #ECFDF5; color: var(--green); }
        .ap-status--closed { background: var(--gray-light); color: var(--gray); }

        .ap-status-dot {
          width: 8px; height: 8px; border-radius: 50%;
        }

        .ap-status--open   .ap-status-dot { background: var(--green); animation: pulse 2s infinite; }
        .ap-status--closed .ap-status-dot { background: var(--gray); }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .ap-bio {
          font-size: 13px; color: var(--gray); line-height: 1.7;
          margin-bottom: 14px;
        }

        .ap-divider { border: none; border-top: 1px solid var(--gray-light); margin: 14px 0; }

        /* Meta grid */
        .ap-meta-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          margin-bottom: 16px;
        }

        .ap-meta-item {
          display: flex; align-items: flex-start; gap: 8px;
        }

        .ap-meta-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .ap-meta-label { font-size: 10px; color: var(--gray); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .ap-meta-value { font-size: 13px; font-weight: 700; color: var(--brown); margin-top: 2px; }

        /* Harita */
        .ap-map-placeholder {
          background: linear-gradient(135deg, #E8F4E8, #D4EDD4);
          border-radius: 12px; height: 140px;
          display: flex; align-items: center; justify-content: center;
          border: 2px dashed var(--green-light);
          overflow: hidden;
        }

        .ap-map-inner { text-align: center; }
        .ap-map-inner > :first-child { font-size: 36px; display: block; margin-bottom: 6px; }
        .ap-map-label { font-size: 10px; color: var(--green); font-weight: 700; }

        /* ── Puan dağılımı ─────────────────── */
        .ap-rating-summary {
          display: flex; gap: 20px; align-items: center;
        }

        .ap-rating-big {
          text-align: center; flex-shrink: 0;
        }

        .ap-rating-num-big {
          font-family: 'Playfair Display', serif;
          font-size: 40px; font-weight: 900; color: var(--brown); line-height: 1;
          margin-bottom: 4px;
        }

        .ap-rating-total {
          font-size: 11px; color: var(--gray); margin-top: 4px;
        }

        .ap-rating-bars { flex: 1; display: flex; flex-direction: column; gap: 4px; }

        .rb-row { display: flex; align-items: center; gap: 6px; }
        .rb-star { font-size: 11px; color: var(--gray); width: 16px; text-align: right; }
        .rb-track { flex: 1; height: 6px; background: var(--gray-light); border-radius: 3px; overflow: hidden; }
        .rb-fill { height: 100%; background: #F59E0B; border-radius: 3px; transition: width 0.5s; }
        .rb-count { font-size: 11px; color: var(--gray); width: 20px; }

        /* ── Kategori filtresi ──────────────── */
        .ap-cat-filter {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
        }

        .ap-cat-chip {
          padding: 5px 12px; border-radius: 20px;
          border: 1.5px solid var(--gray-light);
          font-size: 12px; font-weight: 600; cursor: pointer;
          background: var(--white); color: var(--gray);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }

        .ap-cat-chip:hover { border-color: var(--orange); color: var(--orange); }
        .ap-cat-chip--active { background: var(--orange); color: white; border-color: var(--orange); }

        /* ── Menü grid ─────────────────────── */
        .ap-menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }

        @media (max-width: 767px) {
          .ap-menu-grid { grid-template-columns: 1fr; }
        }

        .ap-menu-empty, .ap-reviews-empty {
          text-align: center; padding: 32px 16px;
          font-size: 13px; color: var(--gray);
        }

        /* ── Menü öğe kartı ────────────────── */
        .mic-card {
          background: var(--white);
          border-radius: 12px; overflow: hidden;
          border: 1.5px solid var(--gray-light);
          display: flex; flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .mic-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
        .mic-card--out  { opacity: 0.65; }

        .mic-img {
          height: 110px;
          background: linear-gradient(135deg, var(--warm), var(--gray-light));
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }

        .mic-photo { width: 100%; height: 100%; object-fit: cover; }
        .mic-emoji { font-size: 40px; }

        .mic-out-badge {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 12px; font-weight: 800;
          letter-spacing: 0.5px;
        }

        .mic-body { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 6px; }

        .mic-name { font-weight: 700; font-size: 13.5px; color: var(--brown); line-height: 1.3; }

        .mic-desc {
          font-size: 11.5px; color: var(--gray); line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        .mic-allergens { display: flex; gap: 3px; flex-wrap: wrap; }
        .mic-allergen {
          font-size: 13px; cursor: help;
          opacity: 0.8;
        }

        .mic-footer {
          display: flex; align-items: center;
          justify-content: space-between; gap: 6px; margin-top: auto;
        }

        .mic-meta { display: flex; flex-direction: column; gap: 1px; }
        .mic-price { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--orange); }
        .mic-prep  { font-size: 11px; color: var(--gray); }

        .mic-add-btn {
          padding: 7px 14px;
          background: var(--orange); color: white;
          border: none; border-radius: 8px; cursor: pointer;
          font-size: 12.5px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .mic-add-btn:hover:not(:disabled) { background: #d4541e; }
        .mic-add-btn--in-cart { background: var(--green); }
        .mic-add-btn--added   { background: var(--green); transform: scale(1.08); }

        .mic-stock-warn {
          font-size: 10.5px; color: var(--orange); font-weight: 700;
        }

        /* ── Yorum kartı ───────────────────── */
        .ap-reviews-list { display: flex; flex-direction: column; gap: 12px; }

        .rc-card {
          padding: 14px; border: 1px solid var(--gray-light);
          border-radius: 12px;
          transition: border-color 0.15s;
        }

        .rc-card:hover { border-color: var(--orange-light); }

        .rc-header {
          display: flex; gap: 10px; align-items: flex-start;
          margin-bottom: 8px;
        }

        .rc-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--warm);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: var(--brown-mid);
          flex-shrink: 0; overflow: hidden;
        }

        .rc-avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .rc-meta { flex: 1; }
        .rc-name { font-weight: 700; font-size: 13px; color: var(--brown); }
        .rc-date { font-size: 11px; color: var(--gray); margin-top: 1px; }

        .rc-comment {
          font-size: 13px; color: var(--gray); line-height: 1.6;
          font-style: italic;
        }

        .rc-reply {
          margin-top: 10px; padding: 10px 12px;
          background: var(--warm); border-radius: 8px;
          border-left: 3px solid var(--orange);
        }

        .rc-reply-label { font-size: 11px; font-weight: 700; color: var(--orange); margin-bottom: 4px; }
        .rc-reply-text  { font-size: 12.5px; color: var(--brown); line-height: 1.6; }

        /* ── Sayfalama ──────────────────────── */
        .ap-pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; margin-top: 16px; padding-top: 16px;
          border-top: 1px solid var(--gray-light);
        }

        .ap-page-btn {
          padding: 7px 14px;
          background: var(--warm); border: 1.5px solid var(--gray-light);
          border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown); transition: all 0.15s;
        }

        .ap-page-btn:hover:not(:disabled) { border-color: var(--orange); color: var(--orange); }
        .ap-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ap-page-info { font-size: 13px; color: var(--gray); font-weight: 600; }

        /* ── Sticky order bar (mobil) ───────── */
        .ap-sticky-order {
          display: none;
          position: fixed;
          bottom: calc(56px + env(safe-area-inset-bottom, 0px));
          left: 12px; right: 12px;
          background: var(--white);
          border-radius: 16px; padding: 12px 16px;
          box-shadow: 0 8px 32px rgba(74,44,14,0.18);
          border: 1px solid var(--gray-light);
          align-items: center; justify-content: space-between;
          gap: 12px;
          z-index: 100;
        }

        .ap-sticky-name { font-weight: 700; font-size: 14px; color: var(--brown); }
        .ap-sticky-sub  { font-size: 11.5px; color: var(--gray); margin-top: 2px; }

        .ap-sticky-btn {
          padding: 10px 18px;
          background: var(--orange); color: white;
          border-radius: 10px; text-decoration: none;
          font-size: 13.5px; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
          transition: background 0.15s;
        }

        .ap-sticky-btn:hover { background: #d4541e; }

        .stars-wrap { display: inline-flex; gap: 1px; }
      `}</style>
    </div>
  )
}