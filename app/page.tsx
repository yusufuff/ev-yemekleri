// @ts-nocheck
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anneelim — Mahallendeki Ev Ascılarından Siparis Ver',
  description: 'Yakınındaki ev aşçılarından taze, sıcak yemek sipariş et. Gel-al veya kapına teslimat.',
}

async function getPopularChefs() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.anneelim.com'
    const res = await fetch(`${base}/api/discover?sort=rating`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.chefs?.slice(0, 3) ?? []
  } catch {
    return []
  }
}

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  new:     { emoji: '🌱', label: 'Yeni Asci' },
  trusted: { emoji: '✅', label: 'Guvenilir' },
  master:  { emoji: '🏅', label: 'Usta Eller' },
  chef:    { emoji: '👑', label: 'Ev Sefi' },
}

const CARD_COLORS = [
  'linear-gradient(135deg, #FECACA, #F87171)',
  'linear-gradient(135deg, #FDE68A, #F59E0B)',
  'linear-gradient(135deg, #A7F3D0, #34D399)',
]

export default async function HomePage() {
  const chefs = await getPopularChefs()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #4A2C0E 0%, #7A4A20 60%, #B87333 100%)', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 300, opacity: 0.04, userSelect: 'none', pointerEvents: 'none' }}>🍽</div>
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
            Mahalle Lezzetleri
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1.15, margin: '0 0 16px' }}>
            Mahallendeki En Iyi<br />Ev Yemekleri
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.7, margin: '0 0 32px' }}>
            2-10 km cevrenizdeki ev ascılarından taze, sıcak yemek siparis edin.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/kesif" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#E8622A', color: 'white', fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 15 }}>
              Asci Bul
            </Link>
            <Link href="/kayit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 15, border: '1.5px solid rgba(255,255,255,0.3)' }}>
              Asci Ol
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 40 }}>
            {[['1.200+', 'Asci'], ['48.000+', 'Siparis'], ['12', 'Sehir']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: 'white' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL CALISIR */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: 48 }}>Nasil Calisir?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
          {[
            { icon: '📍', title: 'Konumunu Paylas', desc: 'Yakınındaki ev ascılarını gormek icin konumunu belirle.' },
            { icon: '🔍', title: 'Menuleri Kesfet', desc: 'Mutfak turu, mesafe ve puana gore filtrele.' },
            { icon: '🛒', title: 'Siparis Ver', desc: 'Guvenli odeme yap, asci hazırlamaya basılsın.' },
            { icon: '🏠', title: 'Teslim Al', desc: 'Kapına gelsin veya gel-al yontemiyle teslim al.' },
          ].map((step, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5EDD8', border: '2px solid #E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>{step.icon}</div>
              <div style={{ fontWeight: 700, color: '#4A2C0E', fontSize: 14, marginBottom: 8 }}>{step.title}</div>
              <div style={{ color: '#8A7B6B', fontSize: 12, lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULER ASCILLAR */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>Yakınındaki Ascılar</h2>
          <Link href="/kesif" style={{ color: '#E8622A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Tumunu Gor</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {chefs.length > 0 ? chefs.map((chef: any, i: number) => {
            const badge = BADGE_META[chef.badge ?? 'new']
            return (
              <Link key={chef.chef_id} href={`/asci/${chef.chef_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)', transition: 'transform 0.2s' }}>
                  <div style={{ background: CARD_COLORS[i % CARD_COLORS.length], height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👩‍🍳</div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 4 }}>{chef.full_name}</div>
                    <div style={{ fontSize: 12, color: '#E8622A', fontWeight: 600, marginBottom: 4 }}>⭐ {chef.avg_rating?.toFixed(1)} <span style={{ color: '#8A7B6B', fontWeight: 400 }}>({chef.total_reviews} yorum)</span></div>
                    <div style={{ fontSize: 11, color: '#8A7B6B', marginBottom: 10 }}>📍 {chef.distance_km?.toFixed(1)} km · {chef.location_approx}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {badge.emoji} {badge.label}
                    </div>
                    {chef.preview_items?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {chef.preview_items.slice(0, 2).map((item: any) => (
                          <span key={item.id} style={{ fontSize: 11, background: '#FAF6EF', color: '#7A4A20', padding: '2px 8px', borderRadius: 10 }}>₺{item.price}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          }) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#8A7B6B', fontSize: 14 }}>
              Yakinınızda asci bulunamadı.{' '}
              <Link href="/kesif" style={{ color: '#E8622A', fontWeight: 700, textDecoration: 'none' }}>Tumu Goster</Link>
            </div>
          )}
        </div>
      </section>

      {/* ASCI OL CTA */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: 20, padding: '48px 40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 32, fontSize: 140, opacity: 0.06, userSelect: 'none' }}>👩‍🍳</div>
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 8px' }}>Mutfagin Sana Gelir Getirsin</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24, maxWidth: 400 }}>Kendi saatlerinde calis, kendi fiyatını belirle. Ilk hafta ucretsiz.</p>
            <Link href="/kayit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 14 }}>
              Hemen Asci Ol
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
            {[['%90', 'Kazancin Sende'], ['0₺', 'Uyelik Ucreti'], ['24s', 'Odeme Suresi'], ['⭐', 'Rozet Sistemi']].map(([n, l]) => (
              <div key={n} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: 'white' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YORUMLAR */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', marginBottom: 24 }}>Kullanici Yorumlari</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { text: 'Fatma Hanim\'in mercimek corbasi tam annem gibi yapıyor. Her gun siparis versem cekinmiyorum!', author: 'Mehmet Y., Adana' },
            { text: 'Is yerinde yemek sorununu cozdu. Sicak, ev yapimi, uygun fiyatli. Herkese oneririm.', author: 'Selin K., Izmir' },
            { text: 'Asci olarak katıldim, ilk haftada 15 siparis aldim. Platform cok kullanisli.', author: 'Gulay A., Asci' },
          ].map((t, i) => (
            <div key={i} style={{ background: '#F5EDD8', borderRadius: 16, padding: 24, borderLeft: '4px solid #E8622A' }}>
              <p style={{ color: '#4A2C0E', fontSize: 13, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 12 }}>"{t.text}"</p>
              <div style={{ color: '#E8622A', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⭐⭐⭐⭐⭐</div>
              <div style={{ color: '#7A4A20', fontSize: 12, fontWeight: 600 }}>— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#4A2C0E', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: 'white' }}>ANNEELIM</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['Kesfet', '/kesif'], ['Asci Ol', '/kayit'], ['Siparislerim', '/siparislerim'], ['SSS', '/sss'], ['KVKK', '/kvkk']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>© 2025 Anneelim</div>
        </div>
      </footer>

    </div>
  )
}