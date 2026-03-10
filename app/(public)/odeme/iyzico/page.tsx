'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function IyzicoFormInner() {
  const searchParams = useSearchParams()
  const orderId      = searchParams.get('order_id')
  const token        = searchParams.get('token')

  const [formHtml,  setFormHtml]  = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!orderId) { setError('Geçersiz sipariş.'); setIsLoading(false); return }

    // İyzico form HTML'ini çek
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.checkout_form_content) {
          setFormHtml(data.checkout_form_content)
        } else {
          setError(data.error ?? 'Ödeme formu yüklenemedi.')
        }
        setIsLoading(false)
      })
      .catch(() => {
        setError('Bağlantı hatası.')
        setIsLoading(false)
      })
  }, [orderId])

  // İyzico'nun script'ini çalıştır (innerHTML sonrası)
  useEffect(() => {
    if (!formHtml || !containerRef.current) return

    containerRef.current.innerHTML = formHtml

    // İyzico'nun inline script'lerini aktif et
    const scripts = containerRef.current.querySelectorAll('script')
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script')
      if (oldScript.src) {
        newScript.src = oldScript.src
        newScript.async = true
      } else {
        newScript.textContent = oldScript.textContent
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript)
    })
  }, [formHtml])

  return (
    <div className="iyz-wrap">
      {/* Başlık */}
      <div className="iyz-header">
        <div className="iyz-logo">🔒 Güvenli Ödeme</div>
        <div className="iyz-powered">İyzico altyapısıyla güvence altında</div>
      </div>

      {/* Yükleniyor */}
      {isLoading && (
        <div className="iyz-loading">
          <div className="iyz-spinner" />
          <div>Ödeme formu hazırlanıyor…</div>
          <div className="iyz-loading-sub">Banka bağlantısı kuruluyor</div>
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="iyz-error">
          <div className="iyz-error-icon">⚠️</div>
          <div className="iyz-error-text">{error}</div>
          <a href="/odeme" className="iyz-retry-btn">← Sepete Dön</a>
        </div>
      )}

      {/* İyzico form container */}
      {formHtml && (
        <div
          ref={containerRef}
          className="iyz-form-container"
          aria-label="İyzico ödeme formu"
        />
      )}

      {/* Alt bilgi */}
      <div className="iyz-footer-notes">
        <div className="iyz-badge">🛡️ SSL şifrelemeli</div>
        <div className="iyz-badge">🏦 3D Secure</div>
        <div className="iyz-badge">💳 Taksit seçeneği</div>
      </div>

      <style>{`
        .iyz-wrap {
          max-width: 560px;
          margin: 0 auto;
          padding: 24px 0;
        }

        .iyz-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .iyz-logo {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--brown);
          margin-bottom: 4px;
        }

        .iyz-powered {
          font-size: 12px;
          color: var(--gray);
        }

        .iyz-loading {
          background: var(--white);
          border-radius: 16px;
          padding: 60px 24px;
          text-align: center;
          box-shadow: 0 2px 16px rgba(74,44,14,0.08);
          border: 1px solid rgba(232,224,212,0.6);
          color: var(--brown);
          font-size: 15px;
          font-weight: 600;
        }

        .iyz-spinner {
          width: 44px; height: 44px;
          border: 4px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .iyz-loading-sub {
          font-size: 12px;
          color: var(--gray);
          margin-top: 6px;
          font-weight: 400;
        }

        .iyz-error {
          background: #FEF2F2;
          border: 1.5px solid #FECACA;
          border-radius: 16px;
          padding: 40px 24px;
          text-align: center;
        }

        .iyz-error-icon { font-size: 40px; margin-bottom: 12px; }

        .iyz-error-text {
          font-size: 14px;
          color: #DC2626;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .iyz-retry-btn {
          display: inline-block;
          padding: 10px 20px;
          background: var(--orange);
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: background 0.15s;
        }

        .iyz-retry-btn:hover { background: #d4541e; }

        /* İyzico'nun kendi form stillerini override etme */
        .iyz-form-container {
          background: var(--white);
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(74,44,14,0.08);
          border: 1px solid rgba(232,224,212,0.6);
          overflow: hidden;
          min-height: 400px;
        }

        /* İyzico iframe düzeltmeleri */
        .iyz-form-container iframe {
          width: 100% !important;
          border: none !important;
        }

        .iyz-footer-notes {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .iyz-badge {
          font-size: 11px;
          color: var(--gray);
          background: var(--warm);
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 600;
          border: 1px solid var(--gray-light);
        }
      `}</style>
    </div>
  )
}

export default function IyzicoPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
        Yükleniyor…
      </div>
    }>
      <IyzicoFormInner />
    </Suspense>
  )
}
