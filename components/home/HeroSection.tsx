'use client'
import { useState } from 'react'
import Link from 'next/link'

const DISTANCES = [1, 5, 8, 10]

export function HeroSlider() {
  const [km, setKm] = useState(5)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.13)', borderRadius: '16px',
      padding: '20px 24px', maxWidth: '480px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600 }}>📍 Adana, Seyhan</span>
        <span style={{ color: '#E8622A', fontSize: '13px', fontWeight: 700 }}>24 aşçı yakında</span>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
          <span>1 km</span>
          <span style={{ color: '#E8622A', fontWeight: 700, fontSize: '13px' }}>{km} km</span>
          <span>10 km</span>
        </div>
        <input type="range" min={1} max={10} value={km} onChange={e => setKm(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#E8622A', cursor: 'pointer' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {DISTANCES.map(d => (
          <button key={d} onClick={() => setKm(d)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', border: 'none', fontFamily: 'inherit',
            background: km === d ? 'white' : 'rgba(255,255,255,0.12)',
            color: km === d ? '#E8622A' : 'rgba(255,255,255,0.7)',
          }}>{d} km</button>
        ))}
        <Link href={`/kesif?km=${km}`} style={{
          marginLeft: 'auto', padding: '9px 20px', borderRadius: '20px',
          background: '#E8622A', color: 'white', fontSize: '13px', fontWeight: 700,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>Aşçıları Gör →</Link>
      </div>
    </div>
  )
}