'use client'

import { useState } from 'react'
import { CATEGORY_META, ALLERGEN_META, type MenuItem } from '@/types/menu'

interface MenuCardProps {
  item:          MenuItem
  onEdit:        (item: MenuItem) => void
  onDelete:      (id: string) => void
  onToggle:      (id: string) => void
  onStockUpdate: (id: string, stock: number) => void
}

export function MenuCard({
  item,
  onEdit,
  onDelete,
  onToggle,
  onStockUpdate,
}: MenuCardProps) {
  const [stockInput,    setStockInput]    = useState(String(item.remaining_stock ?? 0))
  const [editingStock,  setEditingStock]  = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat       = CATEGORY_META[item.category]
  const remaining = item.remaining_stock ?? 0
  const daily     = item.daily_stock     ?? 1
  const pct       = daily > 0 ? Math.round((remaining / daily) * 100) : 0

  const stockColor =
    pct === 0   ? '#DC2626' :
    pct <= 25   ? 'var(--orange)' :
    'var(--green)'

  const coverPhoto = item.photos?.[0]

  // ── Stok kaydet ──────────────────────────────────────────────────────────

  const saveStock = () => {
    const val = parseInt(stockInput)
    if (!isNaN(val) && val >= 0 && val <= daily) {
      onStockUpdate(item.id, val)
    } else {
      setStockInput(String(remaining))
    }
    setEditingStock(false)
  }

  return (
    <div className={`mc-card ${!item.is_active ? 'mc-card--inactive' : ''}`}>

      {/* ── Görsel ── */}
      <div className="mc-img">
        {coverPhoto
          ? <img src={coverPhoto} alt={item.name} className="mc-photo" />
          : <span className="mc-emoji">{cat?.emoji ?? '🍽️'}</span>
        }

        {/* Aktif/pasif rozeti */}
        <div className={`mc-status-badge ${item.is_active ? 'mc-status-badge--active' : ''}`}>
          {item.is_active ? 'AKTİF' : 'GİZLİ'}
        </div>

        {/* Kategori rozeti */}
        <div className="mc-cat-badge">{cat?.emoji} {cat?.label}</div>
      </div>

      {/* ── Gövde ── */}
      <div className="mc-body">
        <div className="mc-name">{item.name}</div>

        {item.description && (
          <div className="mc-desc">{item.description}</div>
        )}

        {/* Fiyat + süre */}
        <div className="mc-meta-row">
          <div className="mc-price">₺{item.price.toFixed(0)}</div>
          {item.prep_time_min && (
            <div className="mc-prep">⏱️ {item.prep_time_min} dk</div>
          )}
        </div>

        {/* Alerjenler */}
        {item.allergens?.length > 0 && (
          <div className="mc-allergens">
            {item.allergens.map(a => (
              <span key={a} className="mc-allergen">
                {ALLERGEN_META[a]?.emoji} {ALLERGEN_META[a]?.label}
              </span>
            ))}
          </div>
        )}

        {/* Stok durumu */}
        <div className="mc-stock-section">
          <div className="mc-stock-label-row">
            <span className="mc-stock-label">Günlük Stok</span>
            {editingStock ? (
              <div className="mc-stock-edit">
                <input
                  className="mc-stock-input"
                  type="number"
                  value={stockInput}
                  min={0}
                  max={daily}
                  onChange={e => setStockInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveStock(); if (e.key === 'Escape') setEditingStock(false) }}
                  autoFocus
                  aria-label="Kalan stok"
                />
                <button className="mc-stock-save" onClick={saveStock} type="button">✓</button>
                <button className="mc-stock-cancel" onClick={() => { setStockInput(String(remaining)); setEditingStock(false) }} type="button">✕</button>
              </div>
            ) : (
              <button
                className="mc-stock-value"
                style={{ color: stockColor }}
                onClick={() => setEditingStock(true)}
                type="button"
                title="Stoku düzenle"
              >
                {remaining}/{daily} ✏️
              </button>
            )}
          </div>
          <div className="mc-stock-bar">
            <div
              className="mc-stock-fill"
              style={{ width: `${pct}%`, background: stockColor }}
              role="progressbar"
              aria-valuenow={remaining}
              aria-valuemin={0}
              aria-valuemax={daily}
            />
          </div>
          {pct === 0 && (
            <div className="mc-stock-warn">⚠️ Stok tükendi — Alıcılar sipariş veremiyor</div>
          )}
        </div>
      </div>

      {/* ── Aksiyon butonları ── */}
      <div className="mc-actions">
        {/* Aktif toggle */}
        <button
          className={`mc-toggle ${item.is_active ? 'mc-toggle--on' : ''}`}
          onClick={() => onToggle(item.id)}
          type="button"
          title={item.is_active ? 'Gizle' : 'Aktif Et'}
          role="switch"
          aria-checked={item.is_active}
        />

        <button
          className="mc-btn mc-btn--edit"
          onClick={() => onEdit(item)}
          type="button"
        >
          ✏️ Düzenle
        </button>

        {confirmDelete ? (
          <div className="mc-confirm">
            <span className="mc-confirm-text">Emin misiniz?</span>
            <button
              className="mc-btn mc-btn--danger"
              onClick={() => { onDelete(item.id); setConfirmDelete(false) }}
              type="button"
            >
              Sil
            </button>
            <button
              className="mc-btn mc-btn--cancel"
              onClick={() => setConfirmDelete(false)}
              type="button"
            >
              Hayır
            </button>
          </div>
        ) : (
          <button
            className="mc-btn mc-btn--delete"
            onClick={() => setConfirmDelete(true)}
            type="button"
            title="Yemeği sil"
          >
            🗑️
          </button>
        )}
      </div>

      <style>{`
        /* ── Kart ─────────────────────── */
        .mc-card {
          background: var(--white);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          border: 1px solid rgba(232,224,212,0.5);
          display: flex; flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .mc-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
        .mc-card--inactive { opacity: 0.65; }

        /* ── Görsel ───────────────────── */
        .mc-img {
          height: 150px;
          background: linear-gradient(135deg, var(--warm), var(--gray-light));
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; flex-shrink: 0;
        }

        .mc-photo {
          width: 100%; height: 100%; object-fit: cover;
        }

        .mc-emoji { font-size: 56px; }

        .mc-status-badge {
          position: absolute; top: 8px; left: 8px;
          background: var(--gray);
          color: white; font-size: 9px; font-weight: 800;
          padding: 3px 8px; border-radius: 6px;
          letter-spacing: 0.5px;
        }

        .mc-status-badge--active { background: var(--green); }

        .mc-cat-badge {
          position: absolute; bottom: 8px; right: 8px;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
          color: white; font-size: 10px; font-weight: 600;
          padding: 3px 8px; border-radius: 6px;
        }

        /* ── Gövde ────────────────────── */
        .mc-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 8px; }

        .mc-name {
          font-weight: 700; font-size: 14.5px;
          color: var(--brown); line-height: 1.3;
        }

        .mc-desc {
          font-size: 12px; color: var(--gray); line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        .mc-meta-row {
          display: flex; align-items: center; justify-content: space-between;
        }

        .mc-price {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: var(--orange);
        }

        .mc-prep { font-size: 11.5px; color: var(--gray); }

        /* Alerjenler */
        .mc-allergens { display: flex; flex-wrap: wrap; gap: 4px; }
        .mc-allergen {
          font-size: 10px; padding: 2px 7px;
          background: #FEF2F2; color: #B91C1C;
          border-radius: 10px; font-weight: 600;
        }

        /* Stok */
        .mc-stock-section { display: flex; flex-direction: column; gap: 5px; margin-top: 2px; }

        .mc-stock-label-row {
          display: flex; align-items: center; justify-content: space-between;
        }

        .mc-stock-label { font-size: 11px; color: var(--gray); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }

        .mc-stock-value {
          font-size: 12px; font-weight: 700;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; padding: 0;
        }

        .mc-stock-edit { display: flex; gap: 4px; align-items: center; }
        .mc-stock-input {
          width: 60px; padding: 3px 6px;
          border: 1.5px solid var(--orange); border-radius: 6px;
          font-size: 12px; font-weight: 700; text-align: center;
          font-family: 'DM Sans', sans-serif; color: var(--brown);
        }
        .mc-stock-save, .mc-stock-cancel {
          width: 22px; height: 22px;
          border-radius: 6px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; display: flex;
          align-items: center; justify-content: center;
        }
        .mc-stock-save   { background: var(--green);   color: white; }
        .mc-stock-cancel { background: var(--gray-light); color: var(--gray); }

        .mc-stock-bar { height: 5px; background: var(--gray-light); border-radius: 3px; overflow: hidden; }
        .mc-stock-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }

        .mc-stock-warn { font-size: 10.5px; color: #DC2626; font-weight: 600; }

        /* ── Aksiyonlar ───────────────── */
        .mc-actions {
          display: flex; gap: 6px; align-items: center;
          padding: 10px 14px; border-top: 1px solid var(--gray-light);
          background: var(--cream);
        }

        .mc-toggle {
          width: 38px; height: 20px;
          background: var(--gray-light);
          border-radius: 10px; position: relative;
          cursor: pointer; transition: background 0.2s;
          border: none; flex-shrink: 0;
        }

        .mc-toggle--on { background: var(--green); }

        .mc-toggle::after {
          content: '';
          width: 14px; height: 14px;
          background: white; border-radius: 50%;
          position: absolute; top: 3px; left: 3px;
          transition: left 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .mc-toggle--on::after { left: 21px; }

        .mc-btn {
          padding: 6px 10px; border-radius: 8px; font-size: 12px;
          font-weight: 700; cursor: pointer; border: none;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }

        .mc-btn--edit   { background: var(--warm);     color: var(--brown-mid); border: 1.5px solid var(--gray-light); flex: 1; }
        .mc-btn--edit:hover { border-color: var(--orange); color: var(--orange); }
        .mc-btn--delete { background: var(--warm);     color: var(--gray);      border: 1.5px solid var(--gray-light); padding: 6px 8px; }
        .mc-btn--delete:hover { background: #FEF2F2; border-color: #DC2626; color: #DC2626; }
        .mc-btn--danger { background: #DC2626; color: white; }
        .mc-btn--cancel { background: var(--gray-light); color: var(--gray); }

        .mc-confirm {
          display: flex; align-items: center; gap: 5px; flex: 1;
        }

        .mc-confirm-text {
          font-size: 11px; color: #DC2626; font-weight: 700; white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
