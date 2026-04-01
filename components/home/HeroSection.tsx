'use client'
// @ts-nocheck
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DISTANCES = [1, 5, 8, 10]

export function HeroSection() {
  const [km, setKm] = useState(5)
  const router = useRouter()

  return (
    <section style={{
      background: 'linear-gradient(135deg, #2C1500 0%, #4A2C0E 50%, #7A4A20 100%)',
      position: 'relative', overflow: 'hidden', padding: '64px 24px 80px',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
        fontSize: '160px', opacity: 0.08, userSelect: 'none', pointerEvents: 'none',
      }}>👩‍🍳</div>

      <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 900, color: 'white', lineHeight: 1.15,
          margin: '0 0 12px', letterSpacing: '-0.5px',
        }}>
          Mahallendeki En İyi<br />Ev Yemeklerini Keşfet
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', margin: '0 0 24px' }}>
          🚶 Yürüme Mesafesinde Ev Yemeği
        </p>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '400px' }}>
          2–10 km çevrenizdeki ev aşçılarından taze, sıcak, elle yapılmış yemek sipariş edin.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px', padding: '20px 24px', maxWidth: '480px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600 }}>
              📍 Adana, Seyhan
            </span>
            <span style={{ color: '#E8622A', fontSize: '13px', fontWeight: 700 }}>
              Yakınında aşçılar var!
            </span>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>
              <span>1 km</span>
              <span style={{ color: '#E8622A', fontWeight: 700, fontSize: '13px' }}>{km} km</span>
              <span>10 km</span>
            </div>
            <input
              type="range" min={1} max={10} value={km}
              onChange={e => setKm(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#E8622A', cursor: 'pointer', height: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {DISTANCES.map(d => (
              <button key={d} onClick={() => setKm(d)} style={{
                padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
                background: km === d ? 'white' : 'rgba(255,255,255,0.12)',
                color: km === d ? '#E8622A' : 'rgba(255,255,255,0.7)',
              }}>
                {d} km
              </button>
            ))}
            <button
              onClick={() => router.push(`/kesif?km=${km}`)}
              style={{
                marginLeft: 'auto', padding: '12px 24px', borderRadius: '20px',
                background: '#E8622A', color: 'white', border: 'none',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(232,98,42,0.4)',
              }}
            >
              🍽️ Aşçıları Keşfet →
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          {[
            { icon: '✅', label: 'Güvenli Ödeme' },
            { icon: '📍', label: 'Konum Bazlı' },
            { icon: '⭐', label: 'Gerçek Yorumlar' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px', padding: '6px 14px',
              fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500,
            }}>
              {icon} {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection