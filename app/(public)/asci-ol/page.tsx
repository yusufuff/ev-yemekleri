// @ts-nocheck
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aşçı Ol — Mutfağından Gelir Kazan | EV YEMEKLERİ',
  description: 'Kendi mutfağında yemek yap, kapıya teslim et. Ücretsiz başla, kendi saatlerinde çalış.',
}

const STEPS = [
  { num: '1', title: 'Hesap Oluştur',     desc: 'E-posta ile ücretsiz kayıt ol, aşçı rolünü seç.',         icon: '📝' },
  { num: '2', title: 'Profilini Doldur',  desc: 'Bio, mutfak türü, çalışma saatlerin ve konumunu gir.',    icon: '👩‍🍳' },
  { num: '3', title: 'Onay Bekle',        desc: 'Ekibimiz 1–2 iş günü içinde profilini inceler.',          icon: '✅' },
  { num: '4', title: 'Satmaya Başla',     desc: 'Menünü ekle, siparişleri al, kapıya teslim et.',          icon: '🚀' },
]

const FAQS = [
  { q: 'Başlamak için ne gerekiyor?',         a: 'Sadece bir e-posta adresi ve pişirme sevginiz yeterli. Kayıt tamamen ücretsiz.' },
  { q: 'Komisyon oranı nedir?',               a: 'Platform her siparişten %10 komisyon alır. Kalan %90 direkt sizin.' },
  { q: 'Ödemeler ne zaman yapılır?',          a: 'Teslim edilen siparişlerin ödemesi 24 saat içinde IBAN\'ınıza aktarılır.' },
  { q: 'Hangi saatlerde çalışabilirim?',      a: 'Tamamen size kalmış. Dashboard\'dan açık/kapalı durumunuzu istediğiniz zaman değiştirin.' },
  { q: 'Kimlik doğrulama gerekiyor mu?',      a: 'Evet, güvenli bir platform için kimlik ve mutfak fotoğrafı istiyoruz. Onay 1–2 iş gününde tamamlanır.' },
]

export default function AsciOlPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* ─── Hero ─── */}
      <section style={{
        background: 'linear-gradient(135deg, #2C1500 0%, #3D6B47 100%)',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span style={{
          position: 'absolute', right: '5%', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '180px', opacity: 0.07,
          userSelect: 'none', pointerEvents: 'none',
        }} aria-hidden="true">👩‍🍳</span>

        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 99, padding: '6px 16px',
            fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            marginBottom: 20, letterSpacing: '0.5px',
          }}>
            🍳 EV YEMEKLERİ PLATFORMU
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900, color: 'white',
            lineHeight: 1.15, margin: '0 0 16px',
          }}>
            Mutfağın Sana<br />Gelir Getirsin
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            Kendi saatlerinde çalış, kendi fiyatını belirle. Mahallelindeki müşterilere ev yapımı yemek sat.
          </p>

          {/* Stat kutucukları */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            {[['%90', 'Kazancın Sende'], ['0₺', 'Üyelik Ücreti'], ['24s', 'Ödeme Süresi'], ['1–2 gün', 'Onay Süresi']].map(([n, l]) => (
              <div key={n} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12, padding: '12px 20px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: 'white' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/kayit" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: '#E8622A', color: 'white',
              fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 15,
            }}>
              🍳 Hemen Başla →
            </Link>
            <a href="#nasil-calisir" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontWeight: 600, borderRadius: 12,
              textDecoration: 'none', fontSize: 15,
            }}>
              Nasıl Çalışır?
            </a>
          </div>
        </div>
      </section>

      {/* ─── Nasıl Çalışır ─── */}
      <section id="nasil-calisir" style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: 48 }}>
          4 Adımda Başla
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{
              background: 'white', borderRadius: 16, padding: '28px 20px',
              boxShadow: '0 2px 12px rgba(74,44,14,0.07)',
              border: '1px solid rgba(232,224,212,0.5)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E8622A, #F59E0B)',
                color: 'white', fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>{s.num}</div>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#4A2C0E', marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Neden biz ─── */}
      <section style={{ background: '#F0EBE3', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: 40 }}>
            Neden Ev Yemekleri?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: '💰', title: 'Yüksek Kazanç',       desc: 'Siparişlerin %90\'ı direkt cebinize gider. Yemek başı ortalama ₺40–₺80.' },
              { icon: '⏰', title: 'Esnek Çalışma',        desc: 'Sabah mı, akşam mı, hafta sonu mu? Tamamen size kalmış.' },
              { icon: '📍', title: 'Yakın Müşteriler',     desc: 'Sadece 1–10 km çevrenizdeki müşterilere satış yapın. Uzak teslimat yok.' },
              { icon: '📊', title: 'Kolay Yönetim',        desc: 'Siparişlerinizi, stoğunuzu ve kazancınızı tek ekrandan takip edin.' },
              { icon: '⭐', title: 'Rozet Sistemi',         desc: 'Yeni, Güvenilir, Usta Eller ve Ev Şefi rozetleri ile öne çıkın.' },
              { icon: '🔔', title: 'Anlık Bildirimler',    desc: 'Yeni sipariş geldiğinde anında telefonunuza bildirim alın.' },
            ].map((item) => (
              <div key={item.title} style={{
                background: 'white', borderRadius: 14, padding: '20px',
                boxShadow: '0 1px 8px rgba(74,44,14,0.06)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SSS ─── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E', textAlign: 'center', marginBottom: 40 }}>
          Sık Sorulan Sorular
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map((faq) => (
            <div key={faq.q} style={{
              background: 'white', borderRadius: 14, padding: '20px 24px',
              boxShadow: '0 1px 8px rgba(74,44,14,0.06)',
              border: '1px solid rgba(232,224,212,0.4)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 8 }}>❓ {faq.q}</div>
              <div style={{ fontSize: 13, color: '#8A7B6B', lineHeight: 1.7 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Bottom ─── */}
      <section style={{ padding: '0 24px' }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          background: 'linear-gradient(135deg, #3D6B47, #2e5236)',
          borderRadius: 20, padding: '48px 40px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <span style={{ position: 'absolute', right: 20, bottom: -10, fontSize: 100, opacity: 0.08, pointerEvents: 'none' }} aria-hidden="true">🍲</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 12px' }}>
            Hazır mısın?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 28 }}>
            Ücretsiz hesap aç, profilini doldur, satmaya başla.
          </p>
          <Link href="/kayit" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', background: 'white', color: '#3D6B47',
            fontWeight: 700, borderRadius: 12, textDecoration: 'none', fontSize: 15,
          }}>
            🍳 Ücretsiz Hesap Aç →
          </Link>
          <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Kredi kartı gerekmez · Anında başla
          </div>
        </div>
      </section>

    </div>
  )
}