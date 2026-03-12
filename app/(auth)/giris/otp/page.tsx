'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ── OTP Input Bileşeni ─────────────────────────────────────────────────────────
interface OtpInputProps {
  value: string[]
  onChange: (digits: string[]) => void
  hasError: boolean
}

function OtpInput({ value, onChange, hasError }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        // Mevcut kutuyu temizle
        const next = [...value]
        next[idx] = ''
        onChange(next)
      } else if (idx > 0) {
        // Önceki kutuya git
        refs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  const handleChange = (idx: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return

    if (digits.length > 1) {
      // Paste işlemi — birden fazla digit
      const newValue = [...value]
      for (let i = 0; i < digits.length && idx + i < 6; i++) {
        newValue[idx + i] = digits[i]
      }
      onChange(newValue)
      const nextIdx = Math.min(idx + digits.length, 5)
      refs.current[nextIdx]?.focus()
      return
    }

    const newValue = [...value]
    newValue[idx] = digits
    onChange(newValue)

    // Sonraki kutuya otomatik geç
    if (idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  return (
    <div className="otp-boxes" role="group" aria-label="Doğrulama kodu">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={value[idx] || ''}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onFocus={e => e.target.select()}
          className={`otp-box ${value[idx] ? 'filled' : ''} ${hasError ? 'error' : ''}`}
          aria-label={`${idx + 1}. rakam`}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
        />
      ))}
      <style>{`
        .otp-boxes {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .otp-box {
          width: 52px;
          height: 60px;
          border: 2px solid var(--gray-light);
          border-radius: 12px;
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
          color: var(--brown);
          background: var(--white);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
          caret-color: transparent;
        }

        .otp-box:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232,98,42,0.15);
          transform: scale(1.04);
        }

        .otp-box.filled {
          border-color: var(--brown-mid);
          background: var(--warm);
        }

        .otp-box.error {
          border-color: #DC2626;
          background: #FEF2F2;
          animation: shake 0.3s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-4px); }
          75%       { transform: translateX(4px); }
        }

        @media (max-width: 380px) {
          .otp-box { width: 44px; height: 52px; font-size: 20px; }
          .otp-boxes { gap: 7px; }
        }
      `}</style>
    </div>
  )
}

// ── Geri sayım hook ────────────────────────────────────────────────────────────
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [remaining])
  return { remaining, reset: () => setRemaining(seconds) }
}

// ── Ana sayfa ──────────────────────────────────────────────────────────────────
function OtpPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const phone        = searchParams.get('phone') ?? ''

  const [digits, setDigits]   = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [resending, setResending] = useState(false)

  const { remaining, reset } = useCountdown(60)

  const code = digits.join('')
  const isComplete = code.length === 6

  // Telefon numarası yoksa giriş sayfasına dön
  useEffect(() => {
    if (!phone) router.replace('/giris')
  }, [phone, router])

  // Gösterim için formatla
  const displayPhone = phone
    ? phone.replace('+90', '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '($1) $2 $3 $4')
    : ''

  const verify = useCallback(async (otpCode: string) => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Kod hatali. Lutfen tekrar deneyin.')
        setDigits(Array(6).fill(''))
        return
      }

      // Supabase session kur
      if (json.access_token && json.refresh_token) {
        const supabase = getSupabaseBrowserClient()
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        })
        if (sessionError) {
          setError('Oturum kurulamadi. Lutfen tekrar deneyin.')
          return
        }
      }

      // Tam sayfa yonlendirme - cookie'nin middleware'e gitmesi icin
      if (json.isNewUser) {
        window.location.href = '/giris/profil'
      } else {
        const redirectTo = json.role === 'chef' ? '/dashboard' : '/'
        window.location.href = redirectTo
      }
    } catch {
      setError('Baglanti hatasi. Lutfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }, [loading, phone, router])

  // 6. rakam girilince otomatik doğrula
  useEffect(() => {
    if (isComplete) verify(code)
  }, [isComplete, code, verify])

  async function handleResend() {
    if (remaining > 0 || resending) return
    setResending(true)
    setError('')
    setDigits(Array(6).fill(''))

    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      reset()
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-card otp-card" data-loading={loading}>

      {/* Geri butonu */}
      <button
        className="otp-back"
        onClick={() => router.back()}
        aria-label="Geri git"
      >
        ← Geri
      </button>

      {/* Başlık */}
      <div className="auth-card-head">
        <div className="auth-step-badge">Adım 2 / 3</div>
        <h1 className="auth-title">
          Kodu girin
          <span className="auth-title-accent">.</span>
        </h1>
        <p className="auth-subtitle">
          <strong>+90 {displayPhone}</strong> numarasına 6 haneli doğrulama kodu gönderdik.
        </p>
      </div>

      {/* OTP Kutular */}
      <div className="otp-section">
        <OtpInput
          value={digits}
          onChange={digits => { setError(''); setDigits(digits) }}
          hasError={!!error}
        />

        {/* Hata */}
        {error && (
          <div className="auth-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Yükleniyor göstergesi */}
        {loading && (
          <div className="otp-loading">
            <span className="auth-spinner" style={{ borderColor: 'rgba(232,98,42,0.3)', borderTopColor: 'var(--orange)' }} />
            <span>Doğrulanıyor…</span>
          </div>
        )}
      </div>

      {/* Yeniden gönder */}
      <div className="resend-section">
        {remaining > 0 ? (
          <p className="resend-countdown">
            Kod gelmedi mi? <strong>{remaining}s</strong> sonra tekrar gönderebilirsiniz.
          </p>
        ) : (
          <button
            className="resend-btn"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Gönderiliyor…' : '🔁 Kodu Tekrar Gönder'}
          </button>
        )}
      </div>

      {/* Geliştirme modu notu */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-note">
          🛠️ <strong>Dev modu:</strong> OTP terminal logunda görünür. Test için: <code>123456</code>
        </div>
      )}

      <style>{`
        .otp-card { position: relative; }

        .otp-back {
          position: absolute;
          top: -8px;
          left: 0;
          background: none;
          border: none;
          font-size: 13px;
          color: var(--gray);
          cursor: pointer;
          padding: 4px 0;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          transition: color 0.15s;
          transform: translateY(-100%) translateY(-8px);
        }

        .otp-back:hover { color: var(--brown); }

        .auth-card-head { margin-bottom: 28px; }

        .otp-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }

        .otp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: var(--orange);
          font-weight: 600;
        }

        .resend-section { text-align: center; }

        .resend-countdown {
          font-size: 13px;
          color: var(--gray);
          margin: 0;
        }

        .resend-countdown strong {
          display: inline-block;
          color: var(--orange);
          font-variant-numeric: tabular-nums;
          min-width: 28px;
          text-align: center;
          background: #FEF3EC;
          border-radius: 4px;
          padding: 0 6px;
        }

        .resend-btn {
          background: none;
          border: none;
          font-size: 13.5px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          color: var(--orange);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.15s;
        }

        .resend-btn:hover { background: #FEF3EC; }
        .resend-btn:disabled { color: var(--gray); cursor: default; background: none; }

        .dev-note {
          margin-top: 20px;
          padding: 10px 14px;
          background: #FFFBEB;
          border: 1px dashed #F59E0B;
          border-radius: 8px;
          font-size: 12px;
          color: #92400E;
        }

        .dev-note code {
          background: #FEF3C7;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 700;
        }

        /* Auth card — shared */
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

        .auth-card[data-loading="true"] { opacity: 0.85; }

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

        .auth-title-accent { color: var(--orange); }

        .auth-subtitle {
          font-size: 14px;
          color: var(--gray);
          line-height: 1.6;
          margin: 0;
        }

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
        }

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
      `}</style>
    </div>
  )
}

export default function OtpPage() {
  return (
    <Suspense fallback={<div className="auth-card" style={{ padding: 40 }}>Yükleniyor…</div>}>
      <OtpPageInner />
    </Suspense>
  )
}