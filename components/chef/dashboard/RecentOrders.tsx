'use client'

import type { DashboardOrder } from '@/types/dashboard'

interface RecentOrdersProps {
  orders: DashboardOrder[]
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  delivered: { label: '✅ Teslim',   color: 'var(--green)',  bg: '#ECFDF5' },
  cancelled: { label: '✕ İptal',    color: '#DC2626',        bg: '#FEE2E2' },
}

function timeAgo(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days} gün önce`
  if (hours > 0) return `${hours} saat önce`
  if (mins > 0)  return `${mins} dk önce`
  return 'Az önce'
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: 'var(--gray)',
        fontSize: 13,
        background: 'var(--warm)',
        borderRadius: 10,
        border: '1.5px dashed var(--gray-light)',
      }}>
        Henüz tamamlanmış sipariş yok
      </div>
    )
  }

  return (
    <div className="recent-wrap">
      <div className="recent-table">
        <div className="recent-thead">
          <div>Sipariş</div>
          <div>İçerik</div>
          <div>Alıcı</div>
          <div>Kazanç</div>
          <div>Durum</div>
          <div>Zaman</div>
        </div>

        {orders.map(order => {
          const meta = STATUS_META[order.status] ?? STATUS_META.delivered

          return (
            <div key={order.id} className={`recent-row ${order.status === 'cancelled' ? 'cancelled-row' : ''}`}>
              <div className="recent-num">{order.order_number}</div>
              <div className="recent-items">{order.items_summary}</div>
              <div className="recent-buyer">{order.buyer_name}</div>
              <div className="recent-earning">
                {order.status === 'cancelled'
                  ? <span style={{ color: '#DC2626' }}>—</span>
                  : <strong>₺{order.chef_earning.toLocaleString('tr-TR')}</strong>
                }
              </div>
              <div>
                <span
                  className="recent-status"
                  style={{ color: meta.color, background: meta.bg }}
                >
                  {meta.label}
                </span>
              </div>
              <div className="recent-time">{timeAgo(order.created_at)}</div>
            </div>
          )
        })}
      </div>

      <style>{`
        .recent-wrap { overflow-x: auto; }

        .recent-table {
          display: table;
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
        }

        .recent-thead {
          display: table-row;
          background: var(--warm);
          border-radius: 8px;
        }

        .recent-thead > div {
          display: table-cell;
          padding: 8px 12px;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--gray);
          font-weight: 700;
        }

        .recent-row {
          display: table-row;
          transition: background 0.12s;
        }

        .recent-row:hover > div { background: rgba(250,246,239,0.7); }

        .recent-row > div {
          display: table-cell;
          padding: 11px 12px;
          border-bottom: 1px solid rgba(232,224,212,0.4);
          vertical-align: middle;
          font-size: 13px;
          background: transparent;
          transition: background 0.12s;
        }

        .cancelled-row { opacity: 0.6; }

        .recent-num {
          font-size: 11.5px !important;
          color: var(--gray) !important;
          font-weight: 700;
          white-space: nowrap;
        }

        .recent-items {
          color: var(--brown);
          font-weight: 600;
          max-width: 160px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recent-buyer {
          color: var(--gray);
          font-size: 12px !important;
        }

        .recent-earning {
          font-family: 'Playfair Display', serif;
          font-size: 15px !important;
          color: var(--green);
        }

        .recent-status {
          display: inline-flex;
          align-items: center;
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .recent-time {
          font-size: 11.5px !important;
          color: var(--gray);
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
