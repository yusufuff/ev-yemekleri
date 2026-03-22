import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hakkımızda — EV YEMEKLERİ',
  description: 'Ev Yemekleri platformu hakkında bilgi edinin.',
}

export default function HakkimizdaPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #2C1500 0%, #4A2C0E 60%, #7A4A20 100%)',
        padding: '72px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: 160, opacity: 0.06, pointerEvents: 'none' }} aria-hidden>🍽️</span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          Mahalle Mutfaklarını<br />Sofraya Taşıyoruz
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 32px' }}>
          Ev Yemekleri, mahalledeki en iyi ev aşçılarını sipariş vermek isteyenlerle buluşturan bir platform.
        </p>
        <Link href="/kayit" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', background: '#E8622A', color: 'white',
          fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 14,
        }}>
          🍳 Aşçı Ol →
        </Link>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px' }}>

        {/* Misyon */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
            Misyonumuz
          </h2>
          <p style={{ fontSize: 15, color: '#5A4A3A', lineHeight: 1.9, maxWidth: 600, margin: '0 auto' }}>
            Türkiye'nin her mahallesinde yetenekli ev aşçıları var. Onların lezzetlerini daha geniş kitlelere ulaştırmak, hem aşçılara gelir kapısı açmak hem de insanlara gerçek ev yemeği tadını yaşatmak istiyoruz.
          </p>
        </div>

        {/* Sayılar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 64 }}>
          {[
            { n: '%90',   l: 'Aşçıya Giden Kazanç' },
            { n: '0₺',   l: 'Üyelik Ücreti' },
            { n: '24s',  l: 'Ödeme Süresi' },
            { n: '4.9★', l: 'Ortalama Puan' },
          ].map(({ n, l }) => (
            <div key={n} style={{
              background: 'white', borderRadius: 16, padding: '24px 16px',
              textAlign: 'center', boxShadow: '0 2px 12px rgba(74,44,14,0.07)',
              border: '1px solid rgba(232,224,212,0.5)',
            }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: '#E8622A' }}>{n}</div>
              <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 6, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Hikaye */}
        <div style={{ background: 'white', borderRadius: 20, padding: '40px', boxShadow: '0 2px 16px rgba(74,44,14,0.07)', marginBottom: 48, borderLeft: '4px solid #E8622A' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
            Nasıl Başladık?
          </h2>
          <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.9, marginBottom: 14 }}>
            Her şey basit bir soruyla başladı: "Komşumuz inanılmaz yemek yapıyor, keşke sipariş verebilsek." Bu düşünce, Ev Yemekleri'nin temelini attı.
          </p>
          <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.9, marginBottom: 14 }}>
            Mahalle mutfaklarında üretilen lezzetlerin daha fazla insana ulaşması gerektiğine inandık. Hem aşçılara ekonomik özgürlük sunmak, hem de insanlara fast food'a alternatif, gerçek ev yemeği tadı yaşatmak istedik.
          </p>
          <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.9, margin: 0 }}>
            Bugün onlarca aşçı platformumuzda aktif olarak faaliyet gösteriyor ve müşterilerine günlük taze yemek ulaştırıyor.
          </p>
        </div>

        {/* Değerlerimiz */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#4A2C0E', marginBottom: 24, textAlign: 'center' }}>
          Değerlerimiz
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 64 }}>
          {[
            { icon: '🤝', title: 'Güven',       desc: 'Aşçılarımız kimlik doğrulamasından geçer. Müşterilerimiz güvenle sipariş verir.' },
            { icon: '🌱', title: 'Yerellik',    desc: 'Mahalledeki aşçılar, mahalledeki müşterilere. Kısa mesafe, taze yemek.' },
            { icon: '💰', title: 'Adil Kazanç', desc: 'Aşçılar kazancının %90\'ını alır. Emek hakkı korunur.' },
            { icon: '⭐', title: 'Kalite',      desc: 'Gerçek kullanıcı yorumları ve rozet sistemiyle kalite şeffaf tutulur.' },
            { icon: '🔒', title: 'Güvenlik',    desc: 'SSL şifreleme ve güvenli ödeme altyapısıyla verileriniz korunur.' },
            { icon: '💬', title: 'Şeffaflık',   desc: 'Aşçı ve alıcı doğrudan iletişim kurabilir. Gizli ücret yoktur.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: 'white', borderRadius: 14, padding: '20px',
              boxShadow: '0 1px 8px rgba(74,44,14,0.06)',
              border: '1px solid rgba(232,224,212,0.4)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #3D6B47, #2e5236)',
          borderRadius: 20, padding: '40px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <span style={{ position: 'absolute', right: 20, bottom: -10, fontSize: 80, opacity: 0.08, pointerEvents: 'none' }} aria-hidden>🍲</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 12px' }}>
            Sen de Aramıza Katıl
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 24 }}>
            Aşçı olarak para kazan ya da yakınındaki lezzetleri keşfet.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/asci-ol" style={{ padding: '11px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: 10, textDecoration: 'none', fontSize: 13 }}>
              🍳 Aşçı Ol
            </Link>
            <Link href="/kesif" style={{ padding: '11px 24px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 600, borderRadius: 10, textDecoration: 'none', fontSize: 13 }}>
              🔍 Keşfet
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}