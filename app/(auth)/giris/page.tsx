'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Türkiye telefon numarası validasyonu
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('5')) return '+90' + digits
  if (digits.length === 11 && digits.startsWith('05')) return '+90' + digits.slice(1)
  if (digits.length === 12 && digits.startsWith('905')) return '+' + digits
  if (digits.length === 13 && digits.startsWith('+905')) return digits
  return null
}

function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
  if (digits.length <= 8) return `(${digits.slice(0,3)}) ${digits.slice(3,6)} ${digits.slice(6)}`
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8)}`
}

export default function GirisPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [rawPhone, setRawPhone]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [focused, setFocused]       = useState(false)

  const displayValue = formatDisplay(rawPhone)
  const normalized   = normalizePhone(rawPhone)
  const isValid      = normalized !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Bir sorun oluştu.')
        return
      }

      // OTP sayfasına yönlendir
      router.push(`/giris/otp?phone=${encodeURIComponent(normalized!)}`)
    } catch {
      setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card" data-loading={loading}>

      {/* Başlık */}
      <div className="auth-card-head">
        <div className="auth-step-badge">Adım 1 / 3</div>
        <h1 className="auth-title">
          Hoş geldiniz
          <span className="auth-title-accent">.</span>
        </h1>
        <p className="auth-subtitle">
          Telefon numaranızı girin, size doğrulama kodu gönderelim.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>

        {/* Telefon input */}
        <div className={`phone-field ${focused ? 'focused' : ''} ${error ? 'has-error' : ''} ${isValid && rawPhone ? 'is-valid' : ''}`}>
          <div className="phone-prefix">
            <span className="phone-flag">🇹🇷</span>
            <span className="phone-code">+90</span>
          </div>
          <div className="phone-divider" />
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="(5__) ___ __ __"
            value={displayValue}
            onChange={e => {
              setError('')
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              setRawPhone(digits)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="phone-input"
            autoComplete="tel"
            aria-label="Telefon numarası"
            aria-invalid={!!error}
            aria-describedby={error ? 'phone-error' : undefined}
          />
          {isValid && rawPhone && (
            <div className="phone-check">✓</div>
          )}
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="auth-error" id="phone-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Gönder butonu */}
        <button
          type="submit"
          className="auth-btn"
          disabled={!isValid || loading}
          aria-busy={loading}
        >
          {loading ? (
            <span className="auth-btn-inner">
              <span className="auth-spinner" />
              Gönderiliyor…
            </span>
          ) : (
            <span className="auth-btn-inner">
              Doğrulama Kodu Gönder
              <span className="auth-btn-arrow">→</span>
            </span>
          )}
        </button>

        {/* Bilgi notu */}
        <p className="auth-note">
          🔒 Numaranız yalnızca giriş için kullanılır, üçüncü taraflarla paylaşılmaz.
        </p>
      </form>

      {/* Kayıt yok — OTP otomatik kayıt yapar */}
      <div className="auth-divider">
        <span>Hesabınız yok mu?</span>
      </div>
      <p className="auth-register-note">
        Endişelenmeyin — ilk girişinizde hesabınız otomatik oluşturulur.
      </p>

      <style>{`
        /* ── Kart ───────────────────────────────────────────── */
        .auth-card {
          background: var(--white);
          border-radius: 20px;
          padding: 40px;
          box-shadow:
            0 4px 24px rgba(74,44,14,0.08),
            0 1px 4px rgba(74,44,14,0.06);
          border: 1px solid rgba(232,224,212,0.8);
          transition: opacity 0.2s;
        }

        .auth-card[data-loading="true"] { opacity: 0.7; pointer-events: none; }

        /* ── Başlık ─────────────────────────────────────────── */
        .auth-card-head { margin-bottom: 32px; }

        .auth-step-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--orange);
          background: #FEF3EC;
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 14px;
        }

        .auth-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 900;
          color: var(--brown);
          line-height: 1.1;
          margin: 0 0 10px;
        }

        .auth-title-accent {
          color: var(--orange);
        }

        .auth-subtitle {
          font-size: 14px;
          color: var(--gray);
          line-height: 1.6;
          margin: 0;
        }

        /* ── Form ───────────────────────────────────────────── */
        .auth-form { display: flex; flex-direction: column; gap: 16px; }

        /* ── Telefon input ───────────────────────────────────── */
        .phone-field {
          display: flex;
          align-items: center;
          border: 2px solid var(--gray-light);
          border-radius: 12px;
          background: var(--white);
          transition: border-color 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }

        .phone-field.focused {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232,98,42,0.12);
        }

        .phone-field.has-error {
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.10);
        }

        .phone-field.is-valid {
          border-color: var(--green);
        }

        .phone-prefix {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 14px 14px 14px 16px;
          flex-shrink: 0;
        }

        .phone-flag { font-size: 18px; line-height: 1; }

        .phone-code {
          font-size: 15px;
          font-weight: 700;
          color: var(--brown);
        }

        .phone-divider {
          width: 1px;
          height: 24px;
          background: var(--gray-light);
          flex-shrink: 0;
        }

        .phone-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 14px 12px;
          font-size: 18px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown);
          background: transparent;
          letter-spacing: 0.5px;
        }

        .phone-input::placeholder {
          color: rgba(138,123,107,0.4);
          font-weight: 400;
          font-size: 16px;
          letter-spacing: 2px;
        }

        .phone-check {
          padding: 0 16px;
          color: var(--green);
          font-size: 18px;
          font-weight: 700;
        }

        /* ── Hata ───────────────────────────────────────────── */
        .auth-error {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #DC2626;
          background: #FEF2F2;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #FECACA;
          animation: shake 0.3s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        /* ── Buton ──────────────────────────────────────────── */
        .auth-btn {
          width: 100%;
          padding: 16px 24px;
          background: var(--orange);
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .auth-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .auth-btn:hover:not(:disabled)::before { opacity: 1; }

        .auth-btn:hover:not(:disabled) {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,98,42,0.4);
        }

        .auth-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .auth-btn:disabled {
          background: var(--gray-light);
          color: var(--gray);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .auth-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .auth-btn-arrow {
          font-size: 18px;
          transition: transform 0.2s;
        }

        .auth-btn:hover:not(:disabled) .auth-btn-arrow {
          transform: translateX(4px);
        }

        /* ── Spinner ────────────────────────────────────────── */
        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Not ────────────────────────────────────────────── */
        .auth-note {
          font-size: 11.5px;
          color: var(--gray);
          text-align: center;
          line-height: 1.6;
          margin: 0;
        }

        /* ── Divider & Kayıt notu ──────────────────────────── */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 12px;
          color: var(--gray);
          font-size: 12px;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--gray-light);
        }

        .auth-register-note {
          font-size: 12.5px;
          color: var(--brown-mid);
          text-align: center;
          margin: 0;
          line-height: 1.6;
          background: var(--warm);
          padding: 10px 16px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}
