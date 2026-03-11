// @ts-nocheck
'use client'

/**
 * OrderTracker
 * ─────────────
 * Realtime bağlantılı, animasyonlu sipariş takip bileşeni.
 * Hem /siparislerim sayfasında hem /siparis-basari'da kullanılabilir.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  useRealtimeOrder,
  ORDER_STEPS,
  getStepIndex,
  getETA,
} from '@/hooks/useRealtimeOrder'
import type { OrderStatus } from '@/types/database'

// ── Animasyonlu adım çubuğu ────────────────────────────────────────────────────

function StepBar({
  status,
  history,
}: {
  status:  OrderStatus
  history: { status: OrderStatus; at: Date }[]
}) {
  const currentIdx = getStepIndex(status)
  const isCancelled = status === 'cancelled'

  if (isCancelled) {
    return (
      <div className="ot-cancelled">
        ❌ Sipariş iptal edildi
      </div>
    )
  }

  return (
    <div className="ot-steps" role="list" aria-label="Sipariş adımları">
      {ORDER_STEPS.map((step, i) => {
        const isDone    = i < currentIdx
        const isCurrent = i === currentIdx
        const stepTime  = history.find(h => h.status === step.status)

        return (
          <div
            key={step.status}
            className={[
              'ot-step',
              isDone    ? 'ot-step--done'    : '',
              isCurrent ? 'ot-step--current' : '',
            ].join(' ')}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
          >
            {/* Bağlantı çizgisi */}
            {i < ORDER_STEPS.length - 1 && (
              <div className={`ot-line ${isDone ? 'ot-line--done' : ''}`} />
            )}

            {/* Nokta */}
            <div className="ot-dot" aria-hidden>
              {isDone ? '✓' : step.emoji}
            </div>

            {/* Etiket */}
            <div className="ot-step-label">{step.label}</div>

            {/* Zaman */}
            {stepTime && (
              <div className="ot-step-time">
                {stepTime.at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── ETA sayacı ────────────────────────────────────────────────────────────────

function ETABadge({ eta }: { eta: { min: number; max: number } | null }) {
  if (!eta) return null
  if (eta.max <= 0) return (
    <div className="ot-eta ot-eta--soon">
      ⚡ Çok yakında!
    </div>
  )
  return (
    <div className="ot-eta">
      <span className="ot-eta-icon">⏱️</span>
      <span className="ot-eta-text">
        Tahmini <strong>{eta.min}–{eta.max} dakika</strong>
      </span>
    </div>
  )
}

// ── Bağlantı göstergesi ───────────────────────────────────────────────────────

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className={`ot-conn ${connected ? 'ot-conn--live' : 'ot-conn--off'}`}
         title={connected ? 'Canlı izleniyor' : 'Bağlantı kesildi, yeniden bağlanıyor…'}>
      <span className="ot-conn-dot" />
      {connected ? 'Canlı' : 'Bağlanıyor…'}
    </div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

interface OrderTrackerProps {
  orderId:      string
  compact?:     boolean   // Küçük kart modu (sipariş listesinde)
  onReview?:    (orderId: string) => void
}

export function OrderTracker({ orderId, compact = false, onReview }: OrderTrackerProps) {
  const { order, loading, error, connected, lastUpdated, statusHistory, reload } =
    useRealtimeOrder(orderId)

  const prevStatusRef = useRef<OrderStatus | null>(null)
  const [justChanged, setJustChanged] = useState(false)

  // Durum değişince flash animasyonu
  useEffect(() => {
    if (!order) return
    if (prevStatusRef.current && prevStatusRef.current !== order.status) {
      setJustChanged(true)
      setTimeout(() => setJustChanged(false), 1200)
    }
    prevStatusRef.current = order.status as OrderStatus
  }, [order?.status])

  // ── Yükleniyor ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ot-loading">
        <div className="ot-spinner" />
        <span>Sipariş yükleniyor…</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="ot-error">
        <div>⚠️ {error ?? 'Sipariş bulunamadı.'}</div>
        <button className="ot-retry-btn" onClick={reload} type="button">Tekrar Dene</button>
      </div>
    )
  }

  const chef          = (order as any).chef_profiles
  const chefUser      = chef?.users
  const items         = (order as any).order_items ?? []
  const eta           = getETA(order)
  const isDelivered   = order.status === 'delivered'
  const isCancelled   = order.status === 'cancelled'
  const isActive      = !isDelivered && !isCancelled

  // ── Kompakt kart (liste görünümü) ──────────────────────────────────────────

  if (compact) {
    const step = ORDER_STEPS.find(s => s.status === order.status)
    return (
      <Link href={`/siparislerim/${orderId}`} className="ot-compact-card">
        <div className="ot-compact-left">
          <div className="ot-compact-num">#{order.order_number}</div>
          <div className="ot-compact-items">
            {items.slice(0, 2).map((i: any) => i.item_name).join(', ')}
            {items.length > 2 ? ` +${items.length - 2}` : ''}
          </div>
          <div className="ot-compact-chef">👩‍🍳 {chefUser?.full_name}</div>
        </div>
        <div className="ot-compact-right">
          <div className={`ot-compact-status ${isDelivered ? 'ot-compact-status--done' : isActive ? 'ot-compact-status--active' : ''}`}>
            {step?.emoji} {step?.label}
          </div>
          <div className="ot-compact-price">₺{Number(order.total_amount ?? 0).toFixed(0)}</div>
          {eta && <div className="ot-compact-eta">~{eta.min}–{eta.max} dk</div>}
        </div>

        <style>{`
          .ot-compact-card {
            display: flex; align-items: center; justify-content: space-between;
            gap: 14px; padding: 14px 16px;
            background: var(--white);
            border-radius: 14px;
            border: 1.5px solid var(--gray-light);
            border-left: 4px solid var(--orange);
            text-decoration: none; color: inherit;
            transition: all 0.15s;
            box-shadow: var(--shadow);
          }
          .ot-compact-card:hover {
            border-color: var(--orange);
            transform: translateX(3px);
          }
          .ot-compact-num   { font-size: 11px; color: var(--gray); margin-bottom: 3px; }
          .ot-compact-items { font-weight: 700; font-size: 14px; color: var(--brown); margin-bottom: 3px; }
          .ot-compact-chef  { font-size: 12px; color: var(--gray); }
          .ot-compact-right { text-align: right; flex-shrink: 0; }
          .ot-compact-status {
            font-size: 12px; font-weight: 700; color: var(--gray);
            margin-bottom: 4px;
          }
          .ot-compact-status--active { color: var(--orange); }
          .ot-compact-status--done   { color: var(--green); }
          .ot-compact-price  { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: var(--brown); }
          .ot-compact-eta    { font-size: 11px; color: var(--gray); margin-top: 2px; }
        `}</style>
      </Link>
    )
  }

  // ── Tam kart ───────────────────────────────────────────────────────────────

  const currentStep = ORDER_STEPS.find(s => s.status === order.status)

  return (
    <div className={`ot-card ${justChanged ? 'ot-card--flash' : ''}`}>

      {/* ── Başlık ── */}
      <div className="ot-header">
        <div>
          <div className="ot-order-num">#{order.order_number}</div>
          <div className="ot-chef-name">👩‍🍳 {chefUser?.full_name ?? 'Aşçı'}</div>
        </div>
        <div className="ot-header-right">
          <ConnectionBadge connected={connected} />
          {lastUpdated && (
            <div className="ot-last-update">
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* ── Mevcut durum büyük gösterge ── */}
      <div className={`ot-status-hero ${isDelivered ? 'ot-status-hero--done' : isCancelled ? 'ot-status-hero--cancelled' : 'ot-status-hero--active'}`}>
        <div className="ot-status-emoji">{currentStep?.emoji ?? '❓'}</div>
        <div>
          <div className="ot-status-label">{currentStep?.label ?? order.status}</div>
          <div className="ot-status-desc">{currentStep?.desc}</div>
        </div>
        <ETABadge eta={eta} />
      </div>

      {/* ── Adım çubuğu ── */}
      <div className="ot-steps-wrap">
        <StepBar status={order.status as OrderStatus} history={statusHistory} />
      </div>

      {/* ── Teslimat bilgisi ── */}
      {order.delivery_type === 'delivery' && order.delivery_address && (
        <div className="ot-section">
          <div className="ot-section-title">📍 Teslimat Adresi</div>
          <div className="ot-addr">
            {(order.delivery_address as any).full_address}
          </div>
        </div>
      )}

      {order.delivery_type === 'pickup' && (
        <div className="ot-section ot-pickup-note">
          <div className="ot-section-title">🚶 Gel-Al Siparişi</div>
          <div className="ot-addr">
            Hazır olduğunda {chefUser?.full_name} sizi arayacak veya bildirim gönderecek.
            {chef?.location_approx && ` · ${chef.location_approx}`}
          </div>
        </div>
      )}

      {/* ── Sipariş kalemleri ── */}
      <div className="ot-section">
        <div className="ot-section-title">🛒 Sipariş İçeriği</div>
        <div className="ot-items">
          {items.map((item: any) => (
            <div key={item.id} className="ot-item-row">
              <span className="ot-item-qty">{item.quantity}×</span>
              <span className="ot-item-name">{item.item_name}</span>
              <span className="ot-item-price">₺{Number(item.line_total).toFixed(0)}</span>
            </div>
          ))}
          <div className="ot-item-total">
            <span>Toplam</span>
            <span>₺{Number((order as any).total_amount ?? 0).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* ── Aşçı iletişim ── */}
      {chefUser?.phone && isActive && (
        <div className="ot-section ot-chef-contact">
          <div className="ot-section-title">👩‍🍳 Aşçıyla İletişim</div>
          <div className="ot-contact-row">
            {chefUser.avatar_url
              ? <img src={chefUser.avatar_url} alt={chefUser.full_name} className="ot-chef-avatar" />
              : <div className="ot-chef-avatar-placeholder">{chefUser.full_name[0]}</div>
            }
            <div className="ot-chef-info">
              <div className="ot-chef-name-big">{chefUser.full_name}</div>
              {chef?.location_approx && <div className="ot-chef-loc">📍 {chef.location_approx}</div>}
            </div>
            <div className="ot-contact-btns">
              <a
                href={`/mesajlar?order=${orderId}`}
                className="ot-contact-btn ot-contact-btn--msg"
              >
                💬 Mesaj
              </a>
              <a
                href={`tel:${chefUser.phone}`}
                className="ot-contact-btn ot-contact-btn--call"
              >
                📞 Ara
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Aksiyonlar ── */}
      <div className="ot-actions">
        {/* İptal (sadece pending) */}
        {order.status === 'pending' && (
          <button className="ot-btn ot-btn--cancel" type="button">
            ❌ Siparişi İptal Et
          </button>
        )}

        {/* Yardım */}
        <Link href="/yardim" className="ot-btn ot-btn--help">
          🆘 Yardım
        </Link>

        {/* Değerlendirme (delivered) */}
        {isDelivered && onReview && (
          <button
            className="ot-btn ot-btn--review"
            onClick={() => onReview(orderId)}
            type="button"
          >
            ⭐ Değerlendir
          </button>
        )}

        {/* Tekrar sipariş (delivered) */}
        {isDelivered && chef?.id && (
          <Link href={`/asci/${chef.id}#menu`} className="ot-btn ot-btn--reorder">
            🔁 Tekrar Sipariş
          </Link>
        )}
      </div>

      <style>{`
        /* ── Kart ───────────────────────── */
        .ot-card {
          background: var(--white);
          border-radius: 20px; padding: 20px;
          box-shadow: var(--shadow);
          border: 1.5px solid var(--gray-light);
          display: flex; flex-direction: column; gap: 16px;
          transition: box-shadow 0.3s;
        }

        .ot-card--flash {
          animation: ot-flash 1.2s ease;
        }

        @keyframes ot-flash {
          0%,100% { box-shadow: var(--shadow); }
          30%      { box-shadow: 0 0 0 4px rgba(232,98,42,0.35), var(--shadow-lg); }
        }

        /* ── Yükleniyor / Hata ──────────── */
        .ot-loading, .ot-error {
          display: flex; align-items: center; gap: 12px;
          padding: 32px; justify-content: center;
          font-size: 13px; color: var(--gray);
          flex-direction: column; text-align: center;
        }

        .ot-spinner {
          width: 28px; height: 28px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .ot-retry-btn {
          padding: 8px 16px; background: var(--orange); color: white;
          border: none; border-radius: 8px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        }

        /* ── Başlık ─────────────────────── */
        .ot-header {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
        }

        .ot-order-num { font-size: 12px; color: var(--gray); font-weight: 700; margin-bottom: 2px; letter-spacing: 0.5px; }
        .ot-chef-name { font-size: 14px; font-weight: 700; color: var(--brown); }

        .ot-header-right { text-align: right; }

        /* Bağlantı */
        .ot-conn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 20px; margin-bottom: 4px;
        }

        .ot-conn--live { background: #ECFDF5; color: var(--green); }
        .ot-conn--off  { background: var(--warm); color: var(--gray); }

        .ot-conn-dot {
          width: 7px; height: 7px; border-radius: 50%;
        }

        .ot-conn--live .ot-conn-dot { background: var(--green); animation: pulse 2s infinite; }
        .ot-conn--off  .ot-conn-dot { background: var(--gray); }

        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

        .ot-last-update { font-size: 10px; color: var(--gray); }

        /* ── Durum hero ─────────────────── */
        .ot-status-hero {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; border-radius: 14px;
        }

        .ot-status-hero--active    { background: linear-gradient(135deg, #FFF5EF, #FEF3EC); border: 1.5px solid var(--orange); }
        .ot-status-hero--done      { background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border: 1.5px solid var(--green); }
        .ot-status-hero--cancelled { background: #FEF2F2; border: 1.5px solid #FECACA; }

        .ot-status-emoji { font-size: 36px; flex-shrink: 0; animation: ot-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1); }

        @keyframes ot-bounce {
          from { transform: scale(0.5); }
          to   { transform: scale(1); }
        }

        .ot-status-label {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700; color: var(--brown); margin-bottom: 3px;
        }

        .ot-status-desc { font-size: 12.5px; color: var(--gray); }

        /* ETA */
        .ot-eta {
          margin-left: auto; display: flex; align-items: center; gap: 6px;
          background: var(--white); padding: 8px 14px; border-radius: 10px;
          font-size: 13px; color: var(--brown);
          box-shadow: 0 1px 6px rgba(74,44,14,0.08);
          flex-shrink: 0;
        }

        .ot-eta--soon { background: var(--orange); color: white; font-weight: 700; }
        .ot-eta-icon  { font-size: 16px; }
        .ot-eta-text  strong { color: var(--orange); }
        .ot-eta--soon .ot-eta-text strong { color: white; }

        /* ── Adımlar ────────────────────── */
        .ot-steps-wrap { overflow-x: auto; padding-bottom: 4px; }

        .ot-steps {
          display: flex;
          align-items: flex-start;
          min-width: max-content;
          gap: 0; padding: 4px 2px 8px;
        }

        .ot-step {
          display: flex; flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1; min-width: 72px;
        }

        /* Yatay bağlantı çizgisi */
        .ot-line {
          position: absolute;
          top: 17px; left: 50%;
          width: 100%; height: 2px;
          background: var(--gray-light);
          z-index: 0;
          transition: background 0.4s;
        }

        .ot-line--done { background: var(--green); }

        /* Nokta */
        .ot-dot {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: var(--gray-light);
          color: var(--gray);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; position: relative; z-index: 1;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .ot-step--done    .ot-dot {
          background: var(--green); color: white; font-size: 16px; font-weight: 700;
        }

        .ot-step--current .ot-dot {
          background: var(--orange); color: white;
          box-shadow: 0 0 0 5px rgba(232,98,42,0.2);
          animation: ot-pulse 2s infinite;
        }

        @keyframes ot-pulse {
          0%,100% { box-shadow: 0 0 0 5px rgba(232,98,42,0.2); }
          50%      { box-shadow: 0 0 0 9px rgba(232,98,42,0.06); }
        }

        .ot-step-label {
          font-size: 10px; font-weight: 700; color: var(--gray);
          text-align: center; margin-top: 6px; line-height: 1.3;
          white-space: nowrap;
        }

        .ot-step--done .ot-step-label,
        .ot-step--current .ot-step-label { color: var(--brown); }

        .ot-step-time {
          font-size: 9px; color: var(--gray); margin-top: 2px;
        }

        /* İptal */
        .ot-cancelled {
          text-align: center; padding: 16px;
          background: #FEF2F2; color: #DC2626;
          border-radius: 10px; font-weight: 700; font-size: 14px;
        }

        /* ── Bölümler ───────────────────── */
        .ot-section { display: flex; flex-direction: column; gap: 8px; }

        .ot-section-title {
          font-size: 11px; font-weight: 800;
          color: var(--gray); text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ot-addr {
          font-size: 13px; color: var(--brown); line-height: 1.6;
          background: var(--warm); padding: 10px 12px; border-radius: 8px;
        }

        .ot-pickup-note .ot-addr { background: #ECFDF5; }

        /* ── Kalemler ───────────────────── */
        .ot-items { display: flex; flex-direction: column; gap: 6px; }

        .ot-item-row {
          display: flex; align-items: center; gap: 8px; font-size: 13px;
        }

        .ot-item-qty   { color: var(--gray); font-weight: 700; flex-shrink: 0; min-width: 22px; }
        .ot-item-name  { flex: 1; color: var(--brown); }
        .ot-item-price { font-weight: 700; color: var(--orange); flex-shrink: 0; }

        .ot-item-total {
          display: flex; justify-content: space-between;
          font-size: 14px; font-weight: 800; color: var(--brown);
          border-top: 1.5px solid var(--gray-light);
          padding-top: 8px; margin-top: 4px;
        }

        /* ── Aşçı iletişim ─────────────── */
        .ot-contact-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--warm); padding: 12px 14px; border-radius: 12px;
        }

        .ot-chef-avatar {
          width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
        }

        .ot-chef-avatar-placeholder {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #FDE68A, #F59E0B);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #78350F; flex-shrink: 0;
        }

        .ot-chef-info { flex: 1; }
        .ot-chef-name-big { font-weight: 700; font-size: 13.5px; color: var(--brown); }
        .ot-chef-loc      { font-size: 11.5px; color: var(--gray); margin-top: 2px; }

        .ot-contact-btns { display: flex; gap: 6px; flex-shrink: 0; }

        .ot-contact-btn {
          padding: 7px 12px; border-radius: 8px; text-decoration: none;
          font-size: 12px; font-weight: 700; white-space: nowrap;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }

        .ot-contact-btn--msg  { background: var(--orange); color: white; }
        .ot-contact-btn--call { background: var(--green);  color: white; }
        .ot-contact-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        /* ── Aksiyonlar ─────────────────── */
        .ot-actions {
          display: flex; gap: 8px; flex-wrap: wrap;
          border-top: 1px solid var(--gray-light); padding-top: 14px;
        }

        .ot-btn {
          padding: 9px 16px; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 700; text-decoration: none;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          border: none; display: inline-flex; align-items: center; gap: 5px;
        }

        .ot-btn--cancel  { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .ot-btn--help    { background: var(--warm); color: var(--brown-mid); border: 1.5px solid var(--gray-light); }
        .ot-btn--review  { background: #FFFBEB; color: #92400E; border: 1.5px solid #FDE68A; }
        .ot-btn--reorder { background: var(--orange); color: white; }

        .ot-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
      `}</style>
    </div>
  )
}
