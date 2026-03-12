// @ts-nocheck
'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function OtpInput({ value, onChange, hasError }) {
  const refs = useRef([])

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const next = [...value]; next[idx] = ''; onChange(next)
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  const handleChange = (idx, raw) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return
    if (digits.length > 1) {
      const newValue = [...value]
      for (let i = 0; i < digits.length && idx + i < 6; i++) newValue[idx + i] = digits[i]
      onChange(newValue)
      refs.current[Math.min(idx + digits.length, 5)]?.focus()
      return
    }
    const newValue = [...value]; newValue[idx] = digits; onChange(newValue)
    if (idx < 5) refs.current[idx + 1]?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
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
          style={{
            width: 52, height: 60,
            border: `2px solid ${hasError ? '#DC2626' : value[idx] ? '#7A4A20' : '#E8E0D4'}`,
            borderRadius: 12, textAlign: 'center',
            fontSize: 24, fontWeight: 700,
            color: '#4A2C0E', background: value[idx] ? '#F5EDD8' : 'white',
            outline: 'none', caretColor: 'transparent',
          }}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  )
}

function useCountdown(seconds) {
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
  const supabase = getSupabaseBrowserClient()

  const [digits, setDigits] = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const { remaining, reset } = useCountdown(60)

  const code = digits.join('')
  const isComplete = code.length === 6

  useEffect(() => { if (!phone) router.replace('/giris') }, [phone, router])

  const displayPhone = phone
    ? phone.replace('+90', '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '($1) $2 $3 $4')
    : ''

  const verify = useCallback(async (otpCode) => {
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
        setError(json.error ?? 'Kod hatalı. Lütfen tekrar deneyin.')
        setDigits(Array(6).fill(''))
        return
      }

      // Session'ı set et
      if (json.access_token && json.refresh_token) {
        await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
        })
      }

      // Yönlendir
      if (json.isNewUser) {
        router.push('/giris/profil')
      } else if (json.role === 'chef') {
        router.push('/dashboard')
      } else if (json.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }

    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }, [loading, phone, router, supabase])

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
    <div style={{
      background: 'white', borderRadius: 20, padding: 40,
      boxShadow: '0 4px 24px rgba(74,44,14,0.08)',
      border: '1px solid rgba(232,224,212,0.8)',
      opacity: loading ? 0.8 : 1, transition: 'opacity 0.2s'
    }}>
      <button onClick={() => router.back()} style={{
        background: 'none', border: 'none', fontSize: 13,
        color: '#8A7B6B', cursor: 'pointer', marginBottom: 20,
        fontWeight: 600, padding: 0
      }}>← Geri</button>

      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700,
          letterSpacing: 2, textTransform: 'uppercase', color: '#E8622A',
          background: '#FEF3EC', padding: '4px 10px', borderRadius: 20, marginBottom: 14
        }}>Adım 2 / 3</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 900, color: '#4A2C0E', margin: '0 0 10px' }}>
          Kodu girin<span style={{ color: '#E8622A' }}>.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#8A7B6B', margin: 0 }}>
          <strong>+90 {displayPhone}</strong> numarasına 6 haneli doğrulama kodu gönderdik.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <OtpInput value={digits} onChange={d => { setError(''); setDigits(d) }} hasError={!!error} />
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: '#DC2626', background: '#FEF2F2', padding: '10px 14px',
            borderRadius: 8, border: '1px solid #FECACA'
          }}>⚠️ {error}</div>
        )}
        {loading && (
          <div style={{ textAlign: 'center', color: '#E8622A', fontSize: 13, fontWeight: 600 }}>
            Doğrulanıyor…
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        {remaining > 0 ? (
          <p style={{ fontSize: 13, color: '#8A7B6B', margin: 0 }}>
            Kod gelmedi mi? <strong style={{ color: '#E8622A' }}>{remaining}s</strong> sonra tekrar gönderebilirsiniz.
          </p>
        ) : (
          <button onClick={handleResend} disabled={resending} style={{
            background: 'none', border: 'none', fontSize: 13, fontWeight: 700,
            color: '#E8622A', cursor: 'pointer', padding: 8
          }}>
            {resending ? 'Gönderiliyor…' : '🔄 Kodu Tekrar Gönder'}
          </button>
        )}
      </div>

      <div style={{
        marginTop: 20, padding: '10px 14px', background: '#FFFBEB',
        border: '1px dashed #F59E0B', borderRadius: 8, fontSize: 12, color: '#92400E'
      }}>
        🛠️ <strong>Test modu:</strong> Herhangi bir telefon + kod <code style={{ background: '#FEF3C7', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>123456</code> ile giriş yapabilirsiniz.
      </div>
    </div>
  )
}

export default function OtpPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Yükleniyor…</div>}>
      <OtpPageInner />
    </Suspense>
  )
}