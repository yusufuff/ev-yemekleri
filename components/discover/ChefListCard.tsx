// @ts-nocheck
'use client'

import Link from 'next/link'
import type { NearbyChef } from '@/types/discover'

const BADGE_META: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  new:     { emoji: '🌱', label: 'Yeni Aşçı',  bg: '#F3F4F6', color: '#6B7280' },
  trusted: { emoji: '⭐', label: 'Güvenilir',  bg: '#ECFDF5', color: '#059669' },
  master:  { emoji: '🏅', label: 'Usta Eller', bg: '#FFFBEB', color: '#D97706' },
  chef:    { emoji: '👑', label: 'Ev Şefi',    bg: '#FFFBEB', color: '#B45309' },
}

const CATEGORY_EMOJI: Record<string, string> = {
  main: '🍲', soup: '🥣', dessert: '🍮', pastry: '🥐', salad: '🥗',
}

interface ChefListCardProps {
  chef:       NearbyChef
  isSelected: boolean
  onSelect:   () => void
}

export function ChefListCard({ chef, isSelected, onSelect }: ChefListCardProps) {
  const badge = BADGE_META[chef.badge ?? 'new']

  return (
    <div
      className={`chef-lc ${isSelected ? 'selected' : ''} ${!chef.is_open ? 'closed' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      aria-pressed={isSelected}
      aria-label={`${chef.full_name}, ${chef.distance_km} km uzakta`}
    >
      {/* Kapalı overlay */}
      {!chef.is_open && (
        <div className="chef-lc-closed-tag">Kapalı</div>
      )}

      {/* Üst kısım */}
      <div className="chef-lc-top">
        {/* Avatar */}
        <div className="chef-lc-avatar">
          {chef.avatar_url
            ? <img src={chef.avatar_url} alt={chef.full_name} className="chef-lc-img" />
            : <span>👩‍🍳</span>}
        </div>

        {/* Bilgi */}
        <div className="chef-lc-info">
          <div className="chef-lc-name">{chef.full_name}</div>

          <div className="chef-lc-meta">
            {chef.avg_rating && (
              <span className="chef-lc-rating">
                ⭐ {chef.avg_rating.toFixed(1)}
                <span className="chef-lc-reviews">({chef.total_reviews})</span>
              </span>
            )}
            <span className="chef-lc-dist">📍 {chef.distance_km.toFixed(1)} km</span>
          </div>

          <div className="chef-lc-delivery">
            {chef.delivery_types.includes('delivery') && (
              <span className="chef-lc-tag">🛵 Teslimat</span>
            )}
            {chef.delivery_types.includes('pickup') && (
              <span className="chef-lc-tag">🚶 Gel-Al</span>
            )}
          </div>
        </div>

        {/* Sağ — durum + min fiyat */}
        <div className="chef-lc-right">
          <div className={`chef-lc-status ${chef.is_open ? 'open' : 'closed-status'}`}>
            {chef.is_open ? <><span className="status-live" />Açık</> : 'Kapalı'}
          </div>
          {chef.min_price && (
            <div className="chef-lc-minprice">
              ₺{chef.min_price.toFixed(0)}<span>'den</span>
            </div>
          )}
        </div>
      </div>

      {/* Menü önizleme */}
      {chef.preview_items.length > 0 && (
        <div className="chef-lc-preview">
          {chef.preview_items.map(item => (
            <div key={item.id} className="chef-lc-preview-item">
              <span className="preview-emoji">
                {CATEGORY_EMOJI[item.category] ?? '🍽️'}
              </span>
              <span className="preview-name">{item.name}</span>
              <span className="preview-price">₺{item.price}</span>
              {item.stock_status === 'critical' && (
                <span className="preview-critical">Son {item.remaining_stock}!</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Badge */}
      {chef.badge && chef.badge !== 'new' && (
        <div
          className="chef-lc-badge"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.emoji} {badge.label}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="chef-lc-actions" onClick={e => e.stopPropagation()}>
        <Link href={`/asci/${chef.chef_id}`} className="chef-lc-profile-btn">
          Profili Gör →
        </Link>
        {chef.is_open && (
          <Link href={`/asci/${chef.chef_id}#menu`} className="chef-lc-order-btn">
            Sipariş Ver
          </Link>
        )}
      </div>

      <style>{`
        .chef-lc {
          background: var(--white);
          border-radius: 14px;
          padding: 14px;
          border: 1.5px solid rgba(232,224,212,0.7);
          box-shadow: 0 2px 10px rgba(74,44,14,0.06);
          cursor: pointer;
          transition: all 0.18s;
          position: relative;
          overflow: hidden;
        }

        .chef-lc:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(74,44,14,0.12);
          border-color: rgba(232,98,42,0.3);
        }

        .chef-lc.selected {
          border-color: var(--orange);
          box-shadow: 0 0 0 2px rgba(232,98,42,0.2), 0 6px 24px rgba(232,98,42,0.12);
          background: #FFFAF7;
        }

        .chef-lc.closed { opacity: 0.65; }

        .chef-lc-closed-tag {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 10px;
          font-weight: 700;
          background: var(--gray-light);
          color: var(--gray);
          padding: 2px 8px;
          border-radius: 20px;
        }

        /* ── Üst ────────────────────── */
        .chef-lc-top {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .chef-lc-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FDE68A, #F59E0B);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .chef-lc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chef-lc-info { flex: 1; min-width: 0; }

        .chef-lc-name {
          font-weight: 700;
          font-size: 14.5px;
          color: var(--brown);
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chef-lc-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 5px;
        }

        .chef-lc-rating {
          font-size: 12px;
          font-weight: 700;
          color: var(--orange);
        }

        .chef-lc-reviews {
          font-weight: 400;
          font-size: 11px;
          color: var(--gray);
          margin-left: 2px;
        }

        .chef-lc-dist {
          font-size: 11.5px;
          color: var(--gray);
        }

        .chef-lc-delivery {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .chef-lc-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          background: var(--warm);
          border-radius: 20px;
          color: var(--brown-mid);
        }

        .chef-lc-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .chef-lc-status {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .chef-lc-status.open {
          background: #ECFDF5;
          color: var(--green);
        }

        .chef-lc-status.closed-status {
          background: var(--gray-light);
          color: var(--gray);
        }

        .status-live {
          width: 6px; height: 6px;
          background: var(--green);
          border-radius: 50%;
          animation: live 2s infinite;
        }

        @keyframes live {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .chef-lc-minprice {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--orange);
        }

        .chef-lc-minprice span {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          color: var(--gray);
          font-weight: 400;
        }

        /* ── Önizleme ───────────────── */
        .chef-lc-preview {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--warm);
          border-radius: 8px;
          padding: 8px 10px;
          margin-bottom: 8px;
        }

        .chef-lc-preview-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
        }

        .preview-emoji { font-size: 14px; flex-shrink: 0; }

        .preview-name {
          flex: 1;
          color: var(--brown);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-price {
          font-weight: 700;
          color: var(--orange);
          flex-shrink: 0;
        }

        .preview-critical {
          font-size: 10px;
          font-weight: 700;
          color: #DC2626;
          background: #FEE2E2;
          padding: 1px 6px;
          border-radius: 10px;
          flex-shrink: 0;
          animation: blink-c 1s infinite;
        }

        @keyframes blink-c {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }

        /* ── Badge ──────────────────── */
        .chef-lc-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 8px;
        }

        /* ── Aksiyonlar ─────────────── */
        .chef-lc-actions {
          display: flex;
          gap: 7px;
        }

        .chef-lc-profile-btn,
        .chef-lc-order-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          transition: all 0.15s;
        }

        .chef-lc-profile-btn {
          background: var(--warm);
          color: var(--brown-mid);
          border: 1.5px solid var(--gray-light);
        }

        .chef-lc-profile-btn:hover {
          border-color: var(--orange);
          color: var(--orange);
        }

        .chef-lc-order-btn {
          background: var(--orange);
          color: white;
        }

        .chef-lc-order-btn:hover {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(232,98,42,0.35);
        }
      `}</style>
    </div>
  )
}
