// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { HeroSection } from '@/components/home/HeroSection'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'
import dynamic from 'next/dynamic'
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false })

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
        .limit(5)
      if (!data || data.length === 0) { setTalepler([]); return }
      const userIds = [...new Set(data.map((t: any) => t.user_id).filter(Boolean))]
      const { data: usersData } = await supabase.from('users').select('id, full_name').in('id', userIds)
      const userMap: any = {}
      ;(usersData ?? []).forEach((u: any) => { userMap[u.id] = u.full_name })
      setTalepler(data.map((t: any) => ({ ...t, user_full_name: userMap[t.user_id] ?? null })))
    } catch {}
    finally { setYukleniyor(false) }
  }

  if (yukleniyor) return <div style={{ textAlign: 'center', padding: 20, color: '#8A7B6B' }}>Yükleniyor...</div>
  if (talepler.length === 0) return (
    <Link href="/yemek-talepleri" style={{ display: 'block', background: '#FFF5EC', borderRadius: 14, padding: 16, border: '1.5px solid #E8622A', textAlign: 'center', textDecoration: 'none' }}>
      <p style={{ color: '#4A2C0E', fontWeight: 700, margin: 0 }}>+ İlk talebi oluştur</p>
      <p style={{ color: '#8A7B6B', fontSize: 12, margin: '4px 0 0' }}>Toplu sipariş, bayram, misafir için</p>
    </Link>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {talepler.map((t: any) => (
        <Link key={t.id} href="/yemek-talepleri" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1.5px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontWeight: 700, color: '#1a1a1a', margin: 0, fontSize: 14 }}>{t.baslik}</p>
              {t.butce && <span style={{ color: '#E8622A', fontWeight: 700, fontSize: 13 }}>₺{t.butce.toLocaleString()}</span>}
            </div>
            {t.user_full_name && <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>👤 {t.user_full_name}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {t.kisi_sayisi && <span style={{ fontSize: 12, color: '#888' }}>👥 {t.kisi_sayisi} kişilik</span>}
              {t.konum && <span style={{ fontSize: 12, color: '#888' }}>📍 {t.konum}</span>}
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: t.food_request_offers?.[0]?.count > 0 ? '#E8622A' : '#888', fontWeight: t.food_request_offers?.[0]?.count > 0 ? 700 : 400 }}>
                {t.food_request_offers?.[0]?.count > 0 ? t.food_request_offers[0].count + ' teklif var!' : 'Henüz teklif yok'}
              </span>
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
  const [selectedPin, setSelectedPin] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null)
  const [radius, setRadius] = useState(5)
  const [talepPins, setTalepPins] = useState<any[]>([])

  const yemekleriYukle = useCallback(async () => {
    try {
      const { data } = await supabase.from('menu_items_with_chef').select('*').eq('is_active', true).gt('remaining_stock', 0).order('chef_rating', { ascending: false }).limit(100)
      if (data) {
        setYemekler(data.map(item => ({
          id: item.id, isim: item.name, fiyat: parseFloat(item.price),
          asci_ad: item.chef_name ?? 'Aşçı', asci_id: item.chef_id,
          kategori: item.category ?? 'main', stok: item.remaining_stock ?? 0,
          foto: item.standard_photo ?? item.photos?.[0] ?? null, indirim: item.discount_percent ?? 0,
        })))
      }
    } catch {}
    setYukleniyor(false)
  }, [])

  const chefleriYukle = useCallback(async () => {
    try {
      const res = await fetch('/api/discover?sort=rating')
      const data = await res.json()
      setChefs(data.chefs?.slice(0, 10) ?? [])
    } catch {}
  }, [])

  useEffect(() => { yemekleriYukle(); chefleriYukle() }, [yemekleriYukle, chefleriYukle])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
    const talepYukle = async () => {
      const { data } = await supabase.from('food_requests').select('id, baslik, lat, lng, konum, user_id').eq('durum', 'aktif').not('lat', 'is', null)
      setTalepPins(data ?? [])
    }
    talepYukle()
  }, [])

  const indirimliYemekler = yemekler.filter(y => y.indirim > 0)
  const filtreliYemekler = aktifKategori === 'indirimli' ? indirimliYemekler : aktifKategori === 'hepsi' ? yemekler : yemekler.filter(y => y.kategori === aktifKategori)
  const aramaFiltreli = yemekler.filter(y => y.isim.toLowerCase().includes(aramaMetni.toLowerCase()) || y.asci_ad.toLowerCase().includes(aramaMetni.toLowerCase()))
  const kategoriBazli = KATEGORI_SIRASI.reduce((acc, kat) => {
    const items = yemekler.filter(y => y.kategori === kat)
    if (items.length > 0) acc[kat] = items
    return acc
  }, {} as Record<string, any[]>)

  const chefPins = chefs.filter(c => c.lat && c.lng).map(c => ({
    chef_id: c.chef_id, full_name: c.full_name, avg_rating: c.avg_rating,
    distance_km: c.distance_km ?? 0, is_open: c.is_open,
    lat: c.lat, lng: c.lng, location_approx: c.location_approx,
  }))

  const talepHaritaPins = talepPins.map(t => ({
    chef_id: t.id, full_name: t.baslik, avg_rating: null,
    distance_km: 0, is_open: true, lat: t.lat, lng: t.lng, location_approx: t.konum,
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <HeroSection />

      {/* ANA İKİ KOLON - normal sayfa scroll */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

        {/* SOL KOLON */}
        <div style={{ borderRight: '1px solid #E8E0D4' }}>

          {/* SOL STICKY ÜSTTE - Başlık + Arama + Harita */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FAF6EF', padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #E8622A' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>🍲 Aşçı Yemekleri</h2>
              <Link href="/kesif" style={{ color: '#E8622A', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 12, padding: '8px 12px', border: '1px solid #E8E0D4', marginBottom: 12 }}>
              <span>🔍</span>
              <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Yemek veya aşçı ara..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: '#4A2C0E' }} />
              {aramaMetni && <button onClick={() => setAramaMetni('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A7B6B' }}>✕</button>}
            </div>
            <LeafletMap chefs={chefPins} userCoords={userCoords} radius={radius} onRadius={setRadius} selectedPin={selectedPin} onPinClick={setSelectedPin} />
          </div>

          {/* SOL SCROLL - Kategoriler + Yemekler */}
          <div style={{ padding: '16px 20px 40px' }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
              {KATEGORILER.map(k => (
                <button key={k.id} onClick={() => setAktifKategori(k.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap',
                    background: aktifKategori === k.id ? '#E8622A' : 'white',
                    color: aktifKategori === k.id ? 'white' : '#8A7B6B',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                  <span>{k.emoji}</span>{k.ad}
                </button>
              ))}
            </div>
            {yukleniyor ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8A7B6B' }}>Yemekler yükleniyor...</div>
            ) : aramaMetni ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {aramaFiltreli.map(y => <YemekKart key={y.id} yemek={y} />)}
              </div>
            ) : aktifKategori !== 'hepsi' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {filtreliYemekler.map(y => <YemekKart key={y.id} yemek={y} />)}
              </div>
            ) : (
              <>
                {indirimliYemekler.length > 0 && (
                  <div onClick={() => setAktifKategori('indirimli')} style={{ background: 'linear-gradient(135deg, #E8622A, #C44E1A)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'white' }}>
                    <span>🏷️</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>İndirimli Yemekler</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{indirimliYemekler.length} yemekte fırsatlar var!</div>
                    </div>
                    <span style={{ marginLeft: 'auto' }}>→</span>
                  </div>
                )}
                {KATEGORI_SIRASI.map(kat => {
                  const items = kategoriBazli[kat]
                  if (!items || items.length === 0) return null
                  const meta = KATEGORI_META[kat]
                  return (
                    <div key={kat} style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>{meta.emoji} {meta.ad}</h2>
                        <button onClick={() => setAktifKategori(kat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8622A', fontWeight: 600, fontSize: 11, fontFamily: 'inherit' }}>Tümünü Gör →</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                        {items.slice(0, 4).map(y => <YemekKart key={y.id} yemek={y} />)}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* SAĞ KOLON */}
        <div>

          {/* SAĞ STICKY ÜSTTE - Başlık + Buton + Harita */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FAF6EF', padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #3D6B47' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>📋 Yemek Talepleri</h2>
              <Link href="/yemek-talepleri" style={{ color: '#3D6B47', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: 12, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 2px' }}>İstediğin yemeği talep et</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Aşçılar sana teklif versin</p>
              </div>
              <Link href="/yemek-talepleri" style={{ background: 'white', color: '#3D6B47', borderRadius: 10, padding: '6px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>+ Talep Oluştur</Link>
            </div>
            <LeafletMap chefs={talepHaritaPins} userCoords={userCoords} radius={radius} onRadius={setRadius} selectedPin={selectedPin} onPinClick={setSelectedPin} />
          </div>

          {/* SAĞ SCROLL - Talep Listesi */}
          <div style={{ padding: '16px 20px 40px' }}>
            <AnaSayfaTalepler />
          </div>
        </div>

      </div>

      {/* Yakınındaki Aşçılar */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 16px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>Yakınındaki Aşçılar</h2>
          <Link href="/kesif" style={{ color: '#E8622A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {chefs.length > 0 ? chefs.slice(0, 3).map((chef, i) => {
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
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 64px' }}>
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
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 64px' }}>
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
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 80px' }}>
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
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
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