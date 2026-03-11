// @ts-nocheck
'use client'

/**
 * ChefOrderBell + ChefLiveOrders
 * ──────────────────────────────
 * Aşçı panelindeki canlı sipariş bildirimi ve aktif sipariş listesi.
 * useRealtimeChefOrders hook'unu kullanır.
 */
import { useState, useEffect, useRef } from 'react'
import { useRealtimeChefOrders } from '@/hooks/useRealtimeOrder'
import type { Order, OrderStatus } from '@/types/database'

// ── Bildirim izni isteği ──────────────────────────────────────────────────────

async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

// ── Zil ikonu (header'da) ─────────────────────────────────────────────────────

export function ChefOrderBell({ chefId }: { chefId: string }) {
  const { newCount, clearNew } = useRealtimeChefOrders(chefId)
  const [open, setOpen]       = useState(false)
  const bellRef               = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="cob-wrap" ref={bellRef as any}>
      <button
        className={`cob-btn ${newCount > 0 ? 'cob-btn--new' : ''}`}
        onClick={() => { setOpen(!open); if (open) clearNew() }}
        type="button"
        aria-label="Siparişler"
      >
        🔔
        {newCount > 0 && (
          <span className="cob-badge">{newCount}</span>
        )}
      </button>

      {open && (
        <div className="cob-dropdown">
          <div className="cob-dropdown-title">
            Yeni Siparişler
            {newCount > 0 && <span className="cob-new-tag">{newCount} yeni</span>}
          </div>
          <div className="cob-dropdown-body">
            Siparişlerinizi aşağıdaki panelden takip edebilirsiniz.
          </div>
          <button
            className="cob-dropdown-close"
            onClick={() => { setOpen(false); clearNew() }}
            type="button"
          >
            Tamam
          </button>
        </div>
      )}

      <style>{`
        .cob-wrap { position: relative; }

        .cob-btn {
          position: relative; background: none; border: none; cursor: pointer;
          font-size: 18px; padding: 6px 8px; border-radius: 8px;
          transition: background 0.15s;
        }
        .cob-btn:hover { background: rgba(255,255,255,0.1); }
        .cob-btn--new  { animation: cob-shake 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both; }

        @keyframes cob-shake {
          10%,90% { transform: rotate(-2deg); }
          20%,80% { transform: rotate(3deg); }
          30%,50%,70% { transform: rotate(-4deg); }
          40%,60% { transform: rotate(4deg); }
        }

        .cob-badge {
          position: absolute; top: 2px; right: 2px;
          background: var(--orange); color: white;
          font-size: 9px; font-weight: 800;
          min-width: 16px; height: 16px;
          border-radius: 8px; display: flex;
          align-items: center; justify-content: center;
          padding: 0 3px;
          border: 2px solid var(--brown);
        }

        .cob-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: var(--white); border-radius: 14px;
          padding: 16px; min-width: 220px;
          box-shadow: var(--shadow-lg);
          border: 1.5px solid var(--gray-light);
          z-index: 200;
        }

        .cob-dropdown-title {
          font-weight: 700; font-size: 13px; color: var(--brown);
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }

        .cob-new-tag {
          font-size: 10px; font-weight: 700; background: var(--orange);
          color: white; padding: 2px 7px; border-radius: 10px;
        }

        .cob-dropdown-body {
          font-size: 12px; color: var(--gray); line-height: 1.6; margin-bottom: 12px;
        }

        .cob-dropdown-close {
          width: 100%; padding: 8px; background: var(--orange); color: white;
          border: none; border-radius: 8px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        }
      `}</style>
    </div>
  )
}

// ── Bekleyen sipariş kartı (aşçı paneli) ──────────────────────────────────────

function ChefOrderCard({
  order,
  onAction,
}: {
  order:    Order
  onAction: (id: string, action: 'confirm' | 'reject' | 'advance') => void
}) {
  const items    = (order as any).order_items ?? []
  const buyer    = (order as any).users
  const isNew    = Date.now() - new Date(order.created_at).getTime() < 3 * 60 * 1000  // <3 dk

  const STATUS_NEXT: Partial<Record<OrderStatus, string>> = {
    confirmed: '👩‍🍳 Hazırlamaya Başla',
    preparing: '📦 Hazır',
    ready:     '🛵 Yola Çıktım',
    on_way:    '🏠 Teslim Edildi',
  }

  const nextLabel = STATUS_NEXT[order.status as OrderStatus]

  return (
    <div className={`coc-card ${isNew ? 'coc-card--new' : ''} coc-card--${order.status}`}>
      {isNew && <div className="coc-new-ribbon">YENİ ⚡</div>}

      <div className="coc-header">
        <div>
          <div className="coc-num">#{order.order_number}</div>
          <div className="coc-buyer">
            {buyer?.avatar_url
              ? <img src={buyer.avatar_url} alt={buyer.full_name} className="coc-buyer-avatar" />
              : <div className="coc-buyer-avatar-ph">{buyer?.full_name?.[0]}</div>
            }
            <span>{buyer?.full_name ?? 'Alıcı'}</span>
          </div>
        </div>
        <div className="coc-header-right">
          <div className="coc-time">
            {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className={`coc-delivery ${order.delivery_type === 'pickup' ? 'coc-delivery--pickup' : ''}`}>
            {order.delivery_type === 'pickup' ? '🚶 Gel-Al' : '🛵 Teslimat'}
          </div>
        </div>
      </div>

      {/* Kalemler */}
      <div className="coc-items">
        {items.map((item: any) => (
          <div key={item.id} className="coc-item">
            <span className="coc-item-qty">{item.quantity}×</span>
            <span className="coc-item-name">{item.item_name}</span>
            <span className="coc-item-price">₺{Number(item.line_total).toFixed(0)}</span>
          </div>
        ))}
        <div className="coc-total">
          <span>Toplam</span>
          <span>₺{Number((order as any).total_amount ?? 0).toFixed(0)}</span>
        </div>
      </div>

      {/* Not */}
      {order.notes && (
        <div className="coc-note">📝 {order.notes}</div>
      )}

      {/* Aksiyonlar */}
      <div className="coc-actions">
        {order.status === 'pending' && (
          <>
            <button
              className="coc-btn coc-btn--reject"
              onClick={() => onAction(order.id, 'reject')}
              type="button"
            >
              ❌ Reddet
            </button>
            <button
              className="coc-btn coc-btn--confirm"
              onClick={() => onAction(order.id, 'confirm')}
              type="button"
            >
              ✅ Onayla
            </button>
          </>
        )}

        {nextLabel && order.status !== 'pending' && (
          <button
            className="coc-btn coc-btn--advance"
            onClick={() => onAction(order.id, 'advance')}
            type="button"
          >
            {nextLabel}
          </button>
        )}

        <a
          href={`tel:${buyer?.phone}`}
          className="coc-btn coc-btn--call"
          title="Alıcıyı Ara"
        >
          📞
        </a>
      </div>

      <style>{`
        .coc-card {
          position: relative; overflow: hidden;
          background: var(--white); border-radius: 16px;
          padding: 16px; box-shadow: var(--shadow);
          border: 1.5px solid var(--gray-light);
          border-left: 4px solid var(--orange);
          transition: transform 0.15s;
        }
        .coc-card:hover { transform: translateX(2px); }

        .coc-card--confirmed { border-left-color: #3B82F6; }
        .coc-card--preparing { border-left-color: var(--orange); }
        .coc-card--ready     { border-left-color: var(--green); }
        .coc-card--on_way    { border-left-color: var(--brown-mid); }

        .coc-card--new {
          animation: coc-arrive 0.5s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 0 0 3px rgba(232,98,42,0.25), var(--shadow);
        }

        @keyframes coc-arrive {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }

        .coc-new-ribbon {
          position: absolute; top: 0; right: 0;
          background: var(--orange); color: white;
          font-size: 9px; font-weight: 900;
          padding: 3px 10px 3px 14px;
          border-radius: 0 0 0 12px;
          letter-spacing: 1px;
        }

        .coc-header {
          display: flex; justify-content: space-between; margin-bottom: 12px;
        }
        .coc-num  { font-size: 11px; color: var(--gray); font-weight: 700; margin-bottom: 4px; }
        .coc-buyer {
          display: flex; align-items: center; gap: 6px;
          font-size: 13.5px; font-weight: 700; color: var(--brown);
        }
        .coc-buyer-avatar {
          width: 26px; height: 26px; border-radius: 50%; object-fit: cover;
        }
        .coc-buyer-avatar-ph {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--warm); display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: var(--brown-mid);
        }

        .coc-header-right { text-align: right; }
        .coc-time { font-size: 12px; font-weight: 700; color: var(--brown); margin-bottom: 4px; }
        .coc-delivery {
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 10px;
          background: #EFF6FF; color: #3B82F6;
          display: inline-block;
        }
        .coc-delivery--pickup { background: var(--warm); color: var(--brown-mid); }

        .coc-items  { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .coc-item   { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .coc-item-qty  { color: var(--gray); font-weight: 700; min-width: 22px; flex-shrink: 0; }
        .coc-item-name { flex: 1; color: var(--brown); }
        .coc-item-price { color: var(--orange); font-weight: 700; flex-shrink: 0; }

        .coc-total {
          display: flex; justify-content: space-between;
          font-weight: 800; font-size: 14px; color: var(--brown);
          border-top: 1.5px solid var(--gray-light); padding-top: 8px; margin-top: 4px;
        }

        .coc-note {
          font-size: 12px; color: var(--brown-mid); background: #FFFBEB;
          padding: 8px 10px; border-radius: 8px; margin-bottom: 10px;
          border-left: 3px solid #F59E0B;
        }

        .coc-actions { display: flex; gap: 6px; }
        .coc-btn {
          padding: 8px 14px; border-radius: 10px; border: none;
          font-size: 12.5px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
        }
        .coc-btn--confirm { flex: 1; background: var(--green); color: white; justify-content: center; }
        .coc-btn--reject  { flex: 1; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; justify-content: center; }
        .coc-btn--advance { flex: 1; background: var(--orange); color: white; justify-content: center; }
        .coc-btn--call    { background: var(--warm); color: var(--brown-mid); border: 1.5px solid var(--gray-light); }
        .coc-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
      `}</style>
    </div>
  )
}

// ── Ana bileşen: ChefLiveOrders ───────────────────────────────────────────────

export function ChefLiveOrders({ chefId }: { chefId: string }) {
  const { orders, loading, newCount, clearNew } = useRealtimeChefOrders(chefId)
  const supabase = (await import('@/lib/supabase/client')).getSupabaseBrowserClient()

  const STATUS_ADVANCE: Partial<Record<OrderStatus, OrderStatus>> = {
    confirmed: 'preparing',
    preparing: 'ready',
    ready:     'on_way',
    on_way:    'delivered',
  }

  const handleAction = async (orderId: string, action: 'confirm' | 'reject' | 'advance') => {
    let newStatus: OrderStatus | null = null
    if (action === 'confirm') newStatus = 'confirmed'
    if (action === 'reject')  newStatus = 'cancelled'
    if (action === 'advance') {
      const order = orders.find(o => o.id === orderId)
      if (order) newStatus = STATUS_ADVANCE[order.status as OrderStatus] ?? null
    }
    if (!newStatus) return

    const tsField: Partial<Record<OrderStatus, string>> = {
      confirmed: 'confirmed_at',
      preparing: 'preparing_at',
      ready:     'ready_at',
      on_way:    'on_way_at',
      delivered: 'delivered_at',
    }

    await supabase.from('orders').update({
      status: newStatus,
      ...(tsField[newStatus] ? { [tsField[newStatus]!]: new Date().toISOString() } : {}),
    }).eq('id', orderId)
  }

  // Bekleyen ve aktif siparişler
  const pending  = orders.filter(o => o.status === 'pending')
  const inFlight = orders.filter(o => ['confirmed', 'preparing', 'ready', 'on_way'].includes(o.status))

  if (loading) return (
    <div className="clo-loading">
      <div className="clo-spinner" />
      <span>Siparişler yükleniyor…</span>
    </div>
  )

  return (
    <div className="clo-wrap">

      {/* Başlık */}
      {newCount > 0 && (
        <div className="clo-alert" onClick={clearNew}>
          <span className="clo-alert-dot" />
          ⚡ {newCount} yeni sipariş geldi! Tıkla, sıfırla
        </div>
      )}

      {/* Bekleyen */}
      {pending.length > 0 && (
        <div className="clo-section">
          <div className="clo-section-title">
            ⏳ Onay Bekleyen
            <span className="clo-section-count">{pending.length}</span>
          </div>
          <div className="clo-list">
            {pending.map(o => (
              <ChefOrderCard key={o.id} order={o} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {/* Aktif */}
      {inFlight.length > 0 && (
        <div className="clo-section">
          <div className="clo-section-title">
            🍳 Aktif
            <span className="clo-section-count">{inFlight.length}</span>
          </div>
          <div className="clo-list">
            {inFlight.map(o => (
              <ChefOrderCard key={o.id} order={o} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {/* Boş */}
      {orders.length === 0 && (
        <div className="clo-empty">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🕐</div>
          <div className="clo-empty-title">Bekleyen sipariş yok</div>
          <div className="clo-empty-sub">Yeni siparişler anında burada görünür</div>
        </div>
      )}

      <style>{`
        .clo-loading {
          display: flex; align-items: center; gap: 10px;
          padding: 32px; font-size: 13px; color: var(--gray);
          justify-content: center;
        }
        .clo-spinner {
          width: 24px; height: 24px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .clo-wrap { display: flex; flex-direction: column; gap: 20px; }

        .clo-alert {
          display: flex; align-items: center; gap: 8px;
          background: #FFF5EF; border: 1.5px solid var(--orange);
          border-radius: 12px; padding: 10px 14px;
          font-size: 13px; font-weight: 700; color: var(--orange);
          cursor: pointer; transition: background 0.15s;
          animation: clo-pulse 1s ease 3;
        }
        .clo-alert:hover { background: #FEF3EC; }

        @keyframes clo-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,98,42,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(232,98,42,0); }
        }

        .clo-alert-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--orange); flex-shrink: 0;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

        .clo-section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 800; color: var(--brown);
          margin-bottom: 12px;
        }
        .clo-section-count {
          background: var(--orange); color: white;
          font-size: 10px; padding: 2px 7px; border-radius: 10px;
        }

        .clo-list { display: flex; flex-direction: column; gap: 10px; }

        .clo-empty {
          text-align: center; padding: 32px 16px;
          color: var(--gray);
        }
        .clo-empty-title { font-weight: 700; font-size: 14px; color: var(--brown); margin-bottom: 4px; }
        .clo-empty-sub   { font-size: 12px; }
      `}</style>
    </div>
  )
}
