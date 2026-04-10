// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function OdemePage() {
  const router = useRouter()
  const cart   = useCart()
  const { items, summary: rawSummary, clear } = cart
  const summary = rawSummary ?? { subtotal: 0, delivery_fee: 0, discount: 0, total: 0 }

  const [deliveryType,   setDeliveryType]   = useState('delivery')
  const [address,        setAddress]        = useState('')
  const [note,           setNote]           = useState('')
  const [loading,        setLoading]        = useState(false)
  const [coupon,         setCoupon]         = useState('')
  const [couponApplied,  setCouponApplied]  = useState(false)
  const [couponError,    setCouponError]    = useState('')
  const [couponLoading,  setCouponLoading]  = useState(false)
  const [appliedCoupon,  setAppliedCoupon]  = useState<any>(null)
  const [step,           setStep]           = useState(1)
  const [iyzicoContent,  setIyzicoContent]  = useState<string | null>(null)

  // Platform kredisi
  const [platformCredit, setPlatformCredit] = useState(0)
  const [useCredit,      setUseCredit]      = useState(false)
  const [creditLoading,  setCreditLoading]  = useState(true)

  // Kayıtlı adresler
  const [savedAddresses,    setSavedAddresses]    = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddress,    setShowNewAddress]    = useState(false)
  const [addressesLoading,  setAddressesLoading]  = useState(true)

  // Aşçı konumu
  const [chefLocation, setChefLocation] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/credit').then(r => r.json()).then(d => {
      setPlatformCredit(d.credit ?? 0)
      setCreditLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!items[0]?.chef_id) return
    const supabase = getSupabaseBrowserClient()
    supabase.from('chef_profiles').select('location_approx').eq('id', items[0].chef_id).single()
      .then(({ data }) => { if (data?.location_approx) setChefLocation(data.location_approx) })
  }, [items])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { setAddressesLoading(false); setShowNewAddress(true); return }
      const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', data.user.id)
        .order('is_default', { ascending: false }).order('created_at', { ascending: false })
      if (addrs && addrs.length > 0) {
        setSavedAddresses(addrs)
        const defaultAddr = addrs.find(a => a.is_default) ?? addrs[0]
        setSelectedAddressId(defaultAddr.id)
        setAddress(defaultAddr.full_address)
        setShowNewAddress(false)
      } else { setShowNewAddress(true) }
      setAddressesLoading(false)
    })
  }, [])

  // iyzico form inject
  useEffect(() => {
    if (!iyzicoContent) return
    const script = document.createElement('script')
    script.innerHTML = iyzicoContent.replace(/<script[^>]*>|<\/script>/gi, '')
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [iyzicoContent])

  const handleAddressSelect = (addr: any) => {
    setSelectedAddressId(addr.id)
    setAddress(addr.full_address)
    setShowNewAddress(false)
  }

  const subtotal       = summary.total || summary.subtotal
  const couponDiscount = couponApplied && appliedCoupon ? (appliedCoupon.discount_amount ?? 0) : 0
  const creditDiscount = useCredit ? Math.min(platformCredit, Math.max(0, subtotal - couponDiscount)) : 0
  const finalTotal     = Math.max(0, subtotal - couponDiscount - creditDiscount)

  if (items.length === 0 && !iyzicoContent) {
    return (
      <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🛒</div>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:700, color:'#4A2C0E', marginBottom:8 }}>Sepetiniz boş</div>
          <Link href="/kesif" style={{ display:'inline-block', padding:'12px 24px', background:'#E8622A', color:'white', borderRadius:12, textDecoration:'none', fontWeight:700, marginTop:8 }}>Menülere Göz At →</Link>
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
      // 1. Siparişi oluştur
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chef_id:         items[0]?.chef_id,
          chef_name:       chefName,
          delivery_type:   deliveryType,
          address,
          note,
          total_amount:    finalTotal,
          discount_amount: couponDiscount + creditDiscount,
          coupon_code:     appliedCoupon?.code,
          credit_used:     creditDiscount,
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, menu_item_id: i.menu_item_id })),
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) { alert(orderData.error ?? 'Bir hata oluştu.'); return }

      const orderId = orderData.order?.id
      if (!orderId) { alert('Sipariş oluşturulamadı.'); return }

      // 2. iyzico ödeme formunu başlat
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const payData = await payRes.json()

      if (!payRes.ok || !payData.checkout_form_content) {
        // iyzico başarısız — demo modda devam et
        console.warn('iyzico başlatılamadı:', payData.error)
        clear()
        window.location.href = '/siparis-basari?order_id=' + orderId
        return
      }

      // 3. iyzico formunu göster
      clear()
      setIyzicoContent(payData.checkout_form_content)
      setStep(2)

    } catch (e) {
      console.error(e)
      alert('Bir hata oluştu, tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/orders/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.trim(), subtotal: summary.subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({ ...data, code: coupon.trim() })
        setCouponApplied(true)
      } else { setCouponError(data.error ?? 'Geçersiz kupon kodu') }
    } catch { setCouponError('Bağlantı hatası') }
    finally { setCouponLoading(false) }
  }

  // iyzico formu göster
  if (iyzicoContent) {
    return (
      <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>Güvenli Ödeme</h1>
            <span style={{ fontSize:20 }}>🔒</span>
          </div>
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div id="iyzipay-checkout-form" className="responsive"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px' }}>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <Link href="/kesif" style={{ color:'#8A7B6B', textDecoration:'none', fontSize:13 }}>← Geri</Link>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>Sipariş Özeti</h1>
        </div>

        <div style={{ display:'flex', gap:0, marginBottom:24 }}>
          {['Teslimat', 'Ödeme'].map((s, i) => (
            <div key={i} style={{ flex:1, textAlign:'center', paddingBottom:8, borderBottom:`2px solid ${step > i ? '#E8622A' : '#E8E0D4'}`, color: step > i ? '#E8622A' : '#8A7B6B', fontSize:13, fontWeight:600 }}>
              {i+1}. {s}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Sipariş özeti */}
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:12 }}>👩‍🍳 {chefName}</div>
            {items.map(item => (
              <div key={item.menu_item_id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#4A2C0E', padding:'6px 0', borderBottom:'1px solid #F5EDD8' }}>
                <span>{item.name} ×{item.quantity}</span>
                <span style={{ fontWeight:600 }}>₺{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            {couponDiscount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#3D6B47', padding:'6px 0', fontWeight:600 }}>
                <span>🏷️ Kupon indirimi</span><span>-₺{couponDiscount.toFixed(0)}</span>
              </div>
            )}
            {creditDiscount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#8B5CF6', padding:'6px 0', fontWeight:600 }}>
                <span>🎁 Platform kredisi</span><span>-₺{creditDiscount.toFixed(0)}</span>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:'#E8622A' }}>
              <span>Toplam</span><span>₺{finalTotal.toFixed(0)}</span>
            </div>
          </div>

          {/* Teslimat */}
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:14 }}>Teslimat Yöntemi</div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              {[['delivery','🛵','Teslimat'],['pickup','🚶','Gel-Al']].map(([val, icon, label]) => (
                <button key={val} onClick={() => setDeliveryType(val)} style={{
                  flex:1, padding:'12px 8px', borderRadius:10, cursor:'pointer',
                  border:`2px solid ${deliveryType === val ? '#E8622A' : '#E8E0D4'}`,
                  background: deliveryType === val ? '#FEF3EC' : 'white',
                  color: deliveryType === val ? '#E8622A' : '#4A2C0E',
                  fontSize:13, fontWeight:700, fontFamily:'inherit',
                }}>{icon} {label}</button>
              ))}
            </div>

            {deliveryType === 'pickup' && (
              <div style={{ background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#3D6B47', marginBottom:4 }}>📍 Aşçının Konumu</div>
                <div style={{ fontSize:13, color:'#4A2C0E', fontWeight:600 }}>{chefLocation ?? 'Konum bilgisi alınıyor...'}</div>
                <div style={{ fontSize:11, color:'#8A7B6B', marginTop:4 }}>Siparişiniz hazır olduğunda aşçı size bilgi verecek.</div>
              </div>
            )}

            {deliveryType === 'delivery' && (
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20' }}>Teslimat Adresi *</label>
                  {savedAddresses.length > 0 && (
                    <Link href="/adreslerim" style={{ fontSize:11, color:'#E8622A', textDecoration:'none', fontWeight:600 }}>+ Yeni Adres Ekle</Link>
                  )}
                </div>

                {addressesLoading ? (
                  <div style={{ height:60, background:'#F5EDD8', borderRadius:10 }} />
                ) : savedAddresses.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                    {savedAddresses.map(addr => (
                      <div key={addr.id} onClick={() => handleAddressSelect(addr)} style={{
                        padding:'12px 14px', borderRadius:10, cursor:'pointer',
                        border:`2px solid ${selectedAddressId === addr.id ? '#E8622A' : '#E8E0D4'}`,
                        background: selectedAddressId === addr.id ? '#FEF3EC' : 'white',
                        display:'flex', alignItems:'flex-start', gap:10,
                      }}>
                        <div style={{ fontSize:20, flexShrink:0 }}>
                          {addr.label === 'Ev' ? '🏠' : addr.label === 'İş' ? '🏢' : '📍'}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'#4A2C0E' }}>{addr.label || 'Adres'}</span>
                            {addr.is_default && <span style={{ fontSize:10, background:'#E8622A', color:'white', padding:'1px 6px', borderRadius:10, fontWeight:600 }}>Varsayılan</span>}
                          </div>
                          <div style={{ fontSize:12, color:'#8A7B6B', marginTop:2, lineHeight:1.4 }}>{addr.full_address}</div>
                        </div>
                        <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, border:`2px solid ${selectedAddressId === addr.id ? '#E8622A' : '#E8E0D4'}`, background: selectedAddressId === addr.id ? '#E8622A' : 'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {selectedAddressId === addr.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'white' }} />}
                        </div>
                      </div>
                    ))}
                    <div onClick={() => { setSelectedAddressId(null); setAddress(''); setShowNewAddress(true) }} style={{ padding:'10px 14px', borderRadius:10, cursor:'pointer', border:`2px dashed ${showNewAddress && !selectedAddressId ? '#E8622A' : '#E8E0D4'}`, background: showNewAddress && !selectedAddressId ? '#FEF3EC' : 'white', display:'flex', alignItems:'center', gap:8, color:'#8A7B6B' }}>
                      <span style={{ fontSize:16 }}>✏️</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>Farklı adres gir</span>
                    </div>
                  </div>
                ) : null}

                {(showNewAddress || savedAddresses.length === 0) && (
                  <textarea value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Mahalle, cadde, sokak, bina no, daire…" rows={3}
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', resize:'none', boxSizing:'border-box' }} />
                )}
              </div>
            )}

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:6 }}>Sipariş Notu (opsiyonel)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Örn: Az acılı olsun"
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
          </div>

          {/* Platform Kredisi */}
          {!creditLoading && platformCredit > 0 && (
            <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', border: useCredit ? '2px solid #8B5CF6' : '1px solid rgba(232,224,212,0.5)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:4 }}>🎁 Platform Kredisi</div>
                  <div style={{ fontSize:13, color:'#8A7B6B' }}>
                    Kullanılabilir: <strong style={{ color:'#8B5CF6' }}>₺{platformCredit.toFixed(0)}</strong>
                    {useCredit && creditDiscount > 0 && <span style={{ color:'#3D6B47', fontWeight:600 }}> → ₺{creditDiscount.toFixed(0)} uygulanacak</span>}
                  </div>
                </div>
                <div onClick={() => setUseCredit(p => !p)} style={{ width:44, height:24, borderRadius:12, cursor:'pointer', background: useCredit ? '#8B5CF6' : '#E8E0D4', position:'relative' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: useCredit ? 23 : 3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Kupon */}
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:12 }}>🏷️ Kupon Kodu</div>
            {couponApplied ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#ECFDF5', borderRadius:8, padding:'10px 14px' }}>
                <span style={{ color:'#3D6B47', fontWeight:700, fontSize:13 }}>✅ "{appliedCoupon.code}" — {appliedCoupon.discount_type === 'percentage' ? `%${appliedCoupon.discount_value}` : `₺${appliedCoupon.discount_value}`} indirim! (-₺{couponDiscount.toFixed(0)})</span>
                <button onClick={() => { setCouponApplied(false); setAppliedCoupon(null); setCoupon(''); setCouponError('') }} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:18 }}>✕</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:10 }}>
                <input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError('') }} placeholder="Kupon kodunuzu girin"
                  style={{ flex:1, padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit' }} />
                <button onClick={handleCoupon} disabled={couponLoading} style={{ padding:'10px 16px', background: couponLoading ? '#F28B5E' : '#E8622A', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: couponLoading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  {couponLoading ? '⏳' : 'Uygula'}
                </button>
              </div>
            )}
            {couponError && <div style={{ fontSize:12, color:'#DC2626', marginTop:6 }}>{couponError}</div>}
          </div>

          {/* Ödeme yöntemi bilgisi */}
          <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:12 }}>💳 Ödeme Yöntemi</div>
            <div style={{ background:'#F0FDF4', borderRadius:10, padding:'12px 14px', border:'1.5px solid #86EFAC', fontSize:13, color:'#3D6B47', fontWeight:600 }}>
              🔒 Güvenli ödeme — iyzico altyapısı ile korunmaktadır. Kart bilgileriniz bir sonraki adımda güvenli form üzerinden alınacaktır.
            </div>
          </div>

          <button onClick={handleOrder} disabled={loading} style={{
            width:'100%', padding:'16px 0', background: loading ? '#F28B5E' : '#E8622A',
            color:'white', border:'none', borderRadius:14, fontSize:16, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          }}>
            {loading ? '⏳ İşleniyor…' : `🔒 Ödemeye Geç — ₺${finalTotal.toFixed(0)}`}
          </button>

        </div>
      </div>
    </div>
  )
}