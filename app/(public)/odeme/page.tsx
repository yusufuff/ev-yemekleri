'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import type { Address } from '@/types/database'
import type { CouponValidation, PriceSummary } from '@/types/cart'

// ── Kupon bileşeni ────────────────────────────────────────────────────────────
function CouponInput({
  subtotal,
  onApply,
  applied,
}: {
  subtotal:  number
  onApply:   (v: CouponValidation | null) => void
  applied:   CouponValidation | null
}) {
  const [code,    setCode]    = useState(applied?.code ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function validate() {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/orders/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        onApply(data)
      } else {
        setError(data.error ?? 'Geçersiz kupon')
        onApply(null)
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="coupon-applied">
        <div className="coupon-applied-info">
          <span className="coupon-tag">🎉 {applied.code}</span>
          <span className="coupon-desc">{applied.description}</span>
        </div>
        <button
          className="coupon-remove"
          onClick={() => { onApply(null); setCode('') }}
        >
          Kaldır
        </button>
        <style>{`
          .coupon-applied {
            display: flex; align-items: center; justify-content: space-between;
            background: #ECFDF5; border: 1.5px solid var(--green);
            border-radius: 10px; padding: 10px 14px;
          }
          .coupon-applied-info { display: flex; flex-direction: column; gap: 2px; }
          .coupon-tag { font-weight: 800; font-size: 13px; color: var(--green); }
          .coupon-desc { font-size: 11px; color: var(--gray); }
          .coupon-remove {
            font-size: 11.5px; font-weight: 700; color: #DC2626;
            background: none; border: none; cursor: pointer;
            font-family: 'DM Sans', sans-serif; text-decoration: underline;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="coupon-input-wrap">
      <div className="coupon-row">
        <input
          className={`coupon-inp ${error ? 'error' : ''}`}
          placeholder="Kupon kodu gir"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && validate()}
          maxLength={30}
        />
        <button
          className="coupon-btn"
          onClick={validate}
          disabled={loading || !code.trim()}
        >
          {loading ? '⏳' : 'Uygula'}
        </button>
      </div>
      {error && <div className="coupon-error">⚠️ {error}</div>}
      <style>{`
        .coupon-input-wrap { display: flex; flex-direction: column; gap: 6px; }
        .coupon-row { display: flex; gap: 8px; }
        .coupon-inp {
          flex: 1; padding: 10px 14px;
          border: 1.5px solid var(--gray-light); border-radius: 10px;
          font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          color: var(--brown); outline: none; background: var(--white);
          letter-spacing: 1px; font-weight: 700;
          transition: border-color 0.15s;
        }
        .coupon-inp:focus { border-color: var(--orange); }
        .coupon-inp.error { border-color: #DC2626; }
        .coupon-btn {
          padding: 10px 18px; background: var(--brown); color: white;
          border: none; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s; white-space: nowrap;
        }
        .coupon-btn:hover:not(:disabled) { background: var(--brown-mid); }
        .coupon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .coupon-error { font-size: 12px; color: #DC2626; }
      `}</style>
    </div>
  )
}

// ── Fiyat özeti ───────────────────────────────────────────────────────────────
function PriceSummaryCard({
  summary, coupon, credit, deliveryFee
}: {
  summary:     PriceSummary
  coupon:      CouponValidation | null
  credit:      number
  deliveryFee: number
}) {
  const discount     = coupon ? (coupon as any).discount_amount ?? 0 : 0
  const afterDisc    = Math.max(0, summary.subtotal - discount)
  const afterCredit  = Math.max(0, afterDisc + deliveryFee - credit)

  return (
    <div className="ps-card">
      <div className="ps-title">Sipariş Özeti</div>

      <div className="ps-rows">
        <div className="ps-row">
          <span>Ara toplam</span>
          <span>₺{summary.subtotal.toFixed(0)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="ps-row">
            <span>Teslimat</span>
            <span>₺{deliveryFee.toFixed(0)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="ps-row discount">
            <span>İndirim ({coupon!.code})</span>
            <span>−₺{discount.toFixed(0)}</span>
          </div>
        )}
        {credit > 0 && (
          <div className="ps-row discount">
            <span>Platform kredisi</span>
            <span>−₺{credit.toFixed(0)}</span>
          </div>
        )}
        <div className="ps-row total">
          <span>Toplam</span>
          <span>₺{afterCredit.toFixed(0)}</span>
        </div>
      </div>

      <div className="ps-note">
        ✅ Ödemeniz güvenli şekilde İyzico altyapısıyla işlenir.
      </div>

      <style>{`
        .ps-card {
          background: var(--white);
          border-radius: 14px; padding: 18px;
          box-shadow: 0 2px 12px rgba(74,44,14,0.07);
          border: 1px solid rgba(232,224,212,0.6);
          position: sticky; top: 80px;
        }
        .ps-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700; color: var(--brown);
          margin-bottom: 14px;
        }
        .ps-rows { display: flex; flex-direction: column; gap: 8px; }
        .ps-row {
          display: flex; justify-content: space-between;
          font-size: 13.5px; color: var(--brown);
        }
        .ps-row.discount { color: var(--green); font-weight: 600; }
        .ps-row.total {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: var(--orange);
          border-top: 1.5px solid var(--gray-light);
          padding-top: 10px; margin-top: 4px;
        }
        .ps-note {
          font-size: 11px; color: var(--gray);
          margin-top: 14px; line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

// ── Ana Checkout Sayfası ──────────────────────────────────────────────────────
export default function OdemePage() {
  const router              = useRouter()
  const { items, summary, chef_id, clear } = useCart()

  const [addresses,    setAddresses]    = useState<Address[]>([])
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null)
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [coupon,       setCoupon]       = useState<CouponValidation | null>(null)
  const [credit,       setCredit]       = useState(0)
  const [notes,        setNotes]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [userCredit,   setUserCredit]   = useState(0)

  // Sepet boşsa ana sayfaya yönlendir
  useEffect(() => {
    if (items.length === 0) router.replace('/kesif')
  }, [items.length, router])

  // Adresleri yükle
  useEffect(() => {
    fetch('/api/addresses')
      .then(r => r.json())
      .then(data => {
        setAddresses(data.addresses ?? [])
        const def = data.addresses?.find((a: Address) => a.is_default)
        if (def) setSelectedAddr(def.id)
      })
      .catch(() => {})

    // Kullanıcı kredisi
    fetch('/api/me')
      .then(r => r.json())
      .then(data => setUserCredit(data.platform_credit ?? 0))
      .catch(() => {})
  }, [])

  const discount     = coupon ? (coupon as any).discount_amount ?? 0 : 0
  const deliveryFee  = deliveryType === 'delivery' ? 15 : 0  // Örnek — aşçı bazlı yapılandırılabilir
  const totalAmount  = Math.max(0, summary.subtotal - discount + deliveryFee - credit)

  const canSubmit =
    items.length > 0 &&
    chef_id &&
    (deliveryType === 'pickup' || selectedAddr)

  async function handleSubmit() {
    if (!canSubmit || submitting) return

    setSubmitting(true)
    setError('')

    try {
      // 1. Sipariş oluştur
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chef_id,
          items: items.map(i => ({
            menu_item_id: i.menu_item_id,
            quantity:     i.quantity,
          })),
          delivery_type:  deliveryType,
          address_id:     deliveryType === 'delivery' ? selectedAddr : undefined,
          coupon_code:    coupon?.code,
          credit_amount:  credit,
          notes:          notes || undefined,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        setError(orderData.error ?? 'Sipariş oluşturulamadı.')
        setSubmitting(false)
        return
      }

      // 2. İyzico ödeme başlat
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderData.order_id }),
      })

      const payData = await payRes.json()

      if (!payRes.ok) {
        setError(payData.error ?? 'Ödeme başlatılamadı.')
        setSubmitting(false)
        return
      }

      // 3. İyzico formunu render et (İyzico sayfasına geç)
      router.push(`/odeme/iyzico?order_id=${orderData.order_id}&token=${payData.token}`)

    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="checkout-wrap">

      {/* Sol — Form */}
      <div className="checkout-form">

        {/* Teslimat Tipi */}
        <div className="co-section">
          <div className="co-section-title">Teslimat Yöntemi</div>
          <div className="delivery-opts">
            {(['delivery', 'pickup'] as const).map(type => (
              <button
                key={type}
                className={`delivery-opt ${deliveryType === type ? 'selected' : ''}`}
                onClick={() => setDeliveryType(type)}
                aria-pressed={deliveryType === type}
              >
                <span className="delivery-icon">
                  {type === 'delivery' ? '🛵' : '🚶'}
                </span>
                <div>
                  <div className="delivery-label">
                    {type === 'delivery' ? 'Kapıma Gelsin' : 'Gel-Al'}
                  </div>
                  <div className="delivery-sub">
                    {type === 'delivery'
                      ? `+₺${deliveryFee} teslimat`
                      : 'Ücretsiz · Aşçıdan teslim'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Adres Seçimi (teslimat seçildiyse) */}
        {deliveryType === 'delivery' && (
          <div className="co-section">
            <div className="co-section-title">Teslimat Adresi</div>
            {addresses.length === 0 ? (
              <div className="no-address">
                <span>📍 Kayıtlı adresiniz yok.</span>
                <a href="/adreslerim" className="add-address-link">Adres Ekle →</a>
              </div>
            ) : (
              <div className="address-list">
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    className={`address-opt ${selectedAddr === addr.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAddr(addr.id)}
                    aria-pressed={selectedAddr === addr.id}
                  >
                    <div className="addr-icon">
                      {addr.label === 'home' ? '🏠' : addr.label === 'work' ? '💼' : '📍'}
                    </div>
                    <div className="addr-info">
                      <div className="addr-label">
                        {addr.label === 'home' ? 'Ev' : addr.label === 'work' ? 'İş' : 'Diğer'}
                        {addr.is_default && (
                          <span className="addr-default">Varsayılan</span>
                        )}
                      </div>
                      <div className="addr-text">{addr.full_address}</div>
                    </div>
                    <div className={`addr-radio ${selectedAddr === addr.id ? 'checked' : ''}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kupon */}
        <div className="co-section">
          <div className="co-section-title">İndirim Kodu</div>
          <CouponInput
            subtotal={summary.subtotal}
            onApply={setCoupon}
            applied={coupon}
          />
        </div>

        {/* Platform Kredisi */}
        {userCredit > 0 && (
          <div className="co-section">
            <div className="co-section-title">
              Platform Kredisi
              <span className="credit-balance">₺{userCredit.toFixed(0)} bakiye</span>
            </div>
            <div className="credit-row">
              <label className="credit-toggle-label">
                <input
                  type="checkbox"
                  checked={credit > 0}
                  onChange={e => setCredit(e.target.checked ? Math.min(userCredit, totalAmount) : 0)}
                />
                <span>Kredimi kullan (₺{Math.min(userCredit, totalAmount).toFixed(0)})</span>
              </label>
            </div>
          </div>
        )}

        {/* Not */}
        <div className="co-section">
          <div className="co-section-title">Sipariş Notu <span className="optional">(isteğe bağlı)</span></div>
          <textarea
            className="co-notes"
            placeholder="Aşçıya özel bir isteğiniz var mı? (az tuz, extra sos, kapıdan bırak…)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={200}
            rows={3}
          />
          <div className="notes-count">{notes.length}/200</div>
        </div>

        {/* Hata */}
        {error && (
          <div className="co-error">
            ⚠️ {error}
          </div>
        )}

        {/* Gönder butonu */}
        <button
          className={`co-submit ${(!canSubmit || submitting) ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <><span className="co-spinner" /> Sipariş Oluşturuluyor…</>
          ) : (
            `Ödemeye Geç — ₺${totalAmount.toFixed(0)} →`
          )}
        </button>

        {!canSubmit && deliveryType === 'delivery' && !selectedAddr && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--orange)', marginTop: 6 }}>
            ↑ Lütfen bir teslimat adresi seçin
          </div>
        )}
      </div>

      {/* Sağ — Özet */}
      <div className="checkout-summary">
        {/* Sepet içeriği */}
        <div className="co-section" style={{ marginBottom: 0 }}>
          <div className="co-section-title">Siparişiniz</div>
          {items.map(item => (
            <div key={item.menu_item_id} className="co-item-row">
              <span className="co-item-qty">{item.quantity}×</span>
              <span className="co-item-name">{item.name}</span>
              <span className="co-item-price">₺{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <PriceSummaryCard
          summary={summary}
          coupon={coupon}
          credit={credit}
          deliveryFee={deliveryFee}
        />
      </div>

      <style>{`
        .checkout-wrap {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
          max-width: 960px;
          margin: 0 auto;
        }

        @media (max-width: 800px) {
          .checkout-wrap { grid-template-columns: 1fr; }
          .checkout-summary { order: -1; }
        }

        /* ── Bölüm ─────────────────────── */
        .co-section {
          background: var(--white);
          border-radius: 14px; padding: 18px 20px;
          box-shadow: 0 2px 12px rgba(74,44,14,0.06);
          border: 1px solid rgba(232,224,212,0.6);
          margin-bottom: 14px;
        }

        .co-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700; color: var(--brown);
          margin-bottom: 14px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .optional { font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--gray); font-weight: 400; }

        /* ── Teslimat seçenekleri ──────── */
        .delivery-opts { display: flex; gap: 10px; }

        .delivery-opt {
          flex: 1; padding: 14px; border-radius: 12px;
          border: 2px solid var(--gray-light);
          background: var(--white); cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          transition: all 0.15s; text-align: left;
          font-family: 'DM Sans', sans-serif;
        }

        .delivery-opt:hover { border-color: var(--orange); }

        .delivery-opt.selected {
          border-color: var(--orange);
          background: #FFF9F5;
          box-shadow: 0 0 0 3px rgba(232,98,42,0.12);
        }

        .delivery-icon { font-size: 24px; flex-shrink: 0; }

        .delivery-label { font-weight: 700; font-size: 13.5px; color: var(--brown); }
        .delivery-sub   { font-size: 11px; color: var(--gray); margin-top: 2px; }

        /* ── Adres listesi ────────────── */
        .no-address {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: var(--gray);
          background: var(--warm); padding: 12px 14px; border-radius: 10px;
        }

        .add-address-link {
          color: var(--orange); font-weight: 700; font-size: 12px; text-decoration: none;
        }

        .address-list { display: flex; flex-direction: column; gap: 8px; }

        .address-opt {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          border: 1.5px solid var(--gray-light); background: var(--white);
          cursor: pointer; display: flex; align-items: center; gap: 12px;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif; text-align: left;
        }

        .address-opt:hover { border-color: var(--orange); }

        .address-opt.selected {
          border-color: var(--green);
          background: #F0FDF4;
        }

        .addr-icon { font-size: 20px; flex-shrink: 0; }

        .addr-info { flex: 1; min-width: 0; }

        .addr-label {
          font-weight: 700; font-size: 13px; color: var(--brown);
          display: flex; align-items: center; gap: 6px; margin-bottom: 2px;
        }

        .addr-default {
          font-size: 10px; font-weight: 700;
          background: #ECFDF5; color: var(--green);
          padding: 1px 7px; border-radius: 20px;
        }

        .addr-text {
          font-size: 12px; color: var(--gray);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .addr-radio {
          width: 18px; height: 18px;
          border-radius: 50%; border: 2px solid var(--gray-light);
          flex-shrink: 0; transition: all 0.15s;
        }

        .addr-radio.checked {
          border-color: var(--green);
          background: var(--green);
          box-shadow: inset 0 0 0 3px white;
        }

        /* ── Kredi ────────────────────── */
        .credit-balance {
          font-family: 'DM Sans', sans-serif; font-size: 12px;
          font-weight: 700; color: var(--green);
        }

        .credit-row { display: flex; align-items: center; gap: 8px; }

        .credit-toggle-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--brown); cursor: pointer;
          font-weight: 500;
        }

        .credit-toggle-label input { accent-color: var(--green); width: 16px; height: 16px; }

        /* ── Not ──────────────────────── */
        .co-notes {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid var(--gray-light); border-radius: 10px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: var(--brown); background: var(--warm); outline: none;
          resize: none; line-height: 1.5; transition: border-color 0.15s;
        }

        .co-notes:focus { border-color: var(--orange); background: var(--white); }
        .notes-count { font-size: 10.5px; color: var(--gray); text-align: right; margin-top: 4px; }

        /* ── Hata ─────────────────────── */
        .co-error {
          background: #FEF2F2; border: 1.5px solid #FECACA;
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: #DC2626; margin-bottom: 12px;
        }

        /* ── Gönder ───────────────────── */
        .co-submit {
          width: 100%; padding: 16px;
          background: var(--orange); color: white;
          border: none; border-radius: 14px;
          font-size: 16px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }

        .co-submit:hover:not(.disabled) {
          background: #d4541e;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(232,98,42,0.4);
        }

        .co-submit.disabled { opacity: 0.65; cursor: not-allowed; }

        .co-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Sipariş listesi (özet) ──── */
        .co-item-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; margin-bottom: 8px;
        }

        .co-item-qty { color: var(--gray); font-weight: 700; flex-shrink: 0; }
        .co-item-name { flex: 1; color: var(--brown); }
        .co-item-price { font-weight: 700; color: var(--orange); flex-shrink: 0; }

        .checkout-summary { display: flex; flex-direction: column; gap: 14px; }
      `}</style>
    </div>
  )
}
