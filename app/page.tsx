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
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>

      <HeroSection />

      {/* Nasıl Çalışır */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: '40px' }}>Nasıl Çalışır?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {chefs.length > 0 ? chefs.map((chef: any, i: number) => {
            const badge = BADGE_META[chef.badge ?? 'new']
            return (
              <Link key={chef.chef_id} href={`/asci/${chef.chef_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.5)', transition: 'transform 0.2s' }}>
                  <div style={{ height: '120px', background: CARD_COLORS[i % CARD_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>👩‍🍳</div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#4A2C0E' }}>{chef.full_name}</div>
                      <span style={{ fontSize: '11px', background: '#F5EDD8', color: '#7A4A20', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>{badge.emoji} {badge.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#8A7B6B' }}>
                      <span>⭐ {chef.avg_rating?.toFixed(1) ?? '—'}</span>
                      <span>📍 {chef.distance_km?.toFixed(1)} km</span>
                      <span style={{ marginLeft: 'auto', color: chef.is_open ? '#3D6B47' : '#8A7B6B', fontWeight: 600 }}>{chef.is_open ? '● Açık' : '○ Kapalı'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          }) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#8A7B6B' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👩‍🍳</div>
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#4A2C0E' }}>Henüz aşçı yok</div>
              <div style={{ fontSize: '13px' }}>Yakında aşçılar eklenecek!</div>
            </div>
          )}
        </div>
      </section>

      {/* Aşçı Ol CTA */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: '20px', padding: '48px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '32px', position: 'relative', overflow: 'hidden' }}>
          {/* Dekoratif emoji - pointer-events kapalı */}
          <span style={{ position: 'absolute', right: '32px', top: '50%', transform: 'translateY(-50%)', fontSize: '120px', opacity: 0.08, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }} aria-hidden="true">👩‍🍳</span>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, color: 'white', margin: '0 0 8px' }}>Mutfağın Sana Gelir Getirsin</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '24px' }}>Kendi saatlerinde çalış, kendi fiyatını belirle.</p>
            <Link href="/kayit" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>🍳 Hemen Aşçı Ol →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
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
            {[['Keşfet', '/kesif'], ['Yemek Ara', '/ara'], ['Aşçı Ol', '/kayit'], ['Siparişlerim', '/siparislerim']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>© 2025 Ev Yemekleri</div>
        </div>
      </footer>

    </div>
  )
}