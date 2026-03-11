// @ts-nocheck
'use client'

import { useState } from 'react'
import { useAdminOrders, type AdminOrder } from '@/hooks/useAdmin'

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:      { label: 'Bekliyor',    color: 'bg-amber-500/10 text-amber-400' },
  confirmed:    { label: 'Onaylandı',   color: 'bg-blue-500/10 text-blue-400' },
  preparing:    { label: 'Hazırlanıyor',color: 'bg-purple-500/10 text-purple-400' },
  on_way:   { label: 'Yolda',       color: 'bg-sky-500/10 text-sky-400' },
  delivered:    { label: 'Teslim',      color: 'bg-emerald-500/10 text-emerald-400' },
  cancelled:    { label: 'İptal',       color: 'bg-red-500/10 text-red-400' },
  disputed:     { label: 'İtiraz',      color: 'bg-rose-500/10 text-rose-400' },
}

const PAY_META: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Bekliyor',  color: 'text-amber-400' },
  paid:     { label: 'Ödendi',    color: 'text-emerald-400' },
  failed:   { label: 'Başarısız', color: 'text-red-400' },
  refunded: { label: 'İade',      color: 'text-blue-400' },
}

function OrderDetailModal({
  order, onClose, onCancel, onRefund,
}: {
  order: AdminOrder
  onClose: () => void
  onCancel: (id: string, reason?: string) => Promise<boolean>
  onRefund: (id: string, reason?: string) => Promise<boolean>
}) {
  const [reason, setReason] = useState('')
  const [busy,   setBusy]   = useState(false)

  const sm   = STATUS_META[order.status]   ?? { label: order.status, color: 'text-white/40' }
  const pm   = PAY_META[order.payment_status] ?? { label: order.payment_status, color: 'text-white/40' }
  const total = order.subtotal + (order.delivery_fee ?? 0)

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#1A1612] border border-white/[0.09] rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Başlık */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[11px] tracking-[2px] uppercase text-[#E8622A] font-semibold mb-1">Sipariş Detayı</div>
            <div className="text-white/80 font-bold text-lg">#{order.order_number}</div>
            <div className="text-white/30 text-[12px] mt-0.5">
              {new Date(order.created_at).toLocaleString('tr-TR')}
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl transition-colors">✕</button>
        </div>

        {/* Alıcı & Aşçı */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Alıcı</div>
            <div className="text-white/80 text-[13px] font-medium">{order.buyer?.full_name}</div>
            <div className="text-white/30 text-[11px] font-mono">{order.buyer?.phone}</div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Aşçı</div>
            <div className="text-white/80 text-[13px] font-medium">{order.chef?.user?.full_name}</div>
            <div className="text-white/30 text-[11px]">{order.delivery_type === 'delivery' ? '🛵 Teslimat' : '🚶 Gel-Al'}</div>
          </div>
        </div>

        {/* Ürünler */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.05] overflow-hidden mb-4">
          <div className="text-[10px] uppercase tracking-widest text-white/25 px-4 py-2.5 border-b border-white/[0.05]">
            Sipariş İçeriği
          </div>
          {order.order_items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.03] last:border-0">
              <div className="text-[13px] text-white/70">
                {item.menu_item?.name}
                <span className="text-white/30 ml-2">×{item.quantity}</span>
              </div>
              <div className="text-[13px] font-mono text-white/50">
                ₺{(item.unit_price * item.quantity).toLocaleString('tr-TR')}
              </div>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2.5 bg-white/[0.02]">
            <div className="text-[12px] text-white/40">Ara Toplam</div>
            <div className="text-[12px] font-mono text-white/60">₺{order.subtotal?.toLocaleString('tr-TR')}</div>
          </div>
          {(order.delivery_fee ?? 0) > 0 && (
            <div className="flex justify-between px-4 py-2">
              <div className="text-[12px] text-white/40">Teslimat</div>
              <div className="text-[12px] font-mono text-white/40">₺{order.delivery_fee?.toLocaleString('tr-TR')}</div>
            </div>
          )}
          <div className="flex justify-between px-4 py-3 border-t border-white/[0.06]">
            <div className="text-[13px] font-bold text-white/80">Toplam</div>
            <div className="text-[13px] font-bold font-mono text-[#E8622A]">₺{total.toLocaleString('tr-TR')}</div>
          </div>
        </div>

        {/* Durum */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Sipariş Durumu</div>
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
          </div>
          <div className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Ödeme</div>
            <span className={`text-[12px] font-bold ${pm.color}`}>{pm.label}</span>
          </div>
        </div>

        {/* Aksiyon */}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="border-t border-white/[0.06] pt-4">
            <div className="text-[11px] uppercase tracking-widest text-white/25 mb-2">Admin Aksiyonu</div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Sebep (opsiyonel)…"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-white/60 placeholder-white/20 focus:outline-none focus:border-[#E8622A]/40 resize-none mb-3"
            />
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={async () => { setBusy(true); await onCancel(order.id, reason); setBusy(false); onClose() }}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-40"
              >
                🚫 İptal Et
              </button>
              {order.payment_status === 'paid' && (
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await onRefund(order.id, reason); setBusy(false); onClose() }}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all disabled:opacity-40"
                >
                  💸 İade Başlat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminSiparisler() {
  const { orders, total, loading, page, setPage, filters, updateFilter, cancelOrder, refundOrder } = useAdminOrders()
  const [selected, setSelected] = useState<AdminOrder | null>(null)
  const totalPages = Math.ceil(total / 25)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[3px] uppercase text-[#E8622A] mb-2 font-semibold">Siparişler</div>
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-2xl font-bold text-white/90">Sipariş Yönetimi</h1>
          <p className="text-white/35 text-sm">{total.toLocaleString('tr-TR')} sipariş</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm">🔍</span>
          <input
            className="bg-[#1A1612] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2 text-[13px] text-white/70 placeholder-white/25 focus:outline-none focus:border-[#E8622A]/50 w-48 transition-colors"
            placeholder="Sipariş no…"
            value={filters.q}
            onChange={e => updateFilter('q', e.target.value)}
          />
        </div>

        {/* Tarih */}
        <input type="date" value={filters.date_from} onChange={e => updateFilter('date_from', e.target.value)}
          className="bg-[#1A1612] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/50 focus:outline-none focus:border-[#E8622A]/50" />
        <span className="text-white/20 text-xs">—</span>
        <input type="date" value={filters.date_to} onChange={e => updateFilter('date_to', e.target.value)}
          className="bg-[#1A1612] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/50 focus:outline-none focus:border-[#E8622A]/50" />

        {/* Durum */}
        <div className="flex gap-1.5 ml-auto flex-wrap">
          {[['', 'Tümü'], ...Object.entries(STATUS_META).map(([k, v]) => [k, v.label])].map(([val, label]) => (
            <button key={val} onClick={() => updateFilter('status', val)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                filters.status === val
                  ? 'bg-[#E8622A] text-white'
                  : 'bg-white/[0.04] text-white/35 hover:text-white/60'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-[#1A1612] border border-white/[0.07] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/25 text-sm">Yükleniyor…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Sipariş', 'Alıcı', 'Aşçı', 'Tutar', 'Yöntem', 'Ödeme', 'Durum', 'Tarih'].map(h => (
                  <th key={h} className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/25 px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-white/25 text-sm">Sipariş bulunamadı</td></tr>
              ) : orders.map(o => {
                const sm = STATUS_META[o.status] ?? { label: o.status, color: 'text-white/40' }
                const pm = PAY_META[o.payment_status] ?? { label: o.payment_status, color: 'text-white/40' }
                return (
                  <tr key={o.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => setSelected(o)}>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#E8622A]">#{o.order_number}</td>
                    <td className="py-3 px-4 text-white/60 text-[13px]">{o.buyer?.full_name}</td>
                    <td className="py-3 px-4 text-white/50 text-[12px]">{o.chef?.user?.full_name}</td>
                    <td className="py-3 px-4 text-white/70 text-[13px] font-mono">₺{o.subtotal?.toLocaleString('tr-TR')}</td>
                    <td className="py-3 px-4 text-[12px] text-white/35">
                      {o.delivery_type === 'delivery' ? '🛵' : '🚶'}
                    </td>
                    <td className={`py-3 px-4 text-[12px] font-semibold ${pm.color}`}>{pm.label}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                    </td>
                    <td className="py-3 px-4 text-white/30 text-[11px]">
                      {new Date(o.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-white/30">{(page - 1) * 25 + 1}–{Math.min(page * 25, total)} / {total}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.05] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
              ← Önceki
            </button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] bg-[#E8622A]/15 text-[#E8622A] font-bold">
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.05] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
              Sonraki →
            </button>
          </div>
        </div>
      )}

      {/* Detay modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onCancel={cancelOrder}
          onRefund={refundOrder}
        />
      )}
    </div>
  )
}
