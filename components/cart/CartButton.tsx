// @ts-nocheck
/**
 * CartButton — Header'da gösterilen sepet ikonu ve badge.
 * Drawer'ı açar/kapatır.
 */
'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function CartButton() {
  const [open, setOpen] = useState(false)
  const { itemCount }   = useCart()

  return (
    <>
      <button
        className="cart-btn"
        onClick={() => setOpen(true)}
        aria-label={`Sepet${itemCount > 0 ? ` (${itemCount} ürün)` : ''}`}
      >
        <span className="cart-btn-icon">🛒</span>
        {itemCount > 0 && (
          <span className="cart-btn-badge" aria-live="polite">
            {itemCount}
          </span>
        )}
      </button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />

      <style>{`
        .cart-btn {
          position: relative;
          width: 40px; height: 40px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .cart-btn:hover {
          border-color: var(--orange);
          background: #FFF5EF;
        }

        .cart-btn-icon { font-size: 18px; }

        .cart-btn-badge {
          position: absolute;
          top: -6px; right: -6px;
          background: var(--orange);
          color: white;
          font-size: 10px;
          font-weight: 800;
          font-family: 'DM Sans', sans-serif;
          min-width: 18px; height: 18px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--cream);
          animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes badge-pop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </>
  )
}
