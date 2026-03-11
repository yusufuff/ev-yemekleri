// @ts-nocheck
'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types/dashboard'

interface ActiveOrdersProps {
  orders:   DashboardOrder[]
  onAction: (orderId: string, action: string) => Promise<{ success: boolean; error?: string }>
}

// Durum → progress adımı eşlemesi
const STATUS_STEP: Record<string, number> = {
  confirmed:  0,
  preparing:  1,
  ready:      2,
  on_way:     3,
}

const STEPS = [
  { key: 'confirmed',  label: 'Onaylandı',   icon: '✓' },
  { key: 'preparing',  label: 'Hazırlanıyor', icon: '👩‍🍳' },
  { key: 'ready',      label: 'Hazır',        icon: '✅' },
  { key: 'on_way',     label: 'Yolda',        icon: '🛵' },
  { key: 'delivered',  label: 'Teslim',       icon: '🏠' },
]

// Sonraki aksiyon butonu
const NEXT_ACTION: Record<string, { action: string; label: string; icon: string }> = {
  confirmed:  { action: 'prepare',  label: 'Hazırlamaya Başla', icon: '👩‍🍳' },
  preparing:  { action: 'ready',    label: 'Hazır',             icon: '✅' },
  ready:      { action: 'dispatch', label: 'Yola Çıktım',       icon: '🛵' },
  on_way:     { action: 'deliver',  label: 'Teslim Edildi',     icon: '🏠' },
}

function OrderProgressCard({
  order,
  onAction,
}: {
  order:    DashboardOrder
  onAction: ActiveOrdersProps['onAction']
}) {
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const currentStep = STATUS_STEP[order.status] ?? 0
  const nextAction  = NEXT_ACTION[order.status]

  async function handleNext() {
    if (!nextAction || loading) return
    setLoading(true)
    setErr('')
    const res = await onAction(order.id, nextAction.action)
    if (!res.success) setErr(res.error ?? 'Hata')
    setLoading(false)
  }

  const deliveryLabel = order.delivery_type === 'pickup'
    ? '🚶 Gel-Al · Müşteri gelecek'
    : `🛵 Teslimat · ${order.buyer_district ?? ''}`

  return (
    <div className="active-card">
      {/* Başlık */}
      <div className="active-top">
        <div>
          <div className="active-order-num">{order.order_number}</div>
          <div className="active-items">{order.items_summary}</div>
          <div className="active-buyer">{order.buyer_name} · {deliveryLabel}</div>
        </div>
        <div className="active-amount">₺{order.total_amount}</div>
      </div>

      {/* Progress stepper */}
      <div className="progress-stepper" role="list" aria-label="Sipariş durumu">
        {STEPS.map((step, idx) => {
          const isDone    = idx < currentStep
          const isCurrent = idx === currentStep
          const isPending = idx > currentStep

          return (
            <div
              key={step.key}
              className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Bağlantı çizgisi */}
              {idx > 0 && (
                <div className={`step-line ${isDone || isCurrent ? 'step-line-filled' : ''}`} />
              )}

              {/* Dot */}
              <div className="step-dot">
                {isDone    && <span>✓</span>}
                {isCurrent && <span>{step.icon}</span>}
                {isPending && <span style={{ opacity: 0 }}>·</span>}
              </div>

              <div className="step-label">{step.label}</div>
            </div>
          )
        })}
      </div>

      {/* Hata */}
      {err && (
        <div className="active-error">⚠️ {err}</div>
      )}

      {/* Aksiyon butonları */}
      {nextAction && (
        <div className="active-actions">
          <button
            className="next-btn"
            onClick={handleNext}
            disabled={loading}
          >
            {loading
              ? <><span className="btn-spinner" /> Güncelleniyor…</>
              : <>{nextAction.icon} {nextAction.label}</>}
          </button>
          <button
            className="msg-btn"
            aria-label="Alıcıya mesaj gönder"
            title="Mesaj gönder"
          >
            💬
          </button>
        </div>
      )}

      {order.status === 'on_way' && (
        <div className="on-way-tip">
          📍 Teslimat tamamlandığında "Teslim Edildi" butonuna basın
        </div>
      )}

      <style>{`
        .active-card {
          background: var(--white);
          border-radius: 12px;
          padding: 16px;
          border: 1.5px solid rgba(61,107,71,0.25);
          border-left: 4px solid var(--green);
          box-shadow: 0 2px 12px rgba(61,107,71,0.08);
          margin-bottom: 10px;
        }

        .active-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .active-order-num {
          font-size: 10.5px;
          color: var(--gray);
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .active-items {
          font-size: 14px;
          font-weight: 700;
          color: var(--brown);
          margin-bottom: 3px;
        }

        .active-buyer {
          font-size: 11.5px;
          color: var(--gray);
        }

        .active-amount {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--green);
        }

        /* ── Progress stepper ─────────────────────── */
        .progress-stepper {
          display: flex;
          align-items: flex-start;
          margin-bottom: 14px;
          position: relative;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .step-line {
          position: absolute;
          top: 14px;
          left: -50%;
          right: 50%;
          height: 2px;
          background: var(--gray-light);
          z-index: 0;
        }

        .step-line-filled { background: var(--green); }

        .step-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          position: relative;
          z-index: 1;
          border: 2px solid var(--gray-light);
          background: var(--white);
          color: var(--gray);
          transition: all 0.2s;
        }

        .step-item.done .step-dot {
          background: var(--green);
          border-color: var(--green);
          color: white;
        }

        .step-item.current .step-dot {
          background: var(--orange);
          border-color: var(--orange);
          color: white;
          box-shadow: 0 0 0 4px rgba(232,98,42,0.2);
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 4px rgba(232,98,42,0.2); }
          50%       { box-shadow: 0 0 0 8px rgba(232,98,42,0.08); }
        }

        .step-label {
          font-size: 10px;
          margin-top: 5px;
          color: var(--gray);
          text-align: center;
          line-height: 1.2;
        }

        .step-item.done .step-label,
        .step-item.current .step-label {
          color: var(--brown);
          font-weight: 700;
        }

        /* ── Aksiyonlar ───────────────────────────── */
        .active-error {
          font-size: 12px;
          color: #DC2626;
          background: #FEF2F2;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .active-actions {
          display: flex;
          gap: 8px;
        }

        .next-btn {
          flex: 1;
          padding: 10px 16px;
          background: var(--orange);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .next-btn:hover:not(:disabled) {
          background: #d4541e;
          transform: translateY(-1px);
        }

        .next-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .msg-btn {
          width: 40px;
          height: 40px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .msg-btn:hover { border-color: var(--orange); background: #FEF3EC; }

        .on-way-tip {
          margin-top: 8px;
          font-size: 11px;
          color: var(--green);
          background: #ECFDF5;
          padding: 6px 10px;
          border-radius: 6px;
          font-weight: 600;
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

export function ActiveOrders({ orders, onAction }: ActiveOrdersProps) {
  if (orders.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--gray)',
        fontSize: 13,
        background: 'var(--warm)',
        borderRadius: 10,
        border: '1.5px dashed var(--gray-light)',
      }}>
        Aktif sipariş yok
      </div>
    )
  }

  return (
    <div>
      {orders.map(order => (
        <OrderProgressCard
          key={order.id}
          order={order}
          onAction={onAction}
        />
      ))}
    </div>
  )
}
