'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

// ── Konfeti parçacığı ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#E8622A', '#3D6B47', '#F59E0B', '#4A2C0E', '#6BA37A', '#F28B5E']

interface Particle {
  id:    number
  x:     number
  y:     number
  vx:    number
  vy:    number
  color: string
  size:  number
  angle: number
  spin:  number
  shape: 'rect' | 'circle'
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')!
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    // Parçacık oluştur
    particles.current = Array.from({ length: 120 }, (_, i) => ({
      id:    i,
      x:     Math.random() * canvas.width,
      y:     -10 - Math.random() * 200,
      vx:    (Math.random() - 0.5) * 4,
      vy:    2 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size:  6 + Math.random() * 8,
      angle: Math.random() * 360,
      spin:  (Math.random() - 0.5) * 6,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let alive = false

      particles.current.forEach(p => {
        if (p.y > canvas.height + 20) return
        alive = true

        p.x     += p.vx
        p.y     += p.vy
        p.vy    += 0.08  // yerçekimi
        p.angle += p.spin

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.angle * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height)

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      if (alive) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
      aria-hidden
    />
  )
}

// ── Adım göstergesi ───────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',    emoji: '📋', label: 'Sipariş Alındı' },
  { key: 'confirmed',  emoji: '✅', label: 'Onaylandı' },
  { key: 'preparing',  emoji: '👩‍🍳', label: 'Hazırlanıyor' },
  { key: 'ready',      emoji: '📦', label: 'Hazır' },
  { key: 'on_way',     emoji: '🛵', label: 'Yolda' },
  { key: 'delivered',  emoji: '🏠', label: 'Teslim Edildi' },
]

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered']

function OrderSteps({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <div className="steps-wrap">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={step.key} className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="step-dot">
              {isDone ? '✓' : step.emoji}
            </div>
            <div className="step-label">{step.label}</div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${isDone ? 'filled' : ''}`} />
            )}
          </div>
        )
      })}
      <style>{`
        .steps-wrap {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          overflow-x: auto;
          padding: 4px 0 8px;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          min-width: 60px;
        }
        .step-dot {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--gray-light);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          color: var(--gray);
          position: relative;
          z-index: 1;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-item.done   .step-dot { background: var(--green);  color: white; font-size: 16px; }
        .step-item.current .step-dot {
          background: var(--orange); color: white;
          box-shadow: 0 0 0 4px rgba(232,98,42,0.2);
          animation: pulse-step 2s infinite;
        }
        @keyframes pulse-step {
          0%, 100% { box-shadow: 0 0 0 4px rgba(232,98,42,0.2); }
          50%       { box-shadow: 0 0 0 8px rgba(232,98,42,0.06); }
        }
        .step-label {
          font-size: 10px; text-align: center; margin-top: 6px;
          color: var(--gray); font-weight: 600; line-height: 1.3;
        }
        .step-item.done .step-label,
        .step-item.current .step-label { color: var(--brown); }
        .step-line {
          position: absolute;
          top: 18px; left: 50%;
          width: 100%; height: 2px;
          background: var(--gray-light);
          z-index: 0;
        }
        .step-line.filled { background: var(--green); }
      `}</style>
    </div>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────
function SiparisBasariInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { clear }    = useCart()

  const orderId = searchParams.get('order_id')

  const [order,        setOrder]        = useState<any>(null)
  const [isLoading,    setIsLoading]    = useState(true)
  const [error,        setError]        = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [countdown,    setCountdown]    = useState(10)  // Otomatik yönlendirme sayacı

  // Siparişi yükle
  useEffect(() => {
    if (!orderId) { setError('Sipariş bulunamadı.'); setIsLoading(false); return }

    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.order) {
          setOrder(data)
          setIsLoading(false)
          // Kısa gecikme sonrası konfeti
          setTimeout(() => setShowConfetti(true), 300)
          // Sepeti temizle
          clear()
        } else {
          setError(data.error ?? 'Sipariş bilgisi alınamadı.')
          setIsLoading(false)
        }
      })
      .catch(() => { setError('Bağlantı hatası.'); setIsLoading(false) })
  }, [orderId, clear])

  // Geri sayım
  useEffect(() => {
    if (!order) return
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          router.push(`/siparislerim?highlight=${orderId}`)
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [order, orderId, router])

  // Yükleniyor
  if (isLoading) {
    return (
      <div className="sb-loading">
        <div className="sb-spinner" />
        <div>Sipariş bilgisi alınıyor…</div>
        <style>{`
          .sb-loading {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; min-height: 60vh; gap: 16px;
            font-size: 14px; color: var(--gray);
          }
          .sb-spinner {
            width: 44px; height: 44px;
            border: 4px solid var(--gray-light);
            border-top-color: var(--orange); border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // Hata
  if (error || !order) {
    return (
      <div className="sb-error-wrap">
        <div className="sb-error-icon">❌</div>
        <div className="sb-error-msg">{error || 'Bir hata oluştu.'}</div>
        <Link href="/kesif" className="sb-back-btn">Ana Sayfaya Dön</Link>
        <style>{`
          .sb-error-wrap {
            text-align: center; padding: 60px 24px;
            display: flex; flex-direction: column; align-items: center; gap: 14px;
          }
          .sb-error-icon { font-size: 48px; }
          .sb-error-msg { font-size: 15px; color: var(--gray); }
          .sb-back-btn {
            padding: 12px 24px; background: var(--orange); color: white;
            border-radius: 12px; text-decoration: none; font-weight: 700;
          }
        `}</style>
      </div>
    )
  }

  const { order: o, estimated_min, estimated_max } = order
  const chef = o.chef_profiles
  const chefName = chef?.users?.full_name ?? 'Aşçı'
  const items = o.order_items ?? []
  const addr  = o.delivery_address as any

  return (
    <>
      <Confetti active={showConfetti} />

      <div className="sb-wrap">

        {/* ── Başarı başlığı ── */}
        <div className="sb-hero">
          <div className="sb-check-ring">
            <div className="sb-check">✓</div>
          </div>
          <h1 className="sb-title">Siparişiniz Alındı!</h1>
          <div className="sb-order-num">#{o.order_number}</div>
          <p className="sb-subtitle">
            {chefName} siparişinizi onayladıktan sonra hazırlamaya başlayacak.
          </p>
        </div>

        {/* ── Tahmini süre ── */}
        <div className="sb-eta">
          <div className="sb-eta-icon">⏱️</div>
          <div>
            <div className="sb-eta-label">Tahmini Teslim</div>
            <div className="sb-eta-time">{estimated_min}–{estimated_max} dakika</div>
          </div>
          {o.delivery_type === 'delivery'
            ? <div className="sb-eta-badge">🛵 Teslimat</div>
            : <div className="sb-eta-badge pickup">🚶 Gel-Al</div>}
        </div>

        <div className="sb-grid">

          {/* Sol sütun */}
          <div className="sb-left">

            {/* Sipariş durumu adımları */}
            <div className="sb-card">
              <div className="sb-card-title">Sipariş Durumu</div>
              <OrderSteps status={o.status} />
            </div>

            {/* Aşçı bilgisi */}
            <div className="sb-card sb-chef-card">
              <div className="sb-chef-avatar">
                {chef?.users?.avatar_url
                  ? <img src={chef.users.avatar_url} alt={chefName} />
                  : '👩‍🍳'}
              </div>
              <div className="sb-chef-info">
                <div className="sb-chef-name">{chefName}</div>
                {chef?.location_approx && (
                  <div className="sb-chef-loc">📍 {chef.location_approx}</div>
                )}
                <div className="sb-chef-rating">⭐ {chef?.avg_rating?.toFixed(1) ?? '—'}</div>
              </div>
              <a
                href={`/asci/${chef?.id}`}
                className="sb-chef-link"
              >
                Profile Git →
              </a>
            </div>

            {/* Teslimat adresi (delivery ise) */}
            {o.delivery_type === 'delivery' && addr && (
              <div className="sb-card">
                <div className="sb-card-title">📍 Teslimat Adresi</div>
                <div className="sb-addr">{addr.full_address}</div>
                {addr.notes && (
                  <div className="sb-addr-note">💬 {addr.notes}</div>
                )}
              </div>
            )}

            {o.delivery_type === 'pickup' && (
              <div className="sb-card sb-pickup-note">
                <div className="sb-pickup-icon">🚶</div>
                <div>
                  <div className="sb-card-title" style={{ marginBottom: 4 }}>Gel-Al Siparişi</div>
                  <div className="sb-addr">
                    Siparişiniz hazır olduğunda aşçı sizi arayacak veya
                    bildirim gönderecektir.
                  </div>
                  {chef?.location_approx && (
                    <div className="sb-addr-note">📍 {chef.location_approx}</div>
                  )}
                </div>
              </div>
            )}

            {/* Müşteri notu */}
            {o.notes && (
              <div className="sb-card">
                <div className="sb-card-title">💬 Notunuz</div>
                <div className="sb-addr" style={{ fontStyle: 'italic' }}>"{o.notes}"</div>
              </div>
            )}
          </div>

          {/* Sağ sütun — sipariş özeti */}
          <div className="sb-right">
            <div className="sb-card">
              <div className="sb-card-title">Sipariş Özeti</div>

              <div className="sb-items">
                {items.map((item: any) => (
                  <div key={item.id} className="sb-item-row">
                    <span className="sb-item-qty">{item.quantity}×</span>
                    <span className="sb-item-name">{item.item_name}</span>
                    <span className="sb-item-price">₺{Number(item.line_total).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div className="sb-total-rows">
                <div className="sb-total-row">
                  <span>Ara Toplam</span>
                  <span>₺{Number(o.subtotal).toFixed(0)}</span>
                </div>
                {Number(o.delivery_fee) > 0 && (
                  <div className="sb-total-row">
                    <span>Teslimat</span>
                    <span>₺{Number(o.delivery_fee).toFixed(0)}</span>
                  </div>
                )}
                {Number(o.discount_amount) > 0 && (
                  <div className="sb-total-row discount">
                    <span>İndirim {o.coupon_code ? `(${o.coupon_code})` : ''}</span>
                    <span>−₺{Number(o.discount_amount).toFixed(0)}</span>
                  </div>
                )}
                {Number(o.credit_used) > 0 && (
                  <div className="sb-total-row discount">
                    <span>Kullanılan Kredi</span>
                    <span>−₺{Number(o.credit_used).toFixed(0)}</span>
                  </div>
                )}
                <div className="sb-total-row grand">
                  <span>Toplam</span>
                  <span>₺{Number(o.total_amount).toFixed(0)}</span>
                </div>
              </div>

              <div className="sb-paid-badge">✅ Ödeme Alındı</div>
            </div>

            {/* Aksiyon butonları */}
            <div className="sb-actions">
              <Link href={`/siparislerim?highlight=${o.id}`} className="sb-btn-primary">
                🔴 Siparişi Takip Et
              </Link>
              <Link href="/kesif" className="sb-btn-secondary">
                Keşfetmeye Devam Et
              </Link>
              <a
                href={`/asci/${chef?.id}#menu`}
                className="sb-btn-ghost"
              >
                🔁 Tekrar Sipariş Ver
              </a>
            </div>

            {/* Yönlendirme sayacı */}
            <div className="sb-countdown">
              <div
                className="sb-countdown-bar"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
              <div className="sb-countdown-text">
                {countdown} saniye içinde siparişlerim sayfasına yönlendirileceksiniz
              </div>
            </div>
          </div>
        </div>

        {/* Değerlendirme hatırlatıcısı */}
        <div className="sb-review-teaser">
          <div className="sb-review-icon">⭐</div>
          <div>
            <div className="sb-review-title">Siparişiniz teslim edildikten sonra</div>
            <div className="sb-review-sub">
              {chefName} için değerlendirme yapabileceksiniz.
              İyi yorumlar aşçıları destekler!
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Sayfa ──────────────────────── */
        .sb-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 0 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ── Hero ───────────────────────── */
        .sb-hero {
          text-align: center;
          padding: 48px 24px 32px;
          background: linear-gradient(135deg, var(--brown) 0%, var(--brown-mid) 100%);
          border-radius: 20px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .sb-hero::after {
          content: '🎉';
          position: absolute;
          right: 24px; top: 50%;
          transform: translateY(-50%);
          font-size: 80px;
          opacity: 0.12;
        }

        .sb-check-ring {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes pop-in {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        .sb-check {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: var(--green);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          color: white;
          font-weight: 700;
        }

        .sb-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 900;
          margin: 0 0 6px;
          animation: slide-up 0.4s ease 0.2s both;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sb-order-num {
          font-size: 13px;
          background: rgba(255,255,255,0.15);
          display: inline-block;
          padding: 4px 14px;
          border-radius: 20px;
          margin-bottom: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .sb-subtitle {
          font-size: 13.5px;
          opacity: 0.85;
          max-width: 380px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── ETA ────────────────────────── */
        .sb-eta {
          background: var(--white);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 12px rgba(74,44,14,0.07);
          border: 1.5px solid var(--orange);
        }

        .sb-eta-icon { font-size: 32px; flex-shrink: 0; }

        .sb-eta-label {
          font-size: 11px; color: var(--gray);
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
        }

        .sb-eta-time {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 700;
          color: var(--orange);
          line-height: 1;
          margin-top: 2px;
        }

        .sb-eta-badge {
          margin-left: auto;
          background: #FEF3EC;
          color: var(--orange);
          font-size: 12px; font-weight: 700;
          padding: 6px 14px; border-radius: 20px;
          flex-shrink: 0;
        }

        .sb-eta-badge.pickup {
          background: #ECFDF5; color: var(--green);
        }

        /* ── Grid ───────────────────────── */
        .sb-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 800px) {
          .sb-grid { grid-template-columns: 1fr; }
          .sb-right { order: -1; }
        }

        .sb-left, .sb-right {
          display: flex; flex-direction: column; gap: 14px;
        }

        /* ── Kart ───────────────────────── */
        .sb-card {
          background: var(--white);
          border-radius: 14px; padding: 16px 18px;
          box-shadow: 0 2px 12px rgba(74,44,14,0.07);
          border: 1px solid rgba(232,224,212,0.6);
        }

        .sb-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 14px; font-weight: 700;
          color: var(--brown); margin-bottom: 12px;
        }

        /* ── Aşçı kartı ─────────────────── */
        .sb-chef-card {
          display: flex; align-items: center; gap: 14px;
        }

        .sb-chef-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #FDE68A, #F59E0B);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0; overflow: hidden;
        }

        .sb-chef-avatar img {
          width: 100%; height: 100%; object-fit: cover;
        }

        .sb-chef-info { flex: 1; }

        .sb-chef-name {
          font-weight: 700; font-size: 14px;
          color: var(--brown); margin-bottom: 3px;
        }

        .sb-chef-loc  { font-size: 11.5px; color: var(--gray); }
        .sb-chef-rating { font-size: 12px; color: var(--orange); font-weight: 600; margin-top: 2px; }

        .sb-chef-link {
          font-size: 12px; font-weight: 700;
          color: var(--orange); text-decoration: none;
          white-space: nowrap; flex-shrink: 0;
        }

        .sb-chef-link:hover { text-decoration: underline; }

        /* ── Adres ──────────────────────── */
        .sb-addr { font-size: 13px; color: var(--gray); line-height: 1.6; }
        .sb-addr-note { font-size: 11.5px; color: var(--gray); margin-top: 6px; }

        .sb-pickup-note {
          display: flex; gap: 14px; align-items: flex-start;
        }

        .sb-pickup-icon { font-size: 24px; flex-shrink: 0; }

        /* ── Sipariş kalemleri ──────────── */
        .sb-items {
          display: flex; flex-direction: column; gap: 7px;
          margin-bottom: 14px;
        }

        .sb-item-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px;
        }

        .sb-item-qty   { color: var(--gray); font-weight: 700; flex-shrink: 0; }
        .sb-item-name  { flex: 1; color: var(--brown); }
        .sb-item-price { font-weight: 700; color: var(--orange); flex-shrink: 0; }

        /* ── Tutar satırları ────────────── */
        .sb-total-rows {
          border-top: 1.5px solid var(--gray-light);
          padding-top: 10px;
          display: flex; flex-direction: column; gap: 7px;
        }

        .sb-total-row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: var(--brown);
        }

        .sb-total-row.discount { color: var(--green); font-weight: 600; }

        .sb-total-row.grand {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: var(--orange);
          border-top: 1.5px solid var(--gray-light);
          padding-top: 8px; margin-top: 4px;
        }

        .sb-paid-badge {
          margin-top: 12px;
          background: #ECFDF5; color: var(--green);
          font-size: 12px; font-weight: 700;
          padding: 7px 14px; border-radius: 8px;
          text-align: center;
          border: 1px solid #A7F3D0;
        }

        /* ── Aksiyonlar ─────────────────── */
        .sb-actions {
          display: flex; flex-direction: column; gap: 8px;
        }

        .sb-btn-primary {
          display: block; padding: 14px;
          background: var(--orange); color: white;
          border-radius: 12px; text-decoration: none;
          font-size: 15px; font-weight: 700; text-align: center;
          transition: all 0.2s;
        }

        .sb-btn-primary:hover {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,98,42,0.4);
        }

        .sb-btn-secondary {
          display: block; padding: 12px;
          background: var(--warm);
          color: var(--brown-mid); border-radius: 12px;
          text-decoration: none; font-size: 13.5px;
          font-weight: 700; text-align: center;
          border: 1.5px solid var(--gray-light);
          transition: all 0.15s;
        }

        .sb-btn-secondary:hover { border-color: var(--orange); color: var(--orange); }

        .sb-btn-ghost {
          display: block; padding: 11px;
          background: transparent;
          color: var(--gray); border-radius: 12px;
          text-decoration: none; font-size: 13px;
          font-weight: 600; text-align: center;
          border: 1.5px solid var(--gray-light);
          transition: all 0.15s;
        }

        .sb-btn-ghost:hover { border-color: var(--brown); color: var(--brown); }

        /* ── Sayaç ──────────────────────── */
        .sb-countdown {
          background: var(--warm);
          border-radius: 10px;
          padding: 10px 14px;
          overflow: hidden;
          position: relative;
        }

        .sb-countdown-bar {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: rgba(232,98,42,0.12);
          transition: width 1s linear;
        }

        .sb-countdown-text {
          font-size: 11px; color: var(--gray);
          text-align: center; position: relative; z-index: 1;
        }

        /* ── Değerlendirme teaserı ────── */
        .sb-review-teaser {
          background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
          border-radius: 14px; padding: 18px 20px;
          display: flex; align-items: center; gap: 14px;
          border: 1.5px solid #F59E0B;
        }

        .sb-review-icon { font-size: 32px; flex-shrink: 0; }

        .sb-review-title {
          font-weight: 700; font-size: 13.5px;
          color: var(--brown); margin-bottom: 4px;
        }

        .sb-review-sub {
          font-size: 12px; color: var(--gray); line-height: 1.5;
        }
      `}</style>
    </>
  )
}

export default function SiparisBasariPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray)' }}>
        Yükleniyor…
      </div>
    }>
      <SiparisBasariInner />
    </Suspense>
  )
}
