// @ts-nocheck
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
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const discount = couponApplied ? Math.floor((summary.total || summary.subtotal) * 0.1) : 0
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
    console.log('SEPET:', JSON.stringify(items))
    console.log('CHEF_ID:', items[0]?.chef_id)
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('Lütfen teslimat adresinizi girin.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chef_id: items[0]?.chef_id ?? cartChefId,
          chef_name: chefName,
          delivery_type: deliveryType,
          address,
          note,
          total_amount: summary.total || summary.subtotal,
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Bir hata olustu.')
        return
      }
      clear()
      window.location.href = '/siparis-basari?order_id=' + data.order.id
    } catch {
      alert('Bir hata olustu, tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/kesif" style={{ color: '#8A7B6B', textDecoration: 'none', fontSize: 13 }}>← Geri</Link>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Sipariş Özeti</h1>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
          {['Teslimat', 'Ödeme'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', paddingBottom: 8, borderBottom: `2px solid ${step > i ? '#E8622A' : '#E8E0D4'}`, color: step > i ? '#E8622A' : '#8A7B6B', fontSize: 13, fontWeight: 600 }}>
              {i + 1}. {s}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
              <span>₺{Math.max(0, (summary.total || summary.subtotal) - discount).toFixed(0)}</span>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 14 }}>Teslimat Yöntemi</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[['delivery', '🚵', 'Teslimat'], ['pickup', '🚶', 'Gel-Al']].map(([val, icon, label]) => (
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

          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:12 }}>🏷 Kupon Kodu</div>
            {couponApplied ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#ECFDF5', borderRadius:8, padding:'10px 14px' }}>
                <span style={{ color:'#3D6B47', fontWeight:700, fontSize:13 }}>✅ "DEMO10" — %10 indirim uygulandı!</span>
                <button onClick={() => { setCouponApplied(false); setCoupon('') }} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:18 }}>✕</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:10 }}>
                <input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError('') }}
                  placeholder="Kupon kodunuzu girin"
                  style={{ flex:1, padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit' }} />
                <button onClick={() => {
                  if (coupon === 'DEMO10') { setCouponApplied(true); setCouponError('') }
                  else setCouponError('Geçersiz kupon kodu')
                }} style={{ padding:'10px 16px', background:'#E8622A', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Uygula
                </button>
              </div>
            )}
            {couponError && <div style={{ fontSize:12, color:'#DC2626', marginTop:6 }}>{couponError}</div>}
          </div>

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