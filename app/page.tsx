import Link from 'next/link'
import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'

export const metadata: Metadata = {
  title: 'EV YEMEKLERİ — Mahallendeki Ev Aşçılarından Sipariş Ver',
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

const HOW_STEPS = [
  { icon: '📍', title: 'Konumunu Paylaş',  desc: 'Yakınındaki ev aşçılarını görmek için konumunu belirle.' },
  { icon: '🔍', title: 'Menüleri Keşfet',  desc: 'Mutfak türü, mesafe ve puana göre filtrele.' },
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

export default async function HomePage() {
  const chefs = await getPopularChefs()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>

      <HeroSection />

      {/* Nasıl Çalışır */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: '40px' }}>Nasıl Çalışır?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F5EDD8', border: '2px solid #E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>{step.icon}</div>
              <div style={{ fontWeight: 700, color: '#4A2C0E', fontSize: '14px', marginBottom: '6px' }}>{step.title}</div>
              <div style={{ color: '#8A7B6B', fontSize: '12px', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Popüler Aşçılar */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#4A2C0E', margin: 0 }}>Yakınındaki Aşçılar</h2>
          <Link href="/kesif" style={{ color: '#E8622A', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {chefs.length > 0 ? chefs.map((chef: any, i: number) => {
            const badge = BADGE_META[chef.badge ?? 'new']
            return (
              <Link key={chef.chef_id} href={`/asci/${chef.chef_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)', cursor: 'pointer' }}>
                  <div style={{ background: CARD_COLORS[i % CARD_COLORS.length], height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>👩‍🍳</div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#4A2C0E', marginBottom: '4px' }}>{chef.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#E8622A', fontWeight: 600, marginBottom: '4px' }}>⭐ {chef.avg_rating?.toFixed(1)} <span style={{ color: '#8A7B6B', fontWeight: 400 }}>({chef.total_reviews} yorum)</span></div>
                    <div style={{ fontSize: '11px', color: '#8A7B6B', marginBottom: '8px' }}>📍 {chef.distance_km?.toFixed(1)} km · {chef.location_approx}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, marginBottom: '8px' }}>
                      {badge.emoji} {badge.label}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {chef.preview_items?.slice(0, 2).map((item: any) => (
                        <span key={item.id} style={{ fontSize: '11px', background: '#FAF6EF', color: '#7A4A20', padding: '2px 8px', borderRadius: '10px' }}>₺{item.price}'den</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )
          }) : (
            // Fallback statik kartlar
            [
              { name: 'Fatma Hanım', rating: 4.9, reviews: 127, km: 1.2, badge: 'master', id: 'chef-1' },
              { name: 'Zeynep Arslan', rating: 5.0, reviews: 203, km: 0.9, badge: 'chef', id: 'chef-2' },
              { name: 'Ayşe Kaya', rating: 4.7, reviews: 58, km: 2.8, badge: 'trusted', id: 'chef-3' },
            ].map((chef, i) => {
              const badge = BADGE_META[chef.badge]
              return (
                <Link key={chef.id} href={`/asci/${chef.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)' }}>
                    <div style={{ background: CARD_COLORS[i], height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>👩‍🍳</div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#4A2C0E', marginBottom: '4px' }}>{chef.name}</div>
                      <div style={{ fontSize: '12px', color: '#E8622A', fontWeight: 600, marginBottom: '8px' }}>⭐ {chef.rating} ({chef.reviews} yorum)</div>
                      <div style={{ fontSize: '11px', color: '#8A7B6B', marginBottom: '8px' }}>📍 {chef.km} km</div>
                      <div style={{ display: 'inline-flex', gap: '4px', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>
                        {badge.emoji} {badge.label}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </section>

      {/* Aşçı Ol CTA */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: '20px', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '32px', fontSize: '120px', opacity: 0.08, userSelect: 'none' }}>👩‍🍳</div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, color: 'white', margin: '0 0 8px' }}>Mutfağın Sana Gelir Getirsin</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '24px' }}>Kendi saatlerinde çalış, kendi fiyatını belirle.</p>
            <Link href="/kayit" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>🍳 Hemen Aşçı Ol →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexShrink: 0 }}>
            {[['%90', 'Kazancın Sende'], ['0₺', 'Üyelik Ücreti'], ['24s', 'Ödeme Süresi'], ['⭐', 'Rozet Sistemi']].map(([n, l]) => (
              <div key={n} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 900, color: 'white' }}>{n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#4A2C0E', marginBottom: '24px' }}>Kullanıcı Yorumları</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: '#F5EDD8', borderRadius: '16px', padding: '20px', borderLeft: '4px solid #E8622A' }}>
              <p style={{ color: '#4A2C0E', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '12px' }}>{t.text}</p>
              <div style={{ color: '#E8622A', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>★★★★★</div>
              <div style={{ color: '#7A4A20', fontSize: '12px', fontWeight: 600 }}>— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#4A2C0E', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '18px', color: 'white' }}>EV YEMEKLERİ</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[['Keşfet', '/kesif'], ['Aşçı Ol', '/kayit'], ['Siparişlerim', '/siparislerim'], ['Mesajlar', '/mesajlar']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>© 2025 Ev Yemekleri</div>
        </div>
      </footer>

    </div>
  )
}