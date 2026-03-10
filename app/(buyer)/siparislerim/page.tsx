'use client'

import { useState } from 'react'
import { useRealtimeBuyerOrders } from '@/hooks/useRealtimeOrder'
import { OrderTracker } from '@/components/orders/OrderTracker'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

// ── Değerlendirme modal (basit) ───────────────────────────────────────────────

function ReviewModal({
  orderId,
  onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const [rating,  setRating]  = useState(5)
  const [comment, setComment] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)

  const submit = async () => {
    setSaving(true)
    await fetch('/api/reviews', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ order_id: orderId, rating, comment }),
    })
    setDone(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="rm-done">✅ Değerlendirmeniz alındı, teşekkürler!</div>
        ) : (
          <>
            <div className="rm-title">Siparişinizi Değerlendirin ⭐</div>
            <div className="rm-stars">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  className={`rm-star ${s <= rating ? 'rm-star--on' : ''}`}
                  onClick={() => setRating(s)}
                  type="button"
                  aria-label={`${s} yıldız`}
                >★</button>
              ))}
            </div>
            <textarea
              className="rm-textarea"
              placeholder="Yorumunuz (isteğe bağlı)…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
            <div className="rm-actions">
              <button className="rm-btn rm-btn--cancel" onClick={onClose} type="button">Vazgeç</button>
              <button className="rm-btn rm-btn--submit" onClick={submit} disabled={saving} type="button">
                {saving ? 'Kaydediliyor…' : 'Gönder'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .rm-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .rm-modal {
          background: var(--white); border-radius: 20px;
          padding: 28px; max-width: 400px; width: 100%;
          box-shadow: var(--shadow-lg);
        }
        .rm-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700; color: var(--brown);
          margin-bottom: 16px; text-align: center;
        }
        .rm-stars {
          display: flex; justify-content: center; gap: 8px; margin-bottom: 16px;
        }
        .rm-star {
          font-size: 32px; background: none; border: none; cursor: pointer;
          color: var(--gray-light); transition: color 0.15s, transform 0.15s;
          line-height: 1;
        }
        .rm-star--on  { color: #F59E0B; }
        .rm-star:hover { transform: scale(1.2); }
        .rm-textarea {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid var(--gray-light); border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: var(--brown); resize: none; margin-bottom: 16px;
        }
        .rm-textarea:focus { outline: none; border-color: var(--orange); }
        .rm-actions { display: flex; gap: 8px; }
        .rm-btn {
          flex: 1; padding: 10px; border-radius: 10px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: opacity 0.15s;
        }
        .rm-btn--cancel { background: var(--warm); color: var(--gray); }
        .rm-btn--submit { background: var(--orange); color: white; }
        .rm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .rm-done {
          text-align: center; padding: 20px;
          font-size: 15px; font-weight: 700; color: var(--green);
        }
      `}</style>
    </div>
  )
}

// ── Geçmiş sipariş satırı ─────────────────────────────────────────────────────

function PastOrderRow({ order, onReview }: { order: any; onReview: (id: string) => void }) {
  const items   = order.order_items ?? []
  const chef    = order.chef_profiles?.users
  const date    = new Date(order.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const isCancelled = order.status === 'cancelled'

  return (
    <div className={`por-row ${isCancelled ? 'por-row--cancelled' : ''}`}>
      <div className="por-left">
        <div className="por-num">#{order.order_number}</div>
        <div className="por-items">
          {items.slice(0, 2).map((i: any) => i.item_name).join(', ')}
          {items.length > 2 && ` +${items.length - 2}`}
        </div>
        <div className="por-meta">
          👩‍🍳 {chef?.full_name ?? 'Aşçı'} · {date}
        </div>
      </div>
      <div className="por-right">
        <div className="por-price">₺{Number(order.total_amount ?? 0).toFixed(0)}</div>
        <div className={`por-status ${isCancelled ? 'por-status--cancelled' : 'por-status--done'}`}>
          {isCancelled ? '❌ İptal' : '✅ Teslim Edildi'}
        </div>
        <div className="por-actions">
          {!isCancelled && (
            <button
              className="por-btn por-btn--review"
              onClick={() => onReview(order.id)}
              type="button"
            >
              ⭐ Değerlendir
            </button>
          )}
          <Link href={`/asci/${order.chef_id}#menu`} className="por-btn por-btn--reorder">
            🔁 Tekrar
          </Link>
        </div>
      </div>

      <style>{`
        .por-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding: 14px 16px;
          background: var(--white); border-radius: 14px;
          border: 1.5px solid var(--gray-light);
          transition: border-color 0.15s;
        }
        .por-row:hover { border-color: var(--orange-light); }
        .por-row--cancelled { opacity: 0.6; }

        .por-num    { font-size: 11px; color: var(--gray); font-weight: 700; margin-bottom: 3px; }
        .por-items  { font-weight: 700; font-size: 13.5px; color: var(--brown); margin-bottom: 3px; }
        .por-meta   { font-size: 11.5px; color: var(--gray); }

        .por-right  { text-align: right; flex-shrink: 0; }
        .por-price  { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: var(--brown); margin-bottom: 4px; }

        .por-status          { font-size: 11px; font-weight: 700; margin-bottom: 8px; }
        .por-status--done    { color: var(--green); }
        .por-status--cancelled { color: #DC2626; }

        .por-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .por-btn {
          padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
          text-decoration: none; cursor: pointer; border: none;
          font-family: 'DM Sans', sans-serif; transition: opacity 0.15s;
        }
        .por-btn--review  { background: #FFFBEB; color: #92400E; border: 1.5px solid #FDE68A; }
        .por-btn--reorder { background: var(--orange); color: white; }
        .por-btn:hover    { opacity: 0.85; }
      `}</style>
    </div>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────

export default function SiparislerimPage() {
  const { user } = useAuth()
  const { active, completed, loading } = useRealtimeBuyerOrders(user?.id ?? '')
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'past'>('active')

  if (!user) return (
    <div className="sl-empty">
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
      <div className="sl-empty-title">Giriş Yapmanız Gerekiyor</div>
      <Link href="/giris" className="sl-login-btn">Giriş Yap</Link>
    </div>
  )

  return (
    <div className="sl-page">

      {/* Başlık */}
      <div className="sl-header">
        <h1 className="sl-title">Siparişlerim</h1>
        {active.length > 0 && (
          <div className="sl-live-badge">
            <span className="sl-live-dot" />
            {active.length} aktif sipariş canlı izleniyor
          </div>
        )}
      </div>

      {/* Sekmeler */}
      <div className="sl-tabs">
        <button
          className={`sl-tab ${tab === 'active' ? 'sl-tab--active' : ''}`}
          onClick={() => setTab('active')}
          type="button"
        >
          🔴 Aktif {active.length > 0 && `(${active.length})`}
        </button>
        <button
          className={`sl-tab ${tab === 'past' ? 'sl-tab--active' : ''}`}
          onClick={() => setTab('past')}
          type="button"
        >
          📦 Geçmiş {completed.length > 0 && `(${completed.length})`}
        </button>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="sl-loading">
          <div className="sl-spinner" />
          <span>Siparişler yükleniyor…</span>
        </div>
      ) : tab === 'active' ? (
        active.length === 0 ? (
          <div className="sl-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div className="sl-empty-title">Aktif Sipariş Yok</div>
            <div className="sl-empty-sub">Yakınındaki lezzetleri keşfetmek ister misin?</div>
            <Link href="/kesif" className="sl-discover-btn">🔍 Keşfet</Link>
          </div>
        ) : (
          <div className="sl-active-list">
            {active.map(order => (
              <OrderTracker
                key={order.id}
                orderId={order.id}
                onReview={setReviewOrderId}
              />
            ))}
          </div>
        )
      ) : (
        completed.length === 0 ? (
          <div className="sl-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <div className="sl-empty-title">Henüz Sipariş Vermediniz</div>
            <Link href="/kesif" className="sl-discover-btn">🔍 İlk Siparişi Ver</Link>
          </div>
        ) : (
          <div className="sl-past-list">
            {completed.map(order => (
              <PastOrderRow
                key={order.id}
                order={order}
                onReview={setReviewOrderId}
              />
            ))}
          </div>
        )
      )}

      {/* Değerlendirme modal */}
      {reviewOrderId && (
        <ReviewModal
          orderId={reviewOrderId}
          onClose={() => setReviewOrderId(null)}
        />
      )}

      <style>{`
        .sl-page { max-width: 680px; margin: 0 auto; padding: 24px 20px 80px; }

        /* Başlık */
        .sl-header {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          margin-bottom: 20px; flex-wrap: wrap;
        }
        .sl-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 900; color: var(--brown);
        }
        .sl-live-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; color: var(--green);
          background: #ECFDF5; padding: 6px 12px; border-radius: 20px;
        }
        .sl-live-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--green); animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

        /* Sekmeler */
        .sl-tabs {
          display: flex; border-bottom: 2px solid var(--gray-light);
          margin-bottom: 20px;
        }
        .sl-tab {
          padding: 10px 18px; font-size: 13.5px; font-weight: 700;
          color: var(--gray); cursor: pointer; background: none; border: none;
          border-bottom: 2.5px solid transparent; margin-bottom: -2px;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .sl-tab:hover      { color: var(--brown); }
        .sl-tab--active    { color: var(--orange); border-bottom-color: var(--orange); }

        /* Listeler */
        .sl-active-list, .sl-past-list {
          display: flex; flex-direction: column; gap: 16px;
        }

        /* Yükleniyor */
        .sl-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px; padding: 48px;
          font-size: 13px; color: var(--gray);
        }
        .sl-spinner {
          width: 32px; height: 32px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Boş durum */
        .sl-empty {
          text-align: center; padding: 48px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .sl-empty-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--brown); }
        .sl-empty-sub   { font-size: 13px; color: var(--gray); margin-bottom: 8px; }
        .sl-discover-btn, .sl-login-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 11px 22px; background: var(--orange); color: white;
          border-radius: 12px; text-decoration: none;
          font-size: 13.5px; font-weight: 700; margin-top: 8px;
          transition: background 0.15s;
        }
        .sl-discover-btn:hover, .sl-login-btn:hover { background: #d4541e; }
      `}</style>
    </div>
  )
}
