'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

export default function OdemePage() {
  const router = useRouter()
  const cart = useCart()
  const { items, summary: rawSummary, clear } = cart
  const summary = rawSummary ?? { subtotal: 0, delivery_fee: 0, discount: 0, total: 0 }

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', marginBottom: 8 }}>Sepetiniz boş</div>
          <Link href="/kesif" style={{ display: 'inline-block', padding: '12px 24px', background: '#E8622A', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700, marginTop: 8 }}>
            Menülere Göz At →
          </Link>
        </div>
      </div>
    )
  }

  const chefName = items[0]?.chef_name ?? 'Aşçı'

  const handleOrder = async () => {
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('Lütfen teslimat adresinizi girin.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chef_id: items[0]?.chef_id,
          chef_name: chefName,
          delivery_type: deliveryType,
          address,
          note,
          total_amount: summary.total || summary.subtotal,
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        }),
      })
      const data = await res.json()
      clear()
      router.push('/siparis-basari?order_id=' + data.order.id)
    } catch {
      alert('Bir hata oluştu, tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/kesif" style={{ color: '#8A7B6B', textDecoration: 'none', fontSize: 13 }}>← Geri</Link>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Sipariş Özeti</h1>
        </div>

        {/* Adımlar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
          {['Teslimat', 'Ödeme'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', paddingBottom: 8, borderBottom: `2px solid ${step > i ? '#E8622A' : '#E8E0D4'}`, color: step > i ? '#E8622A' : '#8A7B6B', fontSize: 13, fontWeight: 600 }}>
              {i + 1}. {s}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Sipariş Özeti */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 12 }}>👩‍🍳 {chefName}</div>
            {items.map(item => (
              <div key={item.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4A2C0E', padding: '6px 0', borderBottom: '1px solid #F5EDD8' }}>
                <span>{item.name} ×{item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₺{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#E8622A' }}>
              <span>Toplam</span>
              <span>₺{(summary.total || summary.subtotal).toFixed(0)}</span>
            </div>
          </div>

          {/* Teslimat Seçimi */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 14 }}>Teslimat Yöntemi</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[['delivery', '🛵', 'Teslimat'], ['pickup', '🚶', 'Gel-Al']].map(([val, icon, label]) => (
                <button key={val} onClick={() => setDeliveryType(val as any)} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${deliveryType === val ? '#E8622A' : '#E8E0D4'}`,
                  background: deliveryType === val ? '#FEF3EC' : 'white',
                  color: deliveryType === val ? '#E8622A' : '#4A2C0E',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {deliveryType === 'delivery' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Teslimat Adresi *</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Mahalle, cadde, sokak, bina no, daire…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 6 }}>Sipariş Notu (opsiyonel)</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Örn: Az acılı olsun"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Ödeme - mock (direkt sipariş ver) */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 14 }}>Ödeme Yöntemi</div>
            <div style={{ background: '#F5EDD8', borderRadius: 10, padding: '12px 14px', border: '2px solid #E8622A', fontSize: 13, color: '#4A2C0E', marginBottom: 14 }}>
              💳 Kredi/Banka Kartı (Demo Mod)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[['Kart No', '4242 4242 4242 4242'], ['Son Kullanma', '12/28'], ['CVV', '123'], ['Kart Sahibi', 'Test User']].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#7A4A20', marginBottom: 4 }}>{label}</div>
                  <input defaultValue={val} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', color: '#8A7B6B' }} readOnly />
                </div>
              ))}
            </div>
          </div>

          {/* Sipariş Ver */}
          <button
            onClick={handleOrder}
            disabled={loading}
            style={{
              width: '100%', padding: '16px 0', background: loading ? '#F28B5E' : '#E8622A',
              color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? '⏳ İşleniyor…' : `🛒 Siparişi Onayla — ₺${(summary.total || summary.subtotal).toFixed(0)}`}
          </button>
        </div>
      </div>
    </div>
  )
}