'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types/dashboard'

interface PendingOrdersProps {
  orders:            DashboardOrder[]
  onAction:          (orderId: string, action: string) => Promise<{ success: boolean; error?: string }>
}

const DELIVERY_LABEL: Record<string, string> = {
  pickup:   '🚶 Gel-Al',
  delivery: '🛵 Teslimat',
}

function AgeLabel({ minutes }: { minutes: number }) {
  const rounded = Math.round(minutes)
  const color = rounded > 15 ? '#DC2626' : rounded > 8 ? '#F59E0B' : 'var(--gray)'
  return (
    <span style={{ color, fontWeight: 700, fontSize: 11 }}>
      {rounded < 1 ? 'Az önce' : `${rounded} dk önce`}
    </span>
  )
}

export function PendingOrders({ orders, onAction }: PendingOrdersProps) {
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [errors,     setErrors]     = useState<Record<string, string>>({})

  async function handleAction(orderId: string, action: 'confirm' | 'cancel') {
    setProcessing(p => ({ ...p, [orderId]: true }))
    setErrors(e => ({ ...e, [orderId]: '' }))

    const result = await onAction(orderId, action)

    if (!result.success) {
      setErrors(e => ({ ...e, [orderId]: result.error ?? 'Hata oluştu' }))
    }

    setProcessing(p => ({ ...p, [orderId]: false }))
  }

  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <div className="empty-icon">☕</div>
        <div className="empty-text">Bekleyen sipariş yok</div>
        <div className="empty-sub">Yeni siparişler burada görünür</div>
        <style>{`
          .empty-orders {
            background: var(--warm);
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            border: 1.5px dashed var(--gray-light);
          }
          .empty-icon { font-size: 32px; margin-bottom: 8px; }
          .empty-text { font-weight: 700; color: var(--brown); font-size: 14px; margin-bottom: 4px; }
          .empty-sub  { font-size: 12px; color: var(--gray); }
        `}</style>
      </div>
    )
  }

  return (
    <div className="pending-list">
      {orders.map(order => (
        <div key={order.id} className="pending-card" data-processing={processing[order.id]}>

          {/* Üst satır */}
          <div className="pending-top">
            <div className="pending-left">
              <span className="order-num">{order.order_number}</span>
              <AgeLabel minutes={order.age_minutes} />
              <span className="delivery-badge">{DELIVERY_LABEL[order.delivery_type]}</span>
            </div>
            <div className="pending-amount">₺{order.total_amount}</div>
          </div>

          {/* İçerik */}
          <div className="pending-items">{order.items_summary}</div>

          <div className="pending-buyer">
            <span>👤 {order.buyer_name}</span>
            {order.buyer_district && <span>· {order.buyer_district}</span>}
          </div>

          {/* Not varsa */}
          {order.notes && (
            <div className="pending-note">💬 {order.notes}</div>
          )}

          {/* Hata */}
          {errors[order.id] && (
            <div className="pending-error">⚠️ {errors[order.id]}</div>
          )}

          {/* Aksiyonlar */}
          <div className="pending-actions">
            <button
              className="action-btn reject-btn"
              onClick={() => handleAction(order.id, 'cancel')}
              disabled={processing[order.id]}
              aria-label="Siparişi reddet"
            >
              ✕ Reddet
            </button>
            <button
              className="action-btn accept-btn"
              onClick={() => handleAction(order.id, 'confirm')}
              disabled={processing[order.id]}
              aria-label="Siparişi onayla"
            >
              {processing[order.id]
                ? <><span className="btn-spinner" /> İşleniyor…</>
                : '✓ Onayla'}
            </button>
          </div>
        </div>
      ))}

      <style>{`
        .pending-list { display: flex; flex-direction: column; gap: 10px; }

        .pending-card {
          background: var(--white);
          border-radius: 12px;
          padding: 14px 16px;
          border: 1.5px solid rgba(232,98,42,0.25);
          border-left: 4px solid var(--orange);
          box-shadow: 0 2px 10px rgba(232,98,42,0.08);
          transition: opacity 0.2s;
          position: relative;
          overflow: hidden;
        }

        .pending-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(232,98,42,0.02) 0%, transparent 60%);
          pointer-events: none;
        }

        .pending-card[data-processing="true"] {
          opacity: 0.6;
          pointer-events: none;
        }

        .pending-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .pending-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .order-num {
          font-size: 11px;
          font-weight: 700;
          color: var(--gray);
          letter-spacing: 0.5px;
        }

        .delivery-badge {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          background: var(--warm);
          border-radius: 20px;
          color: var(--brown-mid);
        }

        .pending-amount {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--orange);
        }

        .pending-items {
          font-size: 14px;
          font-weight: 700;
          color: var(--brown);
          margin-bottom: 4px;
        }

        .pending-buyer {
          font-size: 12px;
          color: var(--gray);
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }

        .pending-note {
          font-size: 12px;
          color: var(--brown-mid);
          background: var(--warm);
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 6px;
          border-left: 2px solid var(--orange);
        }

        .pending-error {
          font-size: 12px;
          color: #DC2626;
          background: #FEF2F2;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .pending-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .action-btn {
          flex: 1;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.15s;
        }

        .action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .reject-btn {
          background: #FEE2E2;
          color: #DC2626;
          flex: 0.55;
        }

        .reject-btn:hover:not(:disabled) { background: #FECACA; }

        .accept-btn {
          background: var(--green);
          color: white;
        }

        .accept-btn:hover:not(:disabled) {
          background: #2e5236;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(61,107,71,0.35);
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
