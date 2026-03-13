import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EV YEMEKLERİ — Mahallendeki Ev Aşçılarından Sipariş Ver',
}

const POPULAR_ITEMS = [
  { emoji: '🍲', name: 'Kuru Fasulye & Pilav', price: 55, chef: 'Fatma H.', rating: '4.9', km: '1.2' },
  { emoji: '🥙', name: 'İmam Bayıldı',         price: 45, chef: 'Ayşe K.',  rating: '4.7', km: '2.8' },
  { emoji: '🍮', name: 'Sütlaç',               price: 35, chef: 'Zeynep A.', rating: '5.0', km: '0.9' },
]

const HOW_STEPS = [
  { icon: '📍', title: 'Konumunu Paylaş',  desc: 'Yakınındaki ev aşçılarını görmek için konumunu belirle.' },
  { icon: '🔍', title: 'Menüleri Keşfet',  desc: 'Mutfak türü, mesafe ve puana göre filtrele.' },
  { icon: '🛒', title: 'Sipariş Ver',       desc: 'Güvenli ödeme yap, aşçı hazırlamaya başlasın.' },
  { icon: '🏠', title: 'Teslim Al',         desc: 'Kapına gelsin veya gel-al yöntemiyle teslim al.' },
]

const TESTIMONIALS = [
  { text: '"Fatma Hanım\'ın mercimek çorbası tam annem gibi. Her gün sipariş versem çekinmiyorum!"', author: 'Mehmet Y., Adana' },
  { text: '"İş yerinde yemek sorununu çözdü. Sıcak, ev yapımı, uygun fiyatlı. Herkese öneririm."',  author: 'Selin K., İzmir' },
  { text: '"Aşçı olarak katıldım, ilk haftada 15 sipariş aldım. Platform çok kullanışlı."',          author: 'Gülay A., Aşçı' },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #2C1500 0%, #4A2C0E 50%, #7A4A20 100%)', position: 'relative', overflow: 'hidden', padding: '72px 24px 88px' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '6%', top: '50%', transform: 'translateY(-50%)', fontSize: '160px', opacity: 0.07, userSelect: 'none', pointerEvents: 'none' }}>👩‍🍳</div>
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 900, color: 'white', lineHeight: 1.15, margin: '0 0 16px' }}>
            Mahallendeki En İyi<br />Ev Yemeklerini Keşfet
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '400px' }}>
            2–10 km çevrenizdeki ev aşçılarından taze, sıcak, elle yapılmış yemek sipariş edin.
          </p>
          <Link href="/kesif" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '14px 28px', background: '#E8622A', color: 'white',
            borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700,
            marginBottom: '24px',
          }}>
            Aşçıları Keşfet →
          </Link>
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            {['✅ Güvenli Ödeme', '📍 Konum Bazlı', '⭐ Gerçek Yorumlar'].map(label => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasil Calisir */}
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

      {/* Populer */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#4A2C0E', margin: 0 }}>Bugünün Popüler Menüleri</h2>
          <Link href="/kesif" style={{ color: '#E8622A', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {POPULAR_ITEMS.map((item, i) => (
            <Link href="/kesif" key={i} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.6)', textDecoration: 'none', display: 'block' }}>
              <div style={{ height: '140px', background: 'linear-gradient(135deg, #FFECD2, #FCB69F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px' }}>{item.emoji}</div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: 600, color: '#4A2C0E', fontSize: '14px', marginBottom: '8px' }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: '#E8622A' }}>₺{item.price}</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: '#ECFDF5', color: '#3D6B47', fontWeight: 600 }}>⭐ {item.rating}</span>
                </div>
                <div style={{ color: '#8A7B6B', fontSize: '12px', marginTop: '8px' }}>👩‍🍳 {item.chef} · {item.km} km</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Asci Ol */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: '20px', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '32px', fontSize: '120px', opacity: 0.08, userSelect: 'none' }}>👩‍🍳</div>
          <div>
            <div style={{ color: '#6BA37A', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>EV AŞÇILARI İÇİN</div>
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
            {[['Keşfet', '/kesif'], ['Aşçı Ol', '/kayit'], ['Hakkımızda', '/hakkimizda'], ['Gizlilik', '/gizlilik']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>© 2025 Ev Yemekleri</div>
        </div>
      </footer>

    </div>
  )
}