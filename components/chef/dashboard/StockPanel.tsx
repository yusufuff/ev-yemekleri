'use client'

import { useState } from 'react'
import type { StockItem } from '@/types/dashboard'

interface StockPanelProps {
  items: StockItem[]
  onRefresh: () => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  main:    '🍲',
  soup:    '🥣',
  dessert: '🍮',
  pastry:  '🥐',
  salad:   '🥗',
}

function StockBar({ remaining, daily }: { remaining: number | null; daily: number | null }) {
  if (daily === null || daily === 0) return null

  const r   = remaining ?? 0
  const pct = Math.max((r / daily) * 100, 0)

  const color = pct === 0
    ? '#DC2626'
    : pct < 25
      ? 'var(--orange)'
      : 'var(--green)'

  return (
    <div className="stock-bar-wrap">
      <div
        className="stock-bar-fill"
        style={{ width: `${pct}%`, background: color }}
        role="progressbar"
        aria-valuenow={r}
        aria-valuemax={daily}
        aria-valuemin={0}
        aria-label={`${r} / ${daily} porsiyon`}
      />
      <style>{`
        .stock-bar-wrap {
          height: 4px;
          background: var(--gray-light);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 5px;
        }
        .stock-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
      `}</style>
    </div>
  )
}

// Satır içi stok güncelleme formu
function InlineStockEdit({
  item,
  onClose,
}: {
  item:    StockItem
  onClose: () => void
}) {
  const [value,   setValue]   = useState(String(item.remaining_stock ?? item.daily_stock ?? 0))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function save() {
    const num = parseInt(value)
    if (isNaN(num) || num < 0) {
      setError('Geçerli bir sayı girin')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/chef/menu/${item.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remaining_stock: num }),
      })
      if (res.ok) {
        onClose()
      } else {
        setError('Kayıt başarısız')
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stock-edit">
      <input
        type="number"
        min={0}
        max={item.daily_stock ?? 999}
        value={value}
        onChange={e => { setValue(e.target.value); setError('') }}
        className="stock-edit-input"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
        aria-label="Stok miktarı"
      />
      {error && <span className="stock-edit-error">{error}</span>}
      <button
        className="stock-save-btn"
        onClick={save}
        disabled={loading}
        aria-label="Kaydet"
      >
        {loading ? '⏳' : '✓'}
      </button>
      <button
        className="stock-cancel-btn"
        onClick={onClose}
        aria-label="İptal"
      >
        ✕
      </button>
      <style>{`
        .stock-edit {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .stock-edit-input {
          width: 60px;
          padding: 4px 8px;
          border: 2px solid var(--orange);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown);
          outline: none;
        }
        .stock-edit-error {
          font-size: 10.5px;
          color: #DC2626;
        }
        .stock-save-btn, .stock-cancel-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: none;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }
        .stock-save-btn  { background: var(--green); color: white; }
        .stock-cancel-btn{ background: var(--gray-light); color: var(--gray); }
        .stock-save-btn:disabled { opacity: 0.6; }
      `}</style>
    </div>
  )
}

export function StockPanel({ items, onRefresh }: StockPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const activeItems   = items.filter(i => i.is_active)
  const inactiveItems = items.filter(i => !i.is_active)

  function getStockStatus(item: StockItem) {
    const r = item.remaining_stock ?? 0
    const d = item.daily_stock ?? 0
    if (r === 0)        return { label: 'Tükendi',  color: '#DC2626', bg: '#FEE2E2' }
    if (d > 0 && r / d < 0.25) return { label: 'Az kaldı', color: 'var(--orange)', bg: '#FEF3EC' }
    return { label: `${r} kaldı`,  color: 'var(--green)',  bg: '#ECFDF5' }
  }

  return (
    <div className="stock-panel">
      {activeItems.length === 0 ? (
        <div className="stock-empty">
          <span>🍳</span> Aktif yemek yok —{' '}
          <a href="/menu" className="stock-add-link">Menü ekle</a>
        </div>
      ) : (
        <div className="stock-list">
          {activeItems.map(item => {
            const status  = getStockStatus(item)
            const isEdit  = editingId === item.id
            const emoji   = CATEGORY_EMOJI[item.category] ?? '🍽️'

            return (
              <div key={item.id} className="stock-row">
                <span className="stock-emoji">{emoji}</span>

                <div className="stock-info">
                  <div className="stock-name">{item.name}</div>
                  <StockBar remaining={item.remaining_stock} daily={item.daily_stock} />
                </div>

                {isEdit ? (
                  <InlineStockEdit
                    item={item}
                    onClose={() => { setEditingId(null); onRefresh() }}
                  />
                ) : (
                  <>
                    <div
                      className="stock-badge"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
                    </div>
                    <div className="stock-daily">/ {item.daily_stock ?? '∞'}</div>
                    <button
                      className="stock-edit-trigger"
                      onClick={() => setEditingId(item.id)}
                      aria-label={`${item.name} stok güncelle`}
                      title="Stok güncelle"
                    >
                      📦
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {inactiveItems.length > 0 && (
        <div className="inactive-note">
          + {inactiveItems.length} pasif yemek{' '}
          <a href="/menu" style={{ color: 'var(--orange)', fontWeight: 600, fontSize: 11 }}>
            Yönet →
          </a>
        </div>
      )}

      <style>{`
        .stock-panel { display: flex; flex-direction: column; gap: 8px; }

        .stock-empty {
          font-size: 13px;
          color: var(--gray);
          padding: 12px;
          background: var(--warm);
          border-radius: 8px;
          text-align: center;
        }

        .stock-add-link {
          color: var(--orange);
          font-weight: 700;
          text-decoration: none;
        }

        .stock-list { display: flex; flex-direction: column; gap: 10px; }

        .stock-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stock-emoji { font-size: 18px; flex-shrink: 0; }

        .stock-info {
          flex: 1;
          min-width: 0;
        }

        .stock-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--brown);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stock-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .stock-daily {
          font-size: 11px;
          color: var(--gray);
          flex-shrink: 0;
        }

        .stock-edit-trigger {
          width: 28px;
          height: 28px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .stock-edit-trigger:hover {
          border-color: var(--orange);
          background: #FEF3EC;
        }

        .inactive-note {
          font-size: 11.5px;
          color: var(--gray);
          padding-top: 8px;
          border-top: 1px solid var(--gray-light);
          margin-top: 2px;
        }
      `}</style>
    </div>
  )
}
