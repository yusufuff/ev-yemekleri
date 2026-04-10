// @ts-nocheck
'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function OdemeCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // GET ile token geldi - API'ye gönder
      fetch('/api/payments/callback-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.order_id) {
            window.location.href = `/siparis-basari?order_id=${data.order_id}`
          } else {
            window.location.href = `/odeme/hata?reason=${data.reason ?? 'unknown'}`
          }
        })
        .catch(() => {
          window.location.href = '/odeme/hata?reason=network_error'
        })
    } else {
      window.location.href = '/odeme/hata?reason=no_token'
    }
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif", background:'#FAF6EF' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#4A2C0E' }}>Ödeme işleniyor...</div>
        <div style={{ fontSize:13, color:'#8A7B6B', marginTop:8 }}>Lütfen bekleyin, yönlendiriliyorsunuz.</div>
      </div>
    </div>
  )
}