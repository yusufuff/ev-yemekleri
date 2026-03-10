'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

interface CartDrawerProps {
  open:    boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter()
  const { items, updateQty, removeItem, priceSummary, itemCount } = useCart()

  const handleCheckout = () => {
    onClose()
    router.push('/odeme')
  }

  const isEmpty = items.length === 0

  return (
    <MobileDrawer
      open={open}
      onClose={onClose}
      title={`Sepetim${itemCount > 0 ? ` (${itemCount})` : ''}`}
      variant="auto"
      maxHeight="90vh"
    >
      {isEmpty ? (
        <div className="cd-empty">
          <div className="cd-empty-icon">🛒</div>
          <div className="cd-empty-title">Sepetiniz boş</div>
          <div className="cd-empty-sub">Aşçıların menülerini keşfederek sipariş verin</div>
          <button className="cd-btn-primary" onClick={onClose}>🔍 Keşfet</button>
        </div>
      ) : (
        <>
          <div className="cd-items">
            {items.map(item => (
              <div key={item.id} className="cd-item">
                <div className="cd-item-img">{item.image_emoji ?? '🍽️'}</div>
                <div className="cd-item-info">
                  <div className="cd-item-name">{item.name}</div>
                  <div className="cd-item-chef">👩‍🍳 {item.chef_name}</div>
                  {item.note && <div className="cd-item-note">💬 {item.note}</div>}
                  <div className="cd-item-price">₺{(item.price * item.quantity).toFixed(0)}</div>
                </div>
                <div className="cd-qty">
                  <button
                    className="cd-qty-btn"
                    onClick={() => item.quantity <= 1 ? removeItem(item.id) : updateQty(item.id, item.quantity - 1)}
                    aria-label="Azalt"
                  >
                    {item.quantity <= 1 ? '🗑️' : '−'}
                  </button>
                  <span className="cd-qty-num">{item.quantity}</span>
                  <button
                    className="cd-qty-btn cd-qty-btn--plus"
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    aria-label="Artır"
                    disabled={item.quantity >= (item.max_qty ?? 20)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cd-summary">
            <div className="cd-sum-row"><span>Ara Toplam</span><span>₺{priceSummary.subtotal.toFixed(0)}</span></div>
            {priceSummary.deliveryFee > 0 && (
              <div className="cd-sum-row"><span>Teslimat</span><span>₺{priceSummary.deliveryFee.toFixed(0)}</span></div>
            )}
            {priceSummary.discount > 0 && (
              <div className="cd-sum-row cd-sum-row--discount"><span>İndirim</span><span>−₺{priceSummary.discount.toFixed(0)}</span></div>
            )}
            <div className="cd-sum-total">
              <span>Toplam</span><span>₺{priceSummary.total.toFixed(0)}</span>
            </div>
          </div>

          <div className="cd-footer">
            <button className="cd-btn-primary" onClick={handleCheckout}>
              🛒 Siparişi Tamamla — ₺{priceSummary.total.toFixed(0)}
            </button>
            <button className="cd-btn-ghost" onClick={onClose}>Alışverişe Devam Et</button>
          </div>
        </>
      )}

      <style>{`
        .cd-empty { text-align:center; padding:32px 16px; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .cd-empty-icon { font-size:48px; margin-bottom:4px; }
        .cd-empty-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--brown); }
        .cd-empty-sub { font-size:13px; color:var(--gray); max-width:220px; line-height:1.5; }
        .cd-items { display:flex; flex-direction:column; gap:12px; margin-bottom:16px; }
        .cd-item { display:flex; gap:12px; align-items:flex-start; padding-bottom:12px; border-bottom:1px solid var(--gray-light); }
        .cd-item:last-child { border-bottom:none; }
        .cd-item-img { width:52px; height:52px; border-radius:10px; background:var(--warm); display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
        .cd-item-info { flex:1; min-width:0; }
        .cd-item-name { font-weight:700; font-size:13.5px; color:var(--brown); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
        .cd-item-chef { font-size:11px; color:var(--gray); }
        .cd-item-note { font-size:11px; color:var(--gray); font-style:italic; margin-top:2px; }
        .cd-item-price { font-family:'Playfair Display',serif; font-size:15px; font-weight:700; color:var(--orange); margin-top:4px; }
        .cd-qty { display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .cd-qty-btn { width:30px; height:30px; border-radius:8px; background:var(--warm); border:1.5px solid var(--gray-light); font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--brown); transition:all 0.15s; font-family:'DM Sans',sans-serif; -webkit-tap-highlight-color:transparent; }
        .cd-qty-btn:active { transform:scale(0.92); }
        .cd-qty-btn--plus { background:var(--orange); color:white; border-color:var(--orange); }
        .cd-qty-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .cd-qty-num { min-width:20px; text-align:center; font-weight:700; font-size:14px; color:var(--brown); }
        .cd-summary { background:var(--warm); border-radius:12px; padding:12px 14px; margin-bottom:14px; display:flex; flex-direction:column; gap:7px; }
        .cd-sum-row { display:flex; justify-content:space-between; font-size:13px; color:var(--brown); }
        .cd-sum-row--discount { color:var(--green); font-weight:600; }
        .cd-sum-total { display:flex; justify-content:space-between; font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--orange); border-top:1.5px solid var(--gray-light); padding-top:8px; margin-top:4px; }
        .cd-footer { display:flex; flex-direction:column; gap:8px; }
        .cd-btn-primary { display:block; padding:14px; background:var(--orange); color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; text-align:center; font-family:'DM Sans',sans-serif; transition:all 0.2s; -webkit-tap-highlight-color:transparent; }
        .cd-btn-primary:active { transform:scale(0.98); }
        .cd-btn-ghost { display:block; padding:11px; background:transparent; color:var(--gray); border:1.5px solid var(--gray-light); border-radius:12px; font-size:13px; font-weight:600; cursor:pointer; text-align:center; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
      `}</style>
    </MobileDrawer>
  )
}
