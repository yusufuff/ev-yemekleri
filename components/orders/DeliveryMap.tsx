// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'

interface DeliveryMapProps {
  chefLocation?:    string   // "Kadıköy, İstanbul"
  deliveryAddress?: string   // Teslimat adresi
  etaMin?:          number
  etaMax?:          number
}

export function DeliveryMap({ chefLocation, deliveryAddress, etaMin, etaMax }: DeliveryMapProps) {
  const [progress, setProgress] = useState(0)
  const [seconds,  setSeconds]  = useState((etaMin ?? 15) * 60)
  const intervalRef = useRef<any>(null)
  const timerRef    = useRef<any>(null)

  // Scooter animasyonu: 0→85% arası (teslim edilmeden duruyor)
  useEffect(() => {
    let p = 0
    intervalRef.current = setInterval(() => {
      p = Math.min(p + 0.12, 85)
      setProgress(p)
      if (p >= 85) clearInterval(intervalRef.current)
    }, 300)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Geri sayım
  useEffect(() => {
    if (!seconds) return
    timerRef.current = setInterval(() => {
      setSeconds(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #E8E0D4',
      boxShadow: '0 2px 16px rgba(74,44,14,0.08)',
    }}>

      {/* ─── Harita görünümü ─── */}
      <div style={{
        position: 'relative',
        height: 180,
        background: 'linear-gradient(180deg, #E8F4E8 0%, #D4EDD4 40%, #C8E6C8 100%)',
        overflow: 'hidden',
      }}>
        {/* Grid çizgileri (sokak izi) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
          {/* Yatay sokaklar */}
          {[40, 90, 140].map(y => (
            <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.5)" strokeWidth="8" />
          ))}
          {/* Dikey sokaklar */}
          {[60, 160, 260, 360].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="100%" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
          ))}
          {/* Bloklar */}
          {[[70, 10, 80, 25], [180, 50, 70, 30], [280, 10, 70, 25], [70, 100, 80, 30], [280, 100, 80, 30]].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="rgba(255,255,255,0.35)" />
          ))}
        </svg>

        {/* Rota çizgisi */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#3D6B47" />
              <stop offset="100%" stopColor="#E8622A" />
            </linearGradient>
          </defs>
          {/* Ana rota */}
          <path
            d="M 50 90 Q 150 40 250 90 Q 320 120 380 90"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="4"
            strokeDasharray="8 4"
            opacity="0.8"
          />
          {/* Geçilen kısım */}
          <path
            d="M 50 90 Q 150 40 250 90 Q 320 120 380 90"
            fill="none"
            stroke="#3D6B47"
            strokeWidth="4"
            strokeDasharray={`${progress * 4} 999`}
            opacity="0.9"
          />
        </svg>

        {/* Aşçı pin (başlangıç) */}
        <div style={{
          position: 'absolute',
          left: 30,
          top: 64,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          <div style={{
            width: 36, height: 36,
            background: '#3D6B47',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: 16 }}>👩‍🍳</span>
          </div>
          <div style={{
            background: 'white', borderRadius: 6, padding: '2px 6px',
            fontSize: 9, fontWeight: 700, color: '#3D6B47',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {chefLocation ?? 'Aşçı'}
          </div>
        </div>

        {/* Teslimat pin (bitiş) */}
        <div style={{
          position: 'absolute',
          right: 20,
          top: 64,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          <div style={{
            width: 36, height: 36,
            background: '#E8622A',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: 16 }}>🏠</span>
          </div>
          <div style={{
            background: 'white', borderRadius: 6, padding: '2px 6px',
            fontSize: 9, fontWeight: 700, color: '#E8622A',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            Siz
          </div>
        </div>

        {/* Scooter */}
        <div style={{
          position: 'absolute',
          top: 58,
          left: `calc(${progress}% - 18px)`,
          transition: 'left 0.3s ease',
          fontSize: 28,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          zIndex: 10,
        }}>
          🛵
        </div>

        {/* ETA kutusu */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'white',
          borderRadius: 10,
          padding: '6px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: '#8A7B6B', fontWeight: 600 }}>KALAN SÜRE</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#E8622A', fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Canlı rozeti */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: '#3D6B47',
          borderRadius: 99,
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#86efac',
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>CANLI TAKİP</span>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
        `}</style>
      </div>

      {/* ─── Bilgi satırı ─── */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderTop: '1px solid #F3EDE4',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{
            fontSize: 12, color: '#8A7B6B',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {deliveryAddress ?? 'Teslimat adresinize gidiliyor'}
          </span>
        </div>
        <div style={{
          background: '#FEF0EB',
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 700,
          color: '#E8622A',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          ~{etaMin ?? 15}–{etaMax ?? 25} dk
        </div>
      </div>

    </div>
  )
}