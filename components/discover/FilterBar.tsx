'use client'

import type { DiscoverFilters, SortBy, MenuCategory, DeliveryFilter } from '@/types/discover'

const CATEGORIES: { key: MenuCategory | 'all'; emoji: string; label: string }[] = [
  { key: 'all',     emoji: '🍽️', label: 'Tümü' },
  { key: 'main',    emoji: '🍲', label: 'Ana Yemek' },
  { key: 'soup',    emoji: '🥣', label: 'Çorba' },
  { key: 'dessert', emoji: '🍮', label: 'Tatlı' },
  { key: 'pastry',  emoji: '🥐', label: 'Börek' },
  { key: 'salad',   emoji: '🥗', label: 'Salata' },
]

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'distance', label: '📍 En Yakın' },
  { key: 'rating',   label: '⭐ En Yüksek Puan' },
  { key: 'price',    label: '💰 En Uygun' },
]

interface FilterBarProps {
  filters:       Omit<DiscoverFilters, 'lat' | 'lng'>
  onUpdate:      <K extends keyof Omit<DiscoverFilters, 'lat' | 'lng'>>(
                   key: K, value: Omit<DiscoverFilters, 'lat' | 'lng'>[K]
                 ) => void
  onReset:       () => void
  total:         number
  locationLabel: string
  isLoading:     boolean
}

// Filtre sayısı (varsayılandan farklı olanlar)
function countActiveFilters(filters: Omit<DiscoverFilters, 'lat' | 'lng'>): number {
  let n = 0
  if (filters.radius_km !== 5)         n++
  if (filters.category)                 n++
  if (filters.sort_by !== 'distance')   n++
  if (filters.delivery !== 'all')       n++
  if (filters.open_only)                n++
  return n
}

export function FilterBar({
  filters,
  onUpdate,
  onReset,
  total,
  locationLabel,
  isLoading,
}: FilterBarProps) {
  const activeCount = countActiveFilters(filters)

  return (
    <div className="fb-wrap">

      {/* Konum + sonuç sayısı */}
      <div className="fb-location-row">
        <div className="fb-location">
          <span className="fb-loc-dot" />
          <span className="fb-loc-text">{locationLabel}</span>
        </div>
        <div className="fb-count">
          {isLoading
            ? <span className="fb-loading-dots">…</span>
            : <><strong>{total}</strong> aşçı bulundu</>}
        </div>
      </div>

      {/* Filtre satırı */}
      <div className="fb-row">

        {/* Mesafe slider */}
        <div className="fb-radius">
          <span className="fb-radius-label">📍 {filters.radius_km} km</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={filters.radius_km}
            onChange={e => onUpdate('radius_km', Number(e.target.value))}
            className="fb-slider"
            aria-label="Arama mesafesi"
          />
        </div>

        <div className="fb-sep" />

        {/* Kategoriler */}
        <div className="fb-categories" role="group" aria-label="Kategori filtresi">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`fb-chip ${
                (cat.key === 'all' && !filters.category) ||
                cat.key === filters.category
                  ? 'active' : ''
              }`}
              onClick={() => onUpdate('category', cat.key === 'all' ? null : cat.key as MenuCategory)}
              aria-pressed={
                (cat.key === 'all' && !filters.category) ||
                cat.key === filters.category
              }
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <div className="fb-sep" />

        {/* Sıralama */}
        <div className="fb-sort-row" role="group" aria-label="Sıralama">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`fb-chip ${filters.sort_by === opt.key ? 'active' : ''}`}
              onClick={() => onUpdate('sort_by', opt.key)}
              aria-pressed={filters.sort_by === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="fb-sep" />

        {/* Teslimat + Açık toggle */}
        <div className="fb-toggles">
          <button
            className={`fb-chip ${filters.delivery === 'delivery' ? 'active' : ''}`}
            onClick={() => onUpdate('delivery', filters.delivery === 'delivery' ? 'all' : 'delivery')}
            aria-pressed={filters.delivery === 'delivery'}
          >
            🛵 Teslimat
          </button>
          <button
            className={`fb-chip ${filters.delivery === 'pickup' ? 'active' : ''}`}
            onClick={() => onUpdate('delivery', filters.delivery === 'pickup' ? 'all' : 'pickup')}
            aria-pressed={filters.delivery === 'pickup'}
          >
            🚶 Gel-Al
          </button>
          <button
            className={`fb-chip ${filters.open_only ? 'active' : ''}`}
            onClick={() => onUpdate('open_only', !filters.open_only)}
            aria-pressed={filters.open_only}
          >
            ✅ Şu an açık
          </button>
        </div>

        {/* Sıfırla */}
        {activeCount > 0 && (
          <button className="fb-reset" onClick={onReset} aria-label="Filtreleri sıfırla">
            ✕ Sıfırla
            <span className="fb-reset-count">{activeCount}</span>
          </button>
        )}
      </div>

      <style>{`
        .fb-wrap {
          background: var(--white);
          border-radius: 14px;
          padding: 12px 16px;
          box-shadow: 0 2px 12px rgba(74,44,14,0.06);
          border: 1px solid rgba(232,224,212,0.7);
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: sticky;
          top: 72px;
          z-index: 50;
        }

        .fb-location-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
        }

        .fb-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--green);
          font-weight: 600;
        }

        .fb-loc-dot {
          width: 7px;
          height: 7px;
          background: var(--green);
          border-radius: 50%;
          animation: pulse-loc 2s infinite;
        }

        @keyframes pulse-loc {
          0%, 100% { box-shadow: 0 0 0 0 rgba(61,107,71,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(61,107,71,0); }
        }

        .fb-loc-text { font-size: 12px; color: var(--green); }

        .fb-count {
          font-size: 12px;
          color: var(--gray);
        }

        .fb-count strong { color: var(--brown); }

        .fb-loading-dots {
          color: var(--orange);
          animation: blink 1s infinite;
          font-size: 16px;
          letter-spacing: 2px;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* ── Filtre satırı ─────────────────── */
        .fb-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .fb-row::-webkit-scrollbar { display: none; }

        /* ── Radius ────────────────────────── */
        .fb-radius {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .fb-radius-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--brown);
          white-space: nowrap;
          min-width: 52px;
        }

        .fb-slider {
          width: 80px;
          accent-color: var(--orange);
          cursor: pointer;
        }

        /* ── Sep ───────────────────────────── */
        .fb-sep {
          width: 1px;
          height: 20px;
          background: var(--gray-light);
          flex-shrink: 0;
        }

        /* ── Groups ────────────────────────── */
        .fb-categories,
        .fb-sort-row,
        .fb-toggles {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }

        /* ── Chip ──────────────────────────── */
        .fb-chip {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1.5px solid var(--gray-light);
          background: var(--white);
          color: var(--gray);
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .fb-chip:hover {
          border-color: var(--orange);
          color: var(--orange);
        }

        .fb-chip.active {
          background: var(--orange);
          border-color: var(--orange);
          color: white;
        }

        /* ── Reset ─────────────────────────── */
        .fb-reset {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1.5px solid #FECACA;
          background: #FEF2F2;
          color: #DC2626;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .fb-reset:hover { background: #FEE2E2; }

        .fb-reset-count {
          background: #DC2626;
          color: white;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          font-size: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}
