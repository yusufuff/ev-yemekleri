// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { CATEGORY_META, ALLERGEN_META } from '@/types/menu'

export default function YemekDetayPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<any>(null)
  const [chef, setChef] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem, items: cartItems } = useCart()

  useEffect(() => {
    fetch(`/api/menu/item/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setItem(d.item)
        setChef(d.chef)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: '#8A7B6B' }}>Yukleniyor...</div>
    </div>
  )

  if (!item) return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>404</div>
        <div style={{ color: '#8A7B6B', marginBottom: 16 }}>Yemek bulunamadi.</div>
        <Link href="/kesif" style={{ color: '#E8622A', fontWeight: 700, textDecoration: 'none' }}>Kesfete Don</Link>
      </div>
    </div>
  )

  const isOutOfStock = (item.remaining_stock ?? 0) === 0
  const cat = CATEGORY_META[item.category] ?? { emoji: '🍽️', label: 'Yemek' }
  const inCart = cartItems.find(c => c.menu_item_id === item.id)
  const stockPct = item.daily_stock > 0 ? Math.round((item.remaining_stock / item.daily_stock) * 100) : 0
  const stockColor = stockPct <= 20 ? '#DC2626' : stockPct <= 40 ? '#E8622A' : '#3D6B47'

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        menu_item_id: item.id,
        chef_id: chef?.id,
        chef_name: chef?.full_name ?? 'Asci',
        name: item.name,
        price: item.price,
        remaining_stock: item.remaining_stock,
        photo: item.photos?.[0],
        quantity: 1,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Geri butonu */}
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E8E0D4', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#4A2C0E', fontFamily: 'inherit', marginBottom: 20 }}>
          Geri
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Sol: Fotograf */}
          <div>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #FFECD2, #FCB69F)', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, marginBottom: 12 }}>
              {item.photos?.[0]
                ? <img src={item.photos[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{cat.emoji}</span>
              }
            </div>
            {item.photos?.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {item.photos.slice(0, 4).map((photo: string, i: number) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: i === 0 ? '2px solid #E8622A' : '2px solid #E8E0D4' }}>
                    <img src={photo} alt={`${item.name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sag: Detay */}
          <div>
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>

              {/* Baslik */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ background: '#F5EDD8', color: '#7A4A20', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{cat.emoji} {cat.label}</span>
                {item.prep_time_min > 0 && <span style={{ background: '#F5EDD8', color: '#7A4A20', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>~{item.prep_time_min} dk</span>}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', margin: '8px 0' }}>{item.name}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#E8622A', fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>₺{item.price}</div>

              {/* Aciklama */}
              {item.description && (
                <div style={{ fontSize: 13, color: '#8A7B6B', lineHeight: 1.7, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E8E0D4' }}>
                  {item.description}
                </div>
              )}

              {/* Stok */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: '#8A7B6B', fontWeight: 600 }}>Stok Durumu</span>
                  <span style={{ color: stockColor, fontWeight: 700 }}>{isOutOfStock ? 'Tukendi' : `${item.remaining_stock} porsiyon kaldi`}</span>
                </div>
                <div style={{ background: '#E8E0D4', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${stockPct}%`, height: '100%', borderRadius: 4, background: stockColor, transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* Alerjenler */}
              {item.allergens?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', marginBottom: 8 }}>Alerjenler</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {item.allergens.map((a: string) => (
                      <span key={a} style={{ background: '#FEF3EC', color: '#E8622A', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                        {ALLERGEN_META[a]?.emoji} {ALLERGEN_META[a]?.label ?? a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Adet secici */}
              {!isOutOfStock && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4A2C0E' }}>Adet:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F5EDD8', borderRadius: 10, padding: '6px 12px' }}>
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E8E0D4', background: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                    <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: 'center' }}>{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(item.remaining_stock, q + 1))} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#E8622A', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <span style={{ fontSize: 13, color: '#8A7B6B' }}>Toplam: <strong style={{ color: '#E8622A' }}>₺{(item.price * quantity).toFixed(0)}</strong></span>
                </div>
              )}

              {/* Sepete ekle */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: isOutOfStock ? 'not-allowed' : 'pointer', background: isOutOfStock ? '#E8E0D4' : added ? '#3D6B47' : '#E8622A', color: isOutOfStock ? '#8A7B6B' : 'white', fontFamily: 'inherit', marginBottom: 10, transition: 'background 0.2s' }}
              >
                {isOutOfStock ? 'Tukendi' : added ? 'Sepete Eklendi!' : `Sepete Ekle — ₺${(item.price * quantity).toFixed(0)}`}
              </button>

              {inCart && (
                <Link href="/odeme" style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 12, border: '1.5px solid #E8622A', color: '#E8622A', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Sepete Git ({inCart.quantity} adet)
                </Link>
              )}
            </div>

            {/* Asci karti */}
            {chef && (
              <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E8622A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                  {chef.full_name?.charAt(0) ?? 'A'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#4A2C0E', fontSize: 14 }}>{chef.full_name}</div>
                  <div style={{ fontSize: 12, color: '#8A7B6B' }}>{chef.location_approx}</div>
                </div>
                <Link href={`/asci/${chef.chef_profile_id}`} style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E8E0D4', color: '#4A2C0E', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Profile Git
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}