// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function KazancPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')

  useEffect(() => {
    fetch('/api/chef/earnings')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: '#8A7B6B' }}>Yukleniyor...</div>
    </div>
  )

  const dailyValues = Object.values(data?.daily_earnings ?? {}) as number[]
  const maxVal = Math.max(...dailyValues, 1)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/dashboard" style={{ color: '#8A7B6B', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Kazanc & Odeme</h1>
        </div>

        {/* Stat kartlari */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Bu Hafta', value: `₺${(data?.this_week ?? 0).toFixed(0)}`, change: data?.week_change, icon: '💰', color: '#E8622A' },
            { label: 'Bu Ay', value: `₺${(data?.this_month ?? 0).toFixed(0)}`, change: data?.month_change, icon: '📅', color: '#3D6B47' },
            { label: 'Bekleyen Bakiye', value: `₺${(data?.pending_balance ?? 0).toFixed(0)}`, change: null, icon: '🏦', color: '#4A2C0E' },
          ].map((card) => (
            <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.color }} />
              <div style={{ fontSize: 11, color: '#8A7B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#4A2C0E', margin: '6px 0 4px' }}>{card.value}</div>
              {card.change !== null && card.change !== undefined && (
                <div style={{ fontSize: 12, color: card.change >= 0 ? '#3D6B47' : '#DC2626', fontWeight: 500 }}>
                  {card.change >= 0 ? '↑' : '↓'} %{Math.abs(card.change)} gecen haftaya gore
                </div>
              )}
              <div style={{ position: 'absolute', right: 16, top: 20, fontSize: 28, opacity: 0.15 }}>{card.icon}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Grafik */}
          <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#4A2C0E' }}>Gunluk Kazanc</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setView('weekly')} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === 'weekly' ? '#E8622A' : '#F5EDD8', color: view === 'weekly' ? 'white' : '#8A7B6B', fontFamily: 'inherit' }}>Haftalik</button>
                <button onClick={() => setView('monthly')} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === 'monthly' ? '#E8622A' : '#F5EDD8', color: view === 'monthly' ? 'white' : '#8A7B6B', fontFamily: 'inherit' }}>Aylik</button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '0 4px', background: '#F5EDD8', borderRadius: 8, overflow: 'hidden' }}>
              {Object.entries(data?.daily_earnings ?? {}).map(([day, amount]: any) => (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontSize: 9, color: '#8A7B6B', marginBottom: 2 }}>₺{amount > 0 ? amount.toFixed(0) : ''}</div>
                  <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: amount > 0 ? 'linear-gradient(to top, #E8622A, #F28B5E)' : '#E8E0D4', height: `${Math.max((amount / maxVal) * 100, amount > 0 ? 5 : 2)}%`, transition: 'height 0.3s' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {Object.keys(data?.daily_earnings ?? {}).map((day) => (
                <div key={day} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#8A7B6B' }}>{day}</div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#F5EDD8', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#8A7B6B' }}>Bu hafta toplam:</span>
              <span style={{ fontWeight: 700, color: '#E8622A' }}>₺{(data?.this_week ?? 0).toFixed(0)}</span>
            </div>
          </div>

          {/* Odeme talebi */}
          <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>Odeme Talebi</div>

            <div style={{ background: '#ECFDF5', borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#3D6B47', marginBottom: 4 }}>Cekielebilir Bakiye</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#3D6B47' }}>₺{(data?.pending_balance ?? 0).toFixed(0)}</div>
              <div style={{ fontSize: 11, color: '#8A7B6B', marginTop: 4 }}>Min. ₺200 ile odeme talebi olusturabilirsiniz</div>
            </div>

            <button
              disabled={(data?.pending_balance ?? 0) < 200}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700,
                cursor: (data?.pending_balance ?? 0) >= 200 ? 'pointer' : 'not-allowed',
                background: (data?.pending_balance ?? 0) >= 200 ? '#E8622A' : '#E8E0D4',
                color: (data?.pending_balance ?? 0) >= 200 ? 'white' : '#8A7B6B',
                fontFamily: 'inherit', marginBottom: 12,
              }}
            >
              💸 Odeme Talep Et
            </button>

            <div style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 1.6 }}>
              ⚠️ Odeme talepleri her Pazartesi isleme alinir. IBAN bilginizin guncel olduguna emin olun.
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E8E0D4' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#4A2C0E', marginBottom: 10 }}>Kazanc Ozeti</div>
              <div style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 2 }}>
                Bu hafta kazanciniz: ₺{(data?.this_week ?? 0).toFixed(0)}<br />
                Bu ay kazanciniz: ₺{(data?.this_month ?? 0).toFixed(0)}<br />
                <strong style={{ color: '#3D6B47' }}>Toplam bekleyen: ₺{(data?.pending_balance ?? 0).toFixed(0)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}