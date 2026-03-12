// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

export function CartButton() {
  const [open, setOpen] = useState(false)
  const { items, itemCount, updateQty, removeItem, priceSummary } = useCart()
  const router = useRouter()

  // ESC ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Sepet ikonu */}
      <button
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 flex items-center justify-center bg-[#F5EDD8] border border-[#E8E0D4] rounded-xl hover:border-[#E8622A] hover:bg-[#FFF5EF] transition"
        aria-label="Sepeti aç"
      >
        🛒
        {itemCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#E8622A] text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white">
            {itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[998]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[999] shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D4] flex-shrink-0">
          <h2 className="font-bold text-[#4A2C0E] text-lg">
            🛒 Sepetim {itemCount > 0 && <span className="text-[#E8622A]">({itemCount})</span>}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FAF6EF] hover:bg-[#E8E0D4] text-[#8A7B6B] hover:text-[#4A2C0E] transition font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Drawer İçerik */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <div className="text-6xl">🛒</div>
              <div className="font-bold text-[#4A2C0E] text-lg">Sepetiniz boş</div>
              <div className="text-sm text-[#8A7B6B]">Aşçıların menülerini keşfederek sipariş verin</div>
              <Link
                href="/kesif"
                onClick={() => setOpen(false)}
                className="bg-[#E8622A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#d4541e] transition"
              >
                📍 Keşfet
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item: any) => (
                <div key={item.menu_item_id} className="flex gap-3 items-start pb-3 border-b border-[#E8E0D4] last:border-0">
                  <div className="w-14 h-14 rounded-xl bg-[#F5EDD8] flex items-center justify-center text-2xl flex-shrink-0">
                    {item.photo || '🍽️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#4A2C0E] text-sm truncate">{item.name}</div>
                    <div className="text-xs text-[#8A7B6B]">👩‍🍳 {item.chef_name}</div>
                    <div className="text-[#E8622A] font-black mt-1">₺{(item.price * item.quantity).toFixed(0)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => item.quantity <= 1 ? removeItem(item.menu_item_id) : updateQty(item.menu_item_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-[#F5EDD8] border border-[#E8E0D4] flex items-center justify-center text-sm font-bold text-[#4A2C0E] hover:border-[#E8622A] transition"
                    >
                      {item.quantity <= 1 ? '🗑️' : '−'}
                    </button>
                    <span className="font-bold text-[#4A2C0E] w-4 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.menu_item_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-[#E8622A] flex items-center justify-center text-sm font-bold text-white hover:bg-[#d4541e] transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#E8E0D4] flex-shrink-0 bg-white">
            <div className="bg-[#F5EDD8] rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-[#4A2C0E]">
                <span>Ara Toplam</span>
                <span>₺{priceSummary.subtotal?.toFixed(0) ?? 0}</span>
              </div>
              {priceSummary.deliveryFee > 0 && (
                <div className="flex justify-between text-sm text-[#4A2C0E]">
                  <span>Teslimat</span>
                  <span>₺{priceSummary.deliveryFee.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-[#E8622A] text-lg border-t border-[#E8E0D4] pt-2">
                <span>Toplam</span>
                <span>₺{priceSummary.total?.toFixed(0) ?? 0}</span>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); router.push('/odeme') }}
              className="w-full bg-[#E8622A] text-white font-bold py-4 rounded-xl hover:bg-[#d4541e] transition text-sm"
            >
              🛒 Siparişi Tamamla — ₺{priceSummary.total?.toFixed(0) ?? 0}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-2 border border-[#E8E0D4] text-[#8A7B6B] font-semibold py-3 rounded-xl hover:bg-[#FAF6EF] transition text-sm"
            >
              Alışverişe Devam Et
            </button>
          </div>
        )}
      </div>
    </>
  )
}