'use client'
// @ts-nocheck
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DISTANCES = [1, 5, 8, 10]
const BALON_EMOJILER = ['📢', '🎉', '⭐', '🍽️', '🛵', '💬']

const BALON_POZISYONLAR = [
  { top: '8%',  right: '2%',  animDur: '4s',   animDelay: '0s',   size: 88,  bg: 'rgba(232,98,42,0.92)',   color: 'white' },
  { top: '5%',  right: '18%', animDur: '5s',   animDelay: '0.5s', size: 100, bg: 'rgba(255,255,255,0.88)', color: '#4A2C0E' },
  { top: '10%', right: '12%', animDur: '4.5s', animDelay: '1s',   size: 82,  bg: 'rgba(61,107,71,0.9)',    color: 'white' },
  { top: '58%', right: '2%',  animDur: '5.5s', animDelay: '0.3s', size: 92,  bg: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' },
  { top: '60%', right: '18%', animDur: '6s',   animDelay: '0.8s', size: 96,  bg: 'rgba(232,98,42,0.92)',   color: 'white' },
  { top: '55%', right: '8%',  animDur: '4.2s', animDelay: '0.2s', size: 80,  bg: 'rgba(255,255,255,0.88)', color: '#4A2C0E' },
]
function StoriesPanel() {
  const [stories, setStories] = React.useState<any[]>([])
  const [aktif, setAktif] = React.useState<any>(null)
  React.useEffect(() => {
    fetch('/api/stories').then(r => r.json()).then(d => setStories(d.stories ?? []))
  }, [])
  if (stories.length === 0) return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Henüz hikaye yok</div>
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stories.map((s: any) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setAktif(s)}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2.5px solid #E8622A', overflow: 'hidden', flexShrink: 0 }}>
              <img src={s.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{s.chef_profiles?.users?.full_name ?? 'Aşçı'}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{s.caption}</div>
            </div>
          </div>
        ))}
      </div>
      {aktif && (
        <div onClick={() => setAktif(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 380, maxWidth: '95vw', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <img src={aktif.image_url} style={{ width: '100%', maxHeight: '70vh', objectFit: 'cover', display: 'block' }} />
            <div style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '32px 20px 20px', position: 'absolute', bottom: 0, width: '100%', boxSizing: 'border-box' }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{aktif.chef_profiles?.users?.full_name ?? 'Aşçı'}</div>
              {aktif.caption && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>{aktif.caption}</div>}
            </div>
            <button onClick={() => setAktif(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        </div>
      )}
    </>
  )
}
export function HeroSection() {
  const [km, setKm] = useState(5)
  const [balonlar, setBalonlar] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const yukle = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['duyuru_1', 'duyuru_2', 'duyuru_3', 'duyuru_4', 'duyuru_5', 'duyuru_6'])
      if (data) {
        const m = Object.fromEntries(data.map((d: any) => [d.key, d.value]))
        setBalonlar([
          m.duyuru_1 ?? '',
          m.duyuru_2 ?? '',
          m.duyuru_3 ?? '',
          m.duyuru_4 ?? '',
          m.duyuru_5 ?? '',
          m.duyuru_6 ?? '',
        ])
      }
    }
    yukle()
  }, [])

  return (
    <>
      <style>{`
        @keyframes heroFloat1 { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-16px) rotate(2deg)} }
        @keyframes heroFloat2 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-20px) rotate(-1deg)} }
        @keyframes heroFloat3 { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-14px) rotate(3deg)} }
        @keyframes heroFloat4 { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-18px) rotate(-2deg)} }
        @keyframes heroFloat5 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
        @keyframes heroFloat6 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-22px) rotate(-3deg)} }
        .hero-balon-0 { animation: heroFloat1 4s ease-in-out infinite; }
        .hero-balon-1 { animation: heroFloat2 5s ease-in-out infinite; }
        .hero-balon-2 { animation: heroFloat3 4.5s ease-in-out infinite; }
        .hero-balon-3 { animation: heroFloat4 5.5s ease-in-out infinite; }
        .hero-balon-4 { animation: heroFloat5 6s ease-in-out infinite; }
        .hero-balon-5 { animation: heroFloat6 4.2s ease-in-out infinite; }
      `}</style>

      <section style={{display: 'flex', alignItems: 'stretch',
        background: 'linear-gradient(135deg, #2C1500 0%, #4A2C0E 50%, #7A4A20 100%)',
        position: 'relative', overflow: 'hidden', padding: '64px 24px 80px 0',
      }}>
        {/* Nokta deseni */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.15,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        {/* Büyük emoji arka plan */}
        <div style={{
          position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
          fontSize: '160px', opacity: 0.08, userSelect: 'none', pointerEvents: 'none',
        }}>👩‍🍳</div>
{/* Sol: Hikayeler */}
<div style={{ width: 260, flexShrink: 0, padding: '0 24px', position: 'relative', zIndex: 10 }}>
  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>📸 Aşçı Hikayeleri</div>
  <StoriesPanel />
</div>
        {/* 6 Uçan Yuvarlak Balon */}
        {balonlar.map((metin, i) => {
          if (!metin) return null
          const pos = BALON_POZISYONLAR[i]
          return (
            <div
              key={i}
              className={`hero-balon-${i}`}
              style={{
                position: 'absolute',
                top: pos.top,
                right: pos.right,
               
                width: pos.size,
                height: pos.size,
                borderRadius: '50%',
                background: pos.bg,
                border: pos.border ?? 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: pos.color,
                fontSize: 10,
                fontWeight: 700,
                padding: 8,
                boxSizing: 'border-box',
                boxShadow: pos.color === 'white' && !pos.border ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
                animationDelay: pos.animDelay,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <span style={{ fontSize: 18, marginBottom: 3 }}>{BALON_EMOJILER[i]}</span>
              <span style={{ lineHeight: 1.2 }}>{metin}</span>
            </div>
          )
        })}

        <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
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
    </>
  )
}

export default HeroSection