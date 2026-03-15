'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function BasariIcerigi() {
  const params = useSearchParams()
  const orderId = params.get('order_id') ?? 'ord-1'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
        <div style={{ width: 80, height: 80, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px' }}>✅</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: '#4A2C0E', marginBottom: 10 }}>Siparişiniz Alındı!</h1>
        <p style={{ color: '#8A7B6B', fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
          Sipariş numaranız: <strong style={{ color: '#E8622A' }}>#{orderId}</strong>
        </p>
        <p style={{ color: '#8A7B6B', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Aşçınız siparişinizi onayladıktan sonra hazırlamaya başlayacak. Bildirim alacaksınız.
        </p>
        <div style={{ background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8622A', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4A2C0E' }}>Sipariş Durumu: Onay Bekleniyor</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A7B6B' }}>Siparişinizi "Siparişlerim" sayfasından takip edebilirsiniz.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/siparislerim" style={{ flex: 1, padding: '12px 0', background: '#E8622A', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
            📦 Siparişi Takip Et
          </Link>
          <Link href="/kesif" style={{ flex: 1, padding: '12px 0', background: 'white', color: '#4A2C0E', border: '1.5px solid #E8E0D4', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
            🔍 Keşfet
          </Link>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </div>
  )
}

export default function SiparisBasariPage() {
  return <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Yükleniyor…</div>}><BasariIcerigi /></Suspense>
}