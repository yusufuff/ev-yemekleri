'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
        const next = [...value]
        next[idx] = ''
        onChange(next)
      } else if (idx > 0) {
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
    if (idx < 5) refs.current[idx + 1]?.focus()
  }

  return (
    <div className="otp-boxes">
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
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
        />
      ))}
      <style>{`
        .otp-boxes { display: flex; gap: 10px; justify-content: center; }
        .otp-box { width: 52px; height: 60px; border: 2px solid var(--gray-light); border-radius: 12px; text-align: center; font-size: 24px; font-weight: 700; color: var(--brown); background: var(--white); outline: none; transition: border-color 0.15s; caret-color: transparent; }
        .otp-box:focus { border-color: var(--orange); box-shadow: 0 0 0 3px rgba(232,98,42,0.15); }
        .otp-box.filled { border-color: var(--brown-mid); background: var(--warm); }
        .otp-box.error { border-color: #DC2626; background: #FEF2F2; animation: shake 0.3s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @media (max-width: 380px) { .otp-box { width: 44px; height: 52px; font-size: 20px; } .otp-boxes { gap: 7px; } }
      `}</style>
    </div>
  )
}

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [remaining])
  return { remaining, reset: () => setRemaining(seconds) }
}

function OtpPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') ?? ''

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)

  const { remaining, reset } = useCountdown(60)
  const code = digits.join('')
  const isComplete = code.length === 6

  useEffect(() => {
    if (!phone) router.replace('/giris')
  }, [phone, router])

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
        setError(json.error ?? 'Kod hatali.')
        setDigits(Array(6).fill(''))
        return
      }

      if (json.access_token && json.refresh_token) {
        const redirectTo = json.isNewUser ? '/giris/profil' : (json.role === 'chef' ? '/dashboard' : '/')
        const callbackUrl = `/api/auth/session?access_token=${json.access_token}&refresh_token=${json.refresh_token}&redirectTo=${encodeURIComponent(redirectTo)}`
        window.location.href = callbackUrl
      } else {
        setError('Oturum bilgisi alinamadi.')
      }
    } catch {
      setError('Baglanti hatasi.')
    } finally {
      setLoading(false)
    }
  }, [loading, phone])

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
      <button className="otp-back" onClick={() => router.back()}>← Geri</button>
      <div className="auth-card-head">
        <div className="auth-step-badge">Adim 2 / 3</div>
        <h1 className="auth-title">Kodu girin<span className="auth-title-accent">.</span></h1>
        <p className="auth-subtitle"><strong>+90 {displayPhone}</strong> numarasina 6 haneli kod gonderdik.</p>
      </div>
      <div className="otp-section">
        <OtpInput value={digits} onChange={d => { setError(''); setDigits(d) }} hasError={!!error} />
        {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
        {loading && <div className="otp-loading"><span className="auth-spinner" />  <span>Dogrulanıyor…</span></div>}
      </div>
      <div className="resend-section">
        {remaining > 0
          ? <p className="resend-countdown">Kod gelmedi mi? <strong>{remaining}s</strong> sonra tekrar gonderin.</p>
          : <button className="resend-btn" onClick={handleResend} disabled={resending}>{resending ? 'Gonderiliyor…' : '🔁 Kodu Tekrar Gonder'}</button>
        }
      </div>
      <style>{`
        .otp-card { position: relative; }
        .otp-back { position: absolute; top: -40px; left: 0; background: none; border: none; font-size: 13px; color: var(--gray); cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; }
        .otp-back:hover { color: var(--brown); }
        .auth-card-head { margin-bottom: 28px; }
        .otp-section { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
        .otp-loading { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: var(--orange); font-weight: 600; }
        .resend-section { text-align: center; }
        .resend-countdown { font-size: 13px; color: var(--gray); margin: 0; }
        .resend-countdown strong { color: var(--orange); background: #FEF3EC; border-radius: 4px; padding: 0 6px; }
        .resend-btn { background: none; border: none; font-size: 13.5px; font-weight: 700; font-family: 'DM Sans', sans-serif; color: var(--orange); cursor: pointer; padding: 8px; border-radius: 8px; }
        .resend-btn:hover { background: #FEF3EC; }
        .auth-card { background: var(--white); border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(74,44,14,0.08); border: 1px solid rgba(232,224,212,0.8); }
        .auth-step-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--orange); background: #FEF3EC; padding: 4px 10px; border-radius: 20px; margin-bottom: 14px; }
        .auth-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; color: var(--brown); line-height: 1.1; margin: 0 0 10px; }
        .auth-title-accent { color: var(--orange); }
        .auth-subtitle { font-size: 14px; color: var(--gray); line-height: 1.6; margin: 0; }
        .auth-error { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #DC2626; background: #FEF2F2; padding: 10px 14px; border-radius: 8px; border: 1px solid #FECACA; }
        .auth-spinner { width: 18px; height: 18px; border: 2px solid rgba(232,98,42,0.3); border-top-color: var(--orange); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function OtpPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Yukleniyor…</div>}>
      <OtpPageInner />
    </Suspense>
  )
}