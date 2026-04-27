'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CerezBanner() {
  const [goster, setGoster] = useState(false)

  useEffect(() => {
    const onay = localStorage.getItem('cerez_onay')
    if (!onay) setGoster(true)
  }, [])

  const kabul = () => {
    localStorage.setItem('cerez_onay', 'kabul')
    setGoster(false)
  }

  const reddet = () => {
    localStorage.setItem('cerez_onay', 'reddet')
    setGoster(false)
  }

  if (!goster) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#2D1B0E',
      color: 'white',
      padding: '16px 24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
    }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', flex: 1, minWidth: '200px' }}>
        🍪 Size daha iyi hizmet sunmak için çerezler kullanıyoruz.{' '}
        <Link href="/gizlilik-politikasi" style={{ color: '#E8622A', textDecoration: 'underline' }}>
          Gizlilik Politikası
        </Link>
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={reddet}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reddet
        </button>
        <button
          onClick={kabul}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#E8622A',
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Kabul Et
        </button>
      </div>
    </div>
  )
}