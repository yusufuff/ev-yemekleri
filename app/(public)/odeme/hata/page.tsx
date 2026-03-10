'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ── Hata türleri ──────────────────────────────────────────────────────────────
const ERROR_META: Record<string, {
  emoji:   string
  title:   string
  desc:    string
  action?: string
  href?:   string
}> = {
  payment_failed: {
    emoji:  '💳',
    title:  'Ödeme Başarısız',
    desc:   'Kartınızdan ödeme alınamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz.',
    action: 'Tekrar Dene',
    href:   '/odeme',
  },
  order_not_found: {
    emoji:  '🔍',
    title:  'Sipariş Bulunamadı',
    desc:   'Siparişinize ait bilgi bulunamadı. Siparişlerim sayfasını kontrol edin.',
    action: 'Siparişlerime Git',
    href:   '/siparislerim',
  },
  no_token: {
    emoji:  '⚠️',
    title:  'Geçersiz İstek',
    desc:   'Ödeme oturumunuz sona ermiş olabilir. Lütfen tekrar sipariş verin.',
    action: 'Sepete Dön',
    href:   '/odeme',
  },
  stock_error: {
    emoji:  '📦',
    title:  'Stok Yetersiz',
    desc:   'Sipariş verdiğiniz sırada ürün stoku tükendi. Menüden güncel seçenekleri inceleyebilirsiniz.',
    action: 'Menüye Dön',
    href:   '/kesif',
  },
  session_expired: {
    emoji:  '⏱️',
    title:  'Oturum Süresi Doldu',
    desc:   'Ödeme sayfasında çok uzun beklendi. Lütfen tekrar giriş yapıp siparişinizi tamamlayın.',
    action: 'Giriş Yap',
    href:   '/giris',
  },
  default: {
    emoji:  '😔',
    title:  'Bir Hata Oluştu',
    desc:   'İşleminiz tamamlanamadı. Tekrar denemenizi öneririz.',
    action: 'Sepete Dön',
    href:   '/odeme',
  },
}

// ── SSS: Ödeme sorunları ──────────────────────────────────────────────────────
const PAYMENT_FAQS = [
  {
    q: 'Kartımdan para çekildi ama sipariş oluşmadı, ne yapmalıyım?',
    a: 'Endişelenmeyin — başarısız işlemler otomatik olarak iade edilir (1–5 iş günü). Destek ekibimizle iletişime geçebilirsiniz.',
  },
  {
    q: 'Hangi kartları kabul ediyorsunuz?',
    a: 'Visa, Mastercard ve American Express kartlarının yanı sıra tüm Türk banka kartları (debit) desteklenmektedir.',
  },
  {
    q: 'Taksitli ödeme yapabilir miyim?',
    a: 'Evet, seçili bankaların kredi kartlarıyla 2, 3, 6 ve 9 taksit seçeneği sunulmaktadır.',
  },
]

function OdemeHataInner() {
  const searchParams = useSearchParams()
  const reason       = searchParams.get('reason') ?? 'default'
  const orderId      = searchParams.get('order_id')

  const meta = ERROR_META[reason] ?? ERROR_META.default

  return (
    <div className="eh-wrap">

      {/* ── Ana hata kartı ── */}
      <div className="eh-card">
        <div className="eh-emoji">{meta.emoji}</div>
        <h1 className="eh-title">{meta.title}</h1>
        <p className="eh-desc">{meta.desc}</p>

        {orderId && (
          <div className="eh-order-ref">
            Sipariş referansı: <strong>{orderId.slice(0, 8).toUpperCase()}</strong>
          </div>
        )}

        <div className="eh-actions">
          {meta.href && meta.action && (
            <Link href={meta.href} className="eh-btn-primary">
              {meta.action}
            </Link>
          )}
          <Link href="/kesif" className="eh-btn-secondary">
            Ana Sayfaya Dön
          </Link>
          {orderId && (
            <Link href="/siparislerim" className="eh-btn-ghost">
              Siparişlerimim
            </Link>
          )}
        </div>
      </div>

      {/* ── Destek kutusu ── */}
      <div className="eh-support">
        <div className="eh-support-icon">🆘</div>
        <div className="eh-support-info">
          <div className="eh-support-title">Sorun devam mı ediyor?</div>
          <div className="eh-support-sub">
            Destek ekibimiz 7/24 yardıma hazır.
          </div>
        </div>
        <a href="mailto:destek@evyemekleri.com" className="eh-support-btn">
          📧 Destek Al
        </a>
      </div>

      {/* ── SSS ── */}
      {reason === 'payment_failed' && (
        <div className="eh-faq">
          <div className="eh-faq-title">Sık Sorulan Sorular</div>
          {PAYMENT_FAQS.map((faq, i) => (
            <details key={i} className="eh-faq-item">
              <summary className="eh-faq-q">{faq.q}</summary>
              <div className="eh-faq-a">{faq.a}</div>
            </details>
          ))}
        </div>
      )}

      {/* ── Güvenlik notu ── */}
      <div className="eh-security">
        <div className="eh-sec-badges">
          <span>🔒 SSL Şifrelemeli</span>
          <span>🏦 İyzico Altyapısı</span>
          <span>💳 PCI DSS Uyumlu</span>
        </div>
        <div className="eh-sec-note">
          Kart bilgileriniz hiçbir zaman sunucularımızda saklanmaz.
        </div>
      </div>

      <style>{`
        .eh-wrap {
          max-width: 560px;
          margin: 0 auto;
          padding: 24px 0 48px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Ana kart ───────────────────── */
        .eh-card {
          background: var(--white);
          border-radius: 20px; padding: 40px 32px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(74,44,14,0.10);
          border: 1.5px solid #FECACA;
        }

        .eh-emoji {
          font-size: 56px;
          margin-bottom: 16px;
          animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes bounce-in {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        .eh-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 900;
          color: var(--brown); margin: 0 0 10px;
        }

        .eh-desc {
          font-size: 14px; color: var(--gray);
          line-height: 1.7; margin: 0 0 16px;
        }

        .eh-order-ref {
          font-size: 12px; color: var(--gray);
          background: var(--warm); padding: 6px 14px;
          border-radius: 20px; display: inline-block;
          margin-bottom: 20px;
          font-family: monospace;
        }

        .eh-actions {
          display: flex; flex-direction: column; gap: 8px;
        }

        .eh-btn-primary {
          display: block; padding: 14px;
          background: var(--orange); color: white;
          border-radius: 12px; text-decoration: none;
          font-size: 15px; font-weight: 700;
          transition: all 0.2s;
        }

        .eh-btn-primary:hover {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,98,42,0.4);
        }

        .eh-btn-secondary {
          display: block; padding: 12px;
          background: var(--warm); color: var(--brown-mid);
          border-radius: 12px; text-decoration: none;
          font-size: 13.5px; font-weight: 700;
          border: 1.5px solid var(--gray-light);
          transition: all 0.15s;
        }

        .eh-btn-secondary:hover { border-color: var(--brown); color: var(--brown); }

        .eh-btn-ghost {
          display: block; padding: 10px;
          background: transparent; color: var(--gray);
          border-radius: 12px; text-decoration: none;
          font-size: 13px; font-weight: 600;
          border: 1.5px solid var(--gray-light);
          transition: all 0.15s;
        }

        .eh-btn-ghost:hover { border-color: var(--gray); color: var(--brown); }

        /* ── Destek ─────────────────────── */
        .eh-support {
          background: var(--white);
          border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: center; gap: 14px;
          box-shadow: 0 2px 10px rgba(74,44,14,0.06);
          border: 1px solid rgba(232,224,212,0.6);
        }

        .eh-support-icon { font-size: 28px; flex-shrink: 0; }

        .eh-support-info { flex: 1; }

        .eh-support-title {
          font-weight: 700; font-size: 13.5px; color: var(--brown);
          margin-bottom: 3px;
        }

        .eh-support-sub { font-size: 12px; color: var(--gray); }

        .eh-support-btn {
          padding: 9px 16px;
          background: var(--brown); color: white;
          border-radius: 10px; text-decoration: none;
          font-size: 12.5px; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
          transition: background 0.15s;
        }

        .eh-support-btn:hover { background: var(--brown-mid); }

        /* ── SSS ────────────────────────── */
        .eh-faq {
          background: var(--white);
          border-radius: 14px; padding: 18px 20px;
          box-shadow: 0 2px 10px rgba(74,44,14,0.06);
          border: 1px solid rgba(232,224,212,0.6);
        }

        .eh-faq-title {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700;
          color: var(--brown); margin-bottom: 12px;
        }

        .eh-faq-item {
          border-bottom: 1px solid var(--gray-light);
          padding-bottom: 10px; margin-bottom: 10px;
        }

        .eh-faq-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

        .eh-faq-q {
          font-size: 13px; font-weight: 600; color: var(--brown);
          cursor: pointer; list-style: none;
          display: flex; justify-content: space-between; align-items: center;
          gap: 8px;
        }

        .eh-faq-q::after {
          content: '+'; font-size: 16px; color: var(--orange);
          flex-shrink: 0; transition: transform 0.2s;
        }

        details[open] .eh-faq-q::after { transform: rotate(45deg); }

        .eh-faq-a {
          font-size: 12.5px; color: var(--gray);
          line-height: 1.6; padding-top: 8px;
        }

        /* ── Güvenlik ───────────────────── */
        .eh-security {
          text-align: center;
        }

        .eh-sec-badges {
          display: flex; justify-content: center; gap: 12px;
          flex-wrap: wrap; margin-bottom: 8px;
        }

        .eh-sec-badges span {
          font-size: 11px; color: var(--gray);
          background: var(--warm); padding: 4px 12px;
          border-radius: 20px; font-weight: 600;
          border: 1px solid var(--gray-light);
        }

        .eh-sec-note {
          font-size: 11px; color: var(--gray); line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

export default function OdemeHataPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
        Yükleniyor…
      </div>
    }>
      <OdemeHataInner />
    </Suspense>
  )
}
