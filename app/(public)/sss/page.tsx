// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    cat: 'Genel',
    items: [
      { q: 'Ev Yemekleri nedir?', a: 'Ev Yemekleri, mahalledeki ev aşçılarıyla yemek sipariş etmek isteyen kişileri buluşturan bir platformdur. Gerçek ev yemeği tadını kapınıza getiriyoruz.' },
      { q: 'Nasıl sipariş veririm?', a: 'Keşfet sayfasından yakınındaki aşçıları gör, beğendiğin yemeği sepete ekle, güvenli ödeme yap. Aşçı siparişini hazırlayıp teslim eder.' },
      { q: 'Uygulama var mı?', a: 'Şu an web tabanlı çalışıyoruz. Tarayıcından "Ana Ekrana Ekle" diyerek uygulama gibi kullanabilirsin. Yakında mobil uygulama da geliyor.' },
      { q: 'Hangi şehirlerde hizmet veriyorsunuz?', a: 'Şu an Türkiye genelinde aşçı kaydı alıyoruz. Yakınında aşçı varsa sipariş verebilirsin. Aşçı sayısı her geçen gün artıyor.' },
    ],
  },
  {
    cat: 'Sipariş & Teslimat',
    items: [
      { q: 'Minimum sipariş tutarı var mı?', a: 'Aşçıya göre değişir. Her aşçının kendi minimum sipariş tutarı olabilir; profil sayfasında görebilirsin.' },
      { q: 'Teslimat süresi ne kadar?', a: 'Genellikle 30–60 dakika arasında değişir. Sipariş sonrası tahmini süre gösterilir.' },
      { q: 'Siparişimi takip edebilir miyim?', a: 'Evet! Siparişlerim sayfasından anlık durum takibi yapabilirsin. Sipariş yola çıktığında harita görünümü aktif olur.' },
      { q: 'Siparişimi iptal edebilir miyim?', a: 'Aşçı onaylamadan önce ücretsiz iptal edebilirsin. Hazırlık başladıktan sonra iptal aşçının onayına bağlıdır.' },
      { q: 'Gel-al seçeneği var mı?', a: 'Evet, bazı aşçılar gel-al seçeneği sunar. Aşçı profil sayfasında teslimat seçenekleri belirtilir.' },
    ],
  },
  {
    cat: 'Ödeme',
    items: [
      { q: 'Hangi ödeme yöntemleri kabul ediliyor?', a: 'Kredi kartı ve banka kartıyla ödeme yapabilirsin. Ödemeler iyzico güvencesiyle işlenir.' },
      { q: 'Kart bilgilerim güvende mi?', a: 'Kart bilgilerin platformumuzda saklanmaz. Tüm ödeme işlemleri PCI-DSS sertifikalı iyzico altyapısı üzerinden yapılır.' },
      { q: 'Kupon kodu nasıl kullanırım?', a: 'Ödeme sayfasında "Kupon Kodu" alanına kodunu gir. İndirim otomatik olarak uygulanır.' },
      { q: 'Fatura alabilir miyim?', a: 'Şu an e-fatura desteği geliştirme aşamasında. Yakında kullanıma açılacak.' },
    ],
  },
  {
    cat: 'Aşçılar İçin',
    items: [
      { q: 'Aşçı olmak için ne gerekiyor?', a: 'E-posta ile ücretsiz kayıt ol, profil bilgilerini doldur. Ekibimiz 1-2 iş günü içinde profilini inceler ve onaylar.' },
      { q: 'Komisyon oranı nedir?', a: 'Platform her siparişten %10 komisyon alır. Kalan %90 tamamen senin.' },
      { q: 'Kazançlarım ne zaman ödenir?', a: 'Teslim edilen siparişlerin ödemesi 24 saat içinde IBAN\'ına aktarılır.' },
      { q: 'Kaç sipariş alabilirim?', a: 'Günlük stok sistemiyle her yemek için sipariş limitini kendin belirlersin. İstediğin zaman artırıp azaltabilirsin.' },
      { q: 'Çalışma saatlerimi nasıl ayarlarım?', a: 'Dashboard\'dan açık/kapalı durumunu ve çalışma saatlerini istediğin zaman güncelleyebilirsin.' },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '1px solid rgba(232,224,212,0.5)',
      borderRadius: 12, overflow: 'hidden',
      marginBottom: 8,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: open ? '#FEF0EB' : 'white', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#4A2C0E', paddingRight: 16 }}>{q}</span>
        <span style={{ fontSize: 18, color: '#E8622A', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px', background: '#FFFCF9' }}>
          <p style={{ fontSize: 13, color: '#5A4A3A', lineHeight: 1.8, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function SSSPage() {
  const [activecat, setActiveCat] = useState('Genel')

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4A2C0E, #7A4A20)',
        padding: '56px 24px 40px', textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: 'white', margin: '0 0 12px' }}>
          Sık Sorulan Sorular
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Aklındaki soruların cevabını burada bul
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>

        {/* Kategori tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {FAQS.map(({ cat }) => (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{
              padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1.5px solid',
              borderColor: activecat === cat ? '#E8622A' : '#E8E0D4',
              background: activecat === cat ? '#E8622A' : 'white',
              color: activecat === cat ? 'white' : '#4A2C0E',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>

        {/* SSS listesi */}
        {FAQS.filter(f => f.cat === activecat).map(({ items }) => (
          <div key={activecat}>
            {items.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        ))}

        {/* Hâlâ sorun var mı */}
        <div style={{
          marginTop: 48, background: 'white', borderRadius: 16,
          padding: '28px 24px', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(74,44,14,0.07)',
          border: '1px solid rgba(232,224,212,0.4)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 8 }}>
            Sorununu bulamadın mı?
          </h3>
          <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 20 }}>
            Bize ulaş, en kısa sürede yardımcı olalım.
          </p>
          <a href="mailto:destek@anneelim.com" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 24px', background: '#E8622A', color: 'white',
            fontWeight: 700, borderRadius: 10, textDecoration: 'none', fontSize: 13,
          }}>
            ✉️ destek@anneelim.com
          </a>
        </div>

      </div>
    </div>
  )
}