// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { HeroSection } from '@/components/home/HeroSection'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const KATEGORILER = [
  { id: 'hepsi',     ad: 'Hepsi',      emoji: '🍽️' },
  { id: 'indirimli', ad: 'İndirimli',  emoji: '🏷️' },
  { id: 'main',      ad: 'Ana Yemek',  emoji: '🍲' },
  { id: 'dessert',   ad: 'Tatlı',      emoji: '🍰' },
  { id: 'breakfast', ad: 'Kahvaltı',   emoji: '🥚' },
  { id: 'soup',      ad: 'Çorba',      emoji: '🥣' },
  { id: 'pastry',    ad: 'Börek',      emoji: '🥐' },
  { id: 'drink',     ad: 'İçecek',     emoji: '🥤' },
  { id: 'salad',     ad: 'Salata',     emoji: '🥗' },
]

const KATEGORI_META: Record<string, { emoji: string; ad: string }> = {
  main:      { emoji: '🍲', ad: 'Ana Yemekler' },
  dessert:   { emoji: '🍰', ad: 'Tatlılar' },
  breakfast: { emoji: '🥚', ad: 'Kahvaltı' },
  soup:      { emoji: '🥣', ad: 'Çorbalar' },
  pastry:    { emoji: '🥐', ad: 'Börekler' },
  drink:     { emoji: '🥤', ad: 'İçecekler' },
  salad:     { emoji: '🥗', ad: 'Salatalar' },
  menu:      { emoji: '🍱', ad: 'Menüler' },
}

const KATEGORI_SIRASI = ['main', 'soup', 'dessert', 'breakfast', 'pastry', 'salad', 'drink']

const HOW_STEPS = [
  { icon: '📍', title: 'Konumunu Paylaş',  desc: 'Yakınındaki ev aşçılarını görmek için konumunu belirle.' },
  { icon: '📋', title: 'Menüleri Keşfet',  desc: 'Mutfak türü, mesafe ve puana göre filtrele.' },
  { icon: '🛒', title: 'Sipariş Ver',       desc: 'Güvenli ödeme yap, aşçı hazırlamaya başlasın.' },
  { icon: '🏠', title: 'Teslim Al',         desc: 'Kapına gelsin veya gel-al yöntemiyle teslim al.' },
]

const TESTIMONIALS = [
  { text: '"Fatma Hanım\'ın mercimek çorbası tam annem gibi. Her gün sipariş versem çekinmiyorum!"', author: 'Mehmet Y., Adana' },
  { text: '"İş yerinde yemek sorununu çözdü. Sıcak, ev yapımı, uygun fiyatlı. Herkese öneririm."', author: 'Selin K., İzmir' },
  { text: '"Aşçı olarak katıldım, ilk haftada 15 sipariş aldım. Platform çok kullanışlı."', author: 'Gülay A., Aşçı' },
]

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  new:     { emoji: '🌱', label: 'Yeni Aşçı' },
  trusted: { emoji: '⭐', label: 'Güvenilir' },
  master:  { emoji: '🏅', label: 'Usta Eller' },
  chef:    { emoji: '👑', label: 'Ev Şefi' },
}

const CARD_COLORS = [
  'linear-gradient(135deg, #FECACA, #F87171)',
  'linear-gradient(135deg, #FDE68A, #F59E0B)',
  'linear-gradient(135deg, #A7F3D0, #34D399)',
]

function YemekKart({ yemek }: { yemek: any }) {
  const { addItem, items } = useCart()
  const [eklendi, setEklendi] = useState(false)
  const inCart = items?.find((c: any) => c.menu_item_id === yemek.id)
  const ind = yemek.indirim > 0 ? Math.round(yemek.fiyat * (1 - yemek.indirim / 100)) : yemek.fiyat

  const handleEkle = () => {
    addItem({
      menu_item_id: yemek.id,
      chef_id: yemek.asci_id,
      chef_name: yemek.asci_ad,
      name: yemek.isim,
      price: yemek.fiyat,
      category: yemek.kategori,
      remaining_stock: yemek.stok,
      quantity: 1,
      photo: yemek.foto,
    })
    setEklendi(true)
    setTimeout(() => setEklendi(false), 1500)
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.5)', display: 'flex', flexDirection: 'column' }}>
      <Link href={`/yemek/${yemek.id}`} style={{ textDecoration: 'none' }}>
        <div style={{ height: 140, background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {yemek.foto
            ? <img src={yemek.foto} alt={yemek.isim} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 48 }}>{KATEGORI_META[yemek.kategori]?.emoji ?? '🍽️'}</span>
          }
          {yemek.indirim > 0 && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: '#E8622A', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>%{yemek.indirim}</div>
          )}
          {yemek.stok <= 3 && yemek.stok > 0 && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: '#F59E0B', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Son {yemek.stok}!</div>
          )}
        </div>
      </Link>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Link href={`/yemek/${yemek.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', lineHeight: 1.3 }}>{yemek.isim}</div>
        </Link>
        <div style={{ fontSize: 12, color: '#8A7B6B' }}>👩‍🍳 {yemek.asci_ad}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            {yemek.indirim > 0 && <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>₺{yemek.fiyat}</div>}
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E8622A' }}>₺{ind}</div>
          </div>
          <button onClick={handleEkle} disabled={yemek.stok === 0}
            style={{ padding: '8px 16px', borderRadius: 10, background: eklendi ? '#3D6B47' : '#E8622A', color: 'white', border: 'none', cursor: yemek.stok === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s', opacity: yemek.stok === 0 ? 0.5 : 1 }}>
            {eklendi ? '✓ Eklendi' : inCart ? `🛒 ${inCart.quantity}` : '+ Ekle'}
          </button>
        </div>
      </div>
    </div>
  )
}
function AnaSayfaTalepler() {
  const [talepler, setTalepler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.from('food_requests')
        .select('*, food_request_offers(count)')
        .eq('durum', 'aktif')
        .order('created_at', { ascending: false })
        .limit(3)
      if (!data || data.length === 0) { setTalepler([]); return }
      const userIds = [...new Set(data.map((t: any) => t.user_id).filter(Boolean))]
      const { data: usersData } = await supabase.from('users').select('id, full_name').in('id', userIds)
      const userMap: any = {}
      ;(usersData ?? []).forEach((u: any) => { userMap[u.id] = u.full_name })
      setTalepler(data.map((t: any) => ({ ...t, user_full_name: userMap[t.user_id] ?? null })))
    } catch {}
    finally { setYukleniyor(false) }
  }

  if (yukleniyor) return <div style={{ textAlign: 'center', padding: 20 }}>Yükleniyor...</div>
  if (talepler.length === 0) return (
    <Link href="/yemek-talepleri" style={{ display: 'block', background: '#FFF5EC', borderRadius: 14, padding: 16, border: '1.5px solid #E8622A', textAlign: 'center', textDecoration: 'none' }}>
      <p style={{ color: '#4A2C0E', fontWeight: 700, margin: 0 }}>+ İlk talebi oluştur</p>
      <p style={{ color: '#8A7B6B', fontSize: 12, margin: '4px 0 0' }}>Toplu sipariş, bayram, misafir için</p>
    </Link>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {talepler.map((t: any) => (
        <Link key={t.id} href="/yemek-talepleri" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1.5px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontWeight: 700, color: '#1a1a1a', margin: 0, fontSize: 15 }}>{t.baslik}</p>
              {t.butce && <span style={{ color: '#E8622A', fontWeight: 700 }}>₺{t.butce.toLocaleString()}</span>}
            </div>
            {t.user_full_name && <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>👤 {t.user_full_name}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {t.kisi_sayisi && <span style={{ fontSize: 12, color: '#888' }}>👥 {t.kisi_sayisi} kişilik</span>}
              {t.konum && <span style={{ fontSize: 12, color: '#888' }}>📍 {t.konum}</span>}
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#888' }}>{t.food_request_offers?.[0]?.count > 0 ? t.food_request_offers[0].count + ' teklif var!' : 'Henüz teklif yok'}</span>
              <span style={{ background: '#E8622A', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>Teklif Ver</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
export default function HomePage() {
  const [yemekler, setYemekler] = useState<any[]>([])
  const [chefs, setChefs] = useState<any[]>([])
  const [aktifKategori, setAktifKategori] = useState('hepsi')
  const [aramaMetni, setAramaMetni] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yemekleriYukle = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('menu_items_with_chef')
        .select('*')
        .eq('is_active', true)
        .gt('remaining_stock', 0)
        .order('chef_rating', { ascending: false })
        .limit(100)
      if (data) {
        setYemekler(data.map(item => ({
          id:       item.id,
          isim:     item.name,
          fiyat:    parseFloat(item.price),
          asci_ad:  item.chef_name ?? 'Aşçı',
          asci_id:  item.chef_id,
          kategori: item.category ?? 'main',
          stok:     item.remaining_stock ?? 0,
          foto:     item.standard_photo ?? item.photos?.[0] ?? null,
          indirim:  item.discount_percent ?? 0,
        })))
      }
    } catch {}
    setYukleniyor(false)
  }, [])

  const chefleriYukle = useCallback(async () => {
    try {
      const res = await fetch('/api/discover?sort=rating')
      const data = await res.json()
      setChefs(data.chefs?.slice(0, 3) ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    yemekleriYukle()
    chefleriYukle()
  }, [yemekleriYukle, chefleriYukle])

  const indirimliYemekler = yemekler.filter(y => y.indirim > 0)
  const filtreliYemekler = aktifKategori === 'indirimli' ? indirimliYemekler
    : aktifKategori === 'hepsi' ? yemekler
    : yemekler.filter(y => y.kategori === aktifKategori)

  const aramaFiltreli = yemekler.filter(y =>
    y.isim.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    y.asci_ad.toLowerCase().includes(aramaMetni.toLowerCase())
  )

  const kategoriBazli = KATEGORI_SIRASI.reduce((acc, kat) => {
    const items = yemekler.filter(y => y.kategori === kat)
    if (items.length > 0) acc[kat] = items
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <HeroSection />
{/* İki Kolon - Aşçı Yemekleri ve Yemek Talepleri */}
<div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
  {/* Sol - Aşçı Yemekleri */}
  <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.06)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>🍲 Aşçı Yemekleri</h2>
      <Link href="/kesif" style={{ color: '#E8622A', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
    </div>
    <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 16 }}>Yakınındaki ev aşçılarından taze yemekler sipariş et.</p>
    <Link href="/kesif" style={{ display: 'block', background: '#E8622A', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
      Yemekleri Keşfet →
    </Link>
  </div>

  {/* Sağ - Yemek Talepleri */}
  <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.06)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>📋 Yemek Talepleri</h2>
      <Link href="/yemek-talepleri" style={{ color: '#E8622A', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
    </div>
    <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 16 }}>İstediğin yemeği talep et, aşçılar sana teklif versin.</p>
    <Link href="/yemek-talepleri" style={{ display: 'block', background: '#3D6B47', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
      Talep Oluştur →
    </Link>
  </div>
</div>
      {/* Arama */}
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid #E8E0D4' }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input
            value={aramaMetni}
            onChange={e => setAramaMetni(e.target.value)}
            placeholder="Yemek veya aşçı ara..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'transparent', color: '#4A2C0E' }}
          />
          {aramaMetni && <button onClick={() => setAramaMetni('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A7B6B' }}>✕</button>}
        </div>
      </div>

      {/* Kategoriler */}
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '16px 24px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {KATEGORILER.map(k => (
            <button key={k.id} onClick={() => setAktifKategori(k.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.15s',
                background: aktifKategori === k.id ? '#E8622A' : 'white',
                color: aktifKategori === k.id ? 'white' : '#8A7B6B',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
              <span>{k.emoji}</span>{k.ad}
            </button>
          ))}
        </div>
      </div>

      {/* Yemekler */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '24px 24px' }}>
        {yukleniyor ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>Yemekler yükleniyor...</div>
        ) : aramaMetni ? (
          <>
            <div style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 16 }}>{aramaFiltreli.length} sonuç</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {aramaFiltreli.map(y => <YemekKart key={y.id} yemek={y} />)}
            </div>
          </>
        ) : aktifKategori !== 'hepsi' ? (
          <>
            {filtreliYemekler.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>Bu kategoride yemek yok</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {filtreliYemekler.map(y => <YemekKart key={y.id} yemek={y} />)}
              </div>
            )}
          </>
        ) : (
          <>
            {indirimliYemekler.length > 0 && (
              <div onClick={() => setAktifKategori('indirimli')}
                style={{ background: 'linear-gradient(135deg, #E8622A, #C44E1A)', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'white' }}>
                <span style={{ fontSize: 24 }}>🏷️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>İndirimli Yemekler</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{indirimliYemekler.length} yemekte fırsatlar var!</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 18 }}>→</span>
              </div>
            )}

            {KATEGORI_SIRASI.map(kat => {
              const items = kategoriBazli[kat]
              if (!items || items.length === 0) return null
              const meta = KATEGORI_META[kat]
              return (
                <div key={kat} style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>{meta.emoji} {meta.ad}</h2>
                    <button onClick={() => setAktifKategori(kat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8622A', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>Tümünü Gör →</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {items.slice(0, 4).map(y => <YemekKart key={y.id} yemek={y} />)}
                  </div>
                </div>
              )
            })}

            {Object.keys(kategoriBazli).length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                <div style={{ fontWeight: 700, color: '#4A2C0E', marginBottom: 6 }}>Şu an aktif yemek yok</div>
              </div>
            )}
          </>
        )}
      </section>
{/* Yemek Talepleri */}
<section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 48px' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>📋 Açık Yemek Talepleri</h2>
    <Link href="/yemek-talepleri" style={{ color: '#E8622A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
  </div>
  <AnaSayfaTalepler />
</section>
      {/* Yakınındaki Aşçılar */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>Yakınındaki Aşçılar</h2>
          <Link href="/kesif" style={{ color: '#E8622A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {chefs.length > 0 ? chefs.map((chef, i) => {
            const badge = BADGE_META[chef.badge ?? 'new']
            return (
              <Link key={chef.chef_id} href={`/asci/${chef.chef_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.5)' }}>
                  <div style={{ height: 120, background: CARD_COLORS[i % CARD_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>👩‍🍳</div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#4A2C0E' }}>{chef.full_name}</div>
                      <span style={{ fontSize: 11, background: '#F5EDD8', color: '#7A4A20', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{badge.emoji} {badge.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#8A7B6B' }}>
                      <span>⭐ {chef.avg_rating?.toFixed(1) ?? '—'}</span>
                      <span>📍 {chef.distance_km?.toFixed(1)} km</span>
                      <span style={{ marginLeft: 'auto', color: chef.is_open ? '#3D6B47' : '#8A7B6B', fontWeight: 600 }}>{chef.is_open ? '● Açık' : '○ Kapalı'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          }) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#8A7B6B' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👩‍🍳</div>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#4A2C0E' }}>Henüz aşçı yok</div>
            </div>
          )}
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: 40 }}>Nasıl Çalışır?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F5EDD8', border: '2px solid #E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>{step.icon}</div>
              <div style={{ fontWeight: 700, color: '#4A2C0E', fontSize: 14, marginBottom: 6 }}>{step.title}</div>
              <div style={{ color: '#8A7B6B', fontSize: 12, lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Aşçı Ol CTA */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: 20, padding: 48, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32, position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', fontSize: 120, opacity: 0.08, userSelect: 'none', pointerEvents: 'none' }}>👩‍🍳</span>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 8px' }}>Mutfağın Sana Gelir Getirsin</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24 }}>Kendi saatlerinde çalış, kendi fiyatını belirle.</p>
            <Link href="/kayit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 14 }}>🍳 Hemen Aşçı Ol →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0, position: 'relative', zIndex: 1 }}>
            {[['%90', 'Kazancın Sende'], ['0₺', 'Üyelik Ücreti'], ['24s', 'Ödeme Süresi'], ['⭐', 'Rozet Sistemi']].map(([n, l]) => (
              <div key={n} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: 'white' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', marginBottom: 24 }}>Kullanıcı Yorumları</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: '#F5EDD8', borderRadius: 16, padding: 20, borderLeft: '4px solid #E8622A' }}>
              <p style={{ color: '#4A2C0E', fontSize: 13, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 12 }}>{t.text}</p>
              <div style={{ color: '#E8622A', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>★★★★★</div>
              <div style={{ color: '#7A4A20', fontSize: 12, fontWeight: 600 }}>— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#4A2C0E', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: 'white' }}>Anneelim</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>🚶 Yürüme Mesafesinde Ev Yemeği</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['Yemek Talepleri', '/yemek-talepleri'], ['Keşfet', '/kesif'], ['Blog', '/blog'], ['Aşçı Ol', '/asci-ol'], ['Hakkımızda', '/hakkimizda'], ['SSS', '/sss'], ['KVKK', '/kvkk'], ['Kullanım Koşulları', '/kullanim-kosullari']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>© 2026 Anneelim</div>
        </div>
      </footer>
    </div>
  )
}