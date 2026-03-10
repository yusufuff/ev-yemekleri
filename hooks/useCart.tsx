/**
 * useCart — Sepet state yönetimi
 *
 * Özellikler:
 * - Tek aşçı kısıtı (farklı aşçıdan ürün ekleyince uyarı)
 * - localStorage persist (sayfa yenileme sonrası devam)
 * - Stok üst sınırı
 * - Optimistik UI (anında güncelleme)
 */
'use client'

import {
  createContext, useContext, useReducer, useEffect,
  useCallback, useMemo, type ReactNode
} from 'react'
import type { CartItem, CartState, PriceSummary } from '@/types/cart'

// ── Aksiyonlar ────────────────────────────────────────────────────────────────

type CartAction =
  | { type: 'ADD';      item: CartItem }
  | { type: 'REMOVE';   menu_item_id: string }
  | { type: 'SET_QTY';  menu_item_id: string; qty: number }
  | { type: 'SET_NOTE'; menu_item_id: string; note: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD';     state: CartState }

// ── Reducer ───────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case 'LOAD':
      return action.state

    case 'CLEAR':
      return { items: [], chef_id: null }

    case 'ADD': {
      const { item } = action

      // Farklı aşçıdan ürün → sepeti temizle ve yeniden başla
      if (state.chef_id && state.chef_id !== item.chef_id) {
        return { items: [{ ...item, quantity: 1 }], chef_id: item.chef_id }
      }

      const existing = state.items.find(i => i.menu_item_id === item.menu_item_id)

      if (existing) {
        // Stok kontrolü
        const maxQty = item.remaining_stock ?? 99
        const newQty = Math.min(existing.quantity + 1, maxQty)
        return {
          ...state,
          items: state.items.map(i =>
            i.menu_item_id === item.menu_item_id
              ? { ...i, quantity: newQty }
              : i
          ),
        }
      }

      return {
        chef_id: item.chef_id,
        items:   [...state.items, { ...item, quantity: 1 }],
      }
    }

    case 'REMOVE':
      return {
        ...state,
        items:   state.items.filter(i => i.menu_item_id !== action.menu_item_id),
        chef_id: state.items.length <= 1 ? null : state.chef_id,
      }

    case 'SET_QTY': {
      if (action.qty <= 0) {
        return {
          ...state,
          items:   state.items.filter(i => i.menu_item_id !== action.menu_item_id),
          chef_id: state.items.length <= 1 ? null : state.chef_id,
        }
      }

      return {
        ...state,
        items: state.items.map(i => {
          if (i.menu_item_id !== action.menu_item_id) return i
          const maxQty = i.remaining_stock ?? 99
          return { ...i, quantity: Math.min(action.qty, maxQty) }
        }),
      }
    }

    case 'SET_NOTE':
      return {
        ...state,
        items: state.items.map(i =>
          i.menu_item_id === action.menu_item_id
            ? { ...i, note: action.note }
            : i
        ),
      }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface CartContextValue {
  items:      CartItem[]
  chef_id:    string | null
  itemCount:  number
  summary:    PriceSummary

  addItem:    (item: CartItem) => void
  removeItem: (menu_item_id: string) => void
  setQty:     (menu_item_id: string, qty: number) => void
  setNote:    (menu_item_id: string, note: string) => void
  clear:      () => void

  // Farklı aşçı uyarısı
  differentChefWarning: string | null
  setDifferentChefWarning: (msg: string | null) => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'ev_yemekleri_cart'

const EMPTY_SUMMARY: PriceSummary = {
  subtotal: 0, delivery_fee: 0, discount: 0,
  credit_used: 0, total: 0, platform_fee: 0, chef_earning: 0,
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], chef_id: null })
  const [diffWarning, setDiffWarning] = useReducer(
    (_: string | null, v: string | null) => v, null
  )

  // localStorage'dan yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as CartState
        if (saved.items?.length) dispatch({ type: 'LOAD', state: saved })
      }
    } catch {}
  }, [])

  // localStorage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const addItem = useCallback((item: CartItem) => {
    // Farklı aşçı kontrolü
    if (state.chef_id && state.chef_id !== item.chef_id && state.items.length > 0) {
      setDiffWarning(
        `Sepetinizde ${state.items[0]?.chef_name} adlı aşçının ürünleri var. ` +
        `Yeni aşçıyı eklerseniz mevcut sepet temizlenecek.`
      )
      return
    }
    dispatch({ type: 'ADD', item })
  }, [state.chef_id, state.items])

  const addItemForce = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD', item })
    setDiffWarning(null)
  }, [])

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', menu_item_id: id })
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    dispatch({ type: 'SET_QTY', menu_item_id: id, qty })
  }, [])

  const setNote = useCallback((id: string, note: string) => {
    dispatch({ type: 'SET_NOTE', menu_item_id: id, note })
  }, [])

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  // Fiyat özeti (kupon/kredi checkout'ta uygulanır)
  const summary = useMemo<PriceSummary>(() => {
    const subtotal = state.items.reduce(
      (s, i) => s + i.price * i.quantity, 0
    )
    const platform_fee = Math.round(subtotal * 0.10 * 100) / 100
    const chef_earning = subtotal - platform_fee
    return {
      subtotal,
      delivery_fee: 0,
      discount:     0,
      credit_used:  0,
      total:        subtotal,
      platform_fee,
      chef_earning,
    }
  }, [state.items])

  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items:      state.items,
      chef_id:    state.chef_id,
      itemCount,
      summary,
      addItem,
      removeItem,
      setQty,
      setNote,
      clear,
      differentChefWarning: diffWarning,
      setDifferentChefWarning: setDiffWarning,
    }}>
      {children}

      {/* Farklı aşçı uyarı modalı */}
      {diffWarning && (
        <div className="cart-diff-overlay" role="dialog" aria-modal>
          <div className="cart-diff-modal">
            <div className="cart-diff-icon">⚠️</div>
            <div className="cart-diff-text">{diffWarning}</div>
            <div className="cart-diff-actions">
              <button
                className="cart-diff-cancel"
                onClick={() => setDiffWarning(null)}
              >
                İptal
              </button>
              <button
                className="cart-diff-confirm"
                onClick={() => {
                  // Son eklenen item'ı yeniden dispatch et (force)
                  // Bu işlem için son item'ı state'te tutmak gerekirdi
                  // Basitlik için: clear + kullanıcı tekrar ekler
                  dispatch({ type: 'CLEAR' })
                  setDiffWarning(null)
                }}
              >
                Sepeti Temizle
              </button>
            </div>
          </div>
          <style>{`
            .cart-diff-overlay {
              position: fixed; inset: 0; z-index: 9999;
              background: rgba(74,44,14,0.5);
              display: flex; align-items: center; justify-content: center;
              animation: fade-in 0.15s;
            }
            @keyframes fade-in { from{opacity:0} to{opacity:1} }
            .cart-diff-modal {
              background: white; border-radius: 16px; padding: 28px;
              max-width: 360px; width: 90%; text-align: center;
              box-shadow: 0 8px 40px rgba(74,44,14,0.25);
              animation: slide-up 0.2s cubic-bezier(0.34,1.56,0.64,1);
            }
            @keyframes slide-up {
              from{transform:translateY(20px);opacity:0}
              to{transform:translateY(0);opacity:1}
            }
            .cart-diff-icon { font-size: 36px; margin-bottom: 12px; }
            .cart-diff-text {
              font-size: 13.5px; color: var(--brown); line-height: 1.6;
              margin-bottom: 20px;
            }
            .cart-diff-actions { display: flex; gap: 10px; }
            .cart-diff-cancel, .cart-diff-confirm {
              flex: 1; padding: 10px; border-radius: 10px;
              font-size: 13px; font-weight: 700;
              font-family: 'DM Sans',sans-serif; border: none; cursor: pointer;
              transition: all 0.15s;
            }
            .cart-diff-cancel {
              background: var(--warm); color: var(--brown);
              border: 1.5px solid var(--gray-light);
            }
            .cart-diff-confirm {
              background: var(--orange); color: white;
            }
            .cart-diff-confirm:hover { background: #d4541e; }
          `}</style>
        </div>
      )}
    </CartContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
