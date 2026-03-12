'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'buyer' | 'chef'

interface RoleCardProps {
  role: Role
  selected: boolean
  onSelect: () => void
  emoji: string
  title: string
  desc: string
  tags: string[]
}

function RoleCard({ role, selected, onSelect, emoji, title, desc, tags }: RoleCardProps) {
  return (
    <button
      type="button"
      className={`role-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="role-card-emoji">{emoji}</div>
      <div className="role-card-body">
        <div className="role-card-title">{title}</div>
        <div className="role-card-desc">{desc}</div>
        <div className="role-card-tags">
          {tags.map(t => (
            <span key={t} className="role-tag">{t}</span>
          ))}
        </div>
      </div>
      <div className="role-card-check" aria-hidden="true">
        {selected ? '✓' : ''}
      </div>
      <style>{`
        .role-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          width: 100%;
          padding: 18px 16px;
          border: 2px solid var(--gray-light);
          border-radius: 14px;
          background: var(--white);
          cursor: pointer;
          text-align: left;
          transition: all 0.18s;
          position: relative;
        }

        .role-card:hover:not(.selected) {
          border-color: rgba(232,98,42,0.4);
          background: #FFF9F5;
          transform: translateY(-1px);
        }

        .role-card.selected {
          border-color: var(--orange);
          background: #FFF5EF;
          box-shadow: 0 0 0 1px var(--orange), 0 4px 16px rgba(232,98,42,0.15);
        }

        .role-card-emoji {
          font-size: 32px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .role-card-body { flex: 1; }

        .role-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--brown);
          margin-bottom: 4px;
        }

        .role-card-desc {
          font-size: 12.5px;
          color: var(--gray);
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .role-card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .role-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          background: var(--warm);
          color: var(--brown-mid);
        }

        .role-card.selected .role-tag {
          background: rgba(232,98,42,0.1);
          color: var(--orange);
        }

        .role-card-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--gray-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.18s;
          color: white;
        }

        .role-card.selected .role-card-check {
          background: var(--orange);
          border-color: var(--orange);
        }
      `}</style>
    </button>
  )
}

export default function ProfilPage() {
  const router = useRouter()

  const [fullName, setFullName]     = useState('')
  const [role, setRole]             = useState<Role>('buyer')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [nameError, setNameError]   = useState('')
  const [accessToken, setAccessToken] = useState('')

  // localStorage'dan token al, Supabase browser session kur
  useEffect(() => {
    const at = localStorage.getItem('ev_access_token') || ''
    const rt = localStorage.getItem('ev_refresh_token') || ''
    setAccessToken(at)

    if (at && rt) {
      import('@/lib/supabase/client').then(({ getSupabaseBrowserClient }) => {
        const supabase = getSupabaseBrowserClient()
        supabase.auth.setSession({ access_token: at, refresh_token: rt })
      })
    }
  }, [])

  const nameValid = fullName.trim().length >= 3

  function validateName(val: string) {
    if (val.trim().length < 3) {
      setNameError('En az 3 karakter giriniz.')
    } else {
      setNameError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValid || loading) return

    setError('')
    setLoading(true)

    try {
      const at = localStorage.getItem('ev_access_token') || ''
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(at ? { 'Authorization': `Bearer ${at}` } : {}),
        },
        body: JSON.stringify({ full_name: fullName.trim(), role }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Profil oluşturulamadı.')
        return
      }

      // Role göre yönlendir
      if (role === 'chef') {
        router.push('/giris/onboarding')  // Aşçı onboarding akışı
      } else {
        router.push('/?welcome=1')
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card profil-card" data-loading={loading}>

      {/* Başlık */}
      <div className="auth-card-head">
        <div className="auth-step-badge">Adım 3 / 3</div>
        <h1 className="auth-title">
          Sizi tanıyalım
          <span className="auth-title-accent">.</span>
        </h1>
        <p className="auth-subtitle">
          Hesabınızı kurmak için birkaç bilgiye ihtiyacımız var.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="profil-form" noValidate>

        {/* İsim */}
        <div className="form-group">
          <label className="form-label" htmlFor="full-name">
            Ad Soyad <span className="required">*</span>
          </label>
          <input
            id="full-name"
            type="text"
            className={`form-input-field ${nameError ? 'has-error' : ''} ${nameValid && fullName ? 'is-valid' : ''}`}
            placeholder="Adınız Soyadınız"
            value={fullName}
            autoComplete="name"
            onChange={e => {
              setFullName(e.target.value)
              if (nameError) validateName(e.target.value)
            }}
            onBlur={() => validateName(fullName)}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError && (
            <span className="field-error" id="name-error">{nameError}</span>
          )}
        </div>

        {/* Rol seçimi */}
        <div className="form-group">
          <label className="form-label">
            Platformu nasıl kullanacaksınız? <span className="required">*</span>
          </label>
          <div className="role-cards">
            <RoleCard
              role="buyer"
              selected={role === 'buyer'}
              onSelect={() => setRole('buyer')}
              emoji="🛒"
              title="Sipariş Vermek İstiyorum"
              desc="Yakınımdaki ev aşçılarından yemek sipariş edelim."
              tags={['Hızlı kurulum', 'Ücretsiz']}
            />
            <RoleCard
              role="chef"
              selected={role === 'chef'}
              onSelect={() => setRole('chef')}
              emoji="👩‍🍳"
              title="Aşçı Olarak Katılmak İstiyorum"
              desc="Kendi mutfağımdan yemek satarak gelir elde edeyim."
              tags={['%10 komisyon', 'Kendi fiyatlarım', 'Esnek saat']}
            />
          </div>
        </div>

        {/* Genel hata */}
        {error && (
          <div className="auth-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Gönder */}
        <button
          type="submit"
          className="auth-btn"
          disabled={!nameValid || loading}
          aria-busy={loading}
        >
          {loading ? (
            <span className="auth-btn-inner">
              <span className="auth-spinner" />
              Hesap oluşturuluyor…
            </span>
          ) : (
            <span className="auth-btn-inner">
              {role === 'chef' ? '👩‍🍳 Aşçı Hesabı Oluştur' : '🛒 Hesabı Oluştur'}
              <span className="auth-btn-arrow">→</span>
            </span>
          )}
        </button>

        {role === 'chef' && (
          <p className="chef-note">
            📋 Aşçı hesabı açtıktan sonra kimlik ve mutfak belgelerinizi yükleyeceksiniz. Onay 1–2 iş günü içinde tamamlanır.
          </p>
        )}

        {/* KVKK */}
        <p className="kvkk-note">
          Devam ederek{' '}
          <a href="/kullanim-kosullari" target="_blank">Kullanım Koşulları</a>
          {' '}ve{' '}
          <a href="/kvkk" target="_blank">KVKK Aydınlatma Metni</a>
          &apos;ni kabul etmiş sayılırsınız.
        </p>
      </form>

      <style>{`
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

        .auth-card-head { margin-bottom: 28px; }

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
          font-size: 34px;
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

        .profil-form { display: flex; flex-direction: column; gap: 20px; }

        .form-group { display: flex; flex-direction: column; gap: 8px; }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--brown-mid);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .required { color: var(--orange); }

        .form-input-field {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid var(--gray-light);
          border-radius: 12px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown);
          background: var(--white);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input-field:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232,98,42,0.12);
        }

        .form-input-field.has-error {
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.10);
        }

        .form-input-field.is-valid {
          border-color: var(--green);
        }

        .field-error {
          font-size: 12px;
          color: #DC2626;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .role-cards { display: flex; flex-direction: column; gap: 10px; }

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
        }

        .auth-btn:hover:not(:disabled) {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,98,42,0.4);
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

        .auth-btn-arrow { font-size: 18px; transition: transform 0.2s; }
        .auth-btn:hover:not(:disabled) .auth-btn-arrow { transform: translateX(4px); }

        .auth-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .chef-note {
          font-size: 12.5px;
          color: var(--brown-mid);
          background: var(--warm);
          padding: 12px 14px;
          border-radius: 10px;
          border-left: 3px solid var(--orange);
          margin: 0;
          line-height: 1.6;
        }

        .kvkk-note {
          font-size: 11.5px;
          color: var(--gray);
          text-align: center;
          line-height: 1.6;
          margin: 0;
        }

        .kvkk-note a {
          color: var(--orange);
          text-decoration: none;
          font-weight: 600;
        }

        .kvkk-note a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}