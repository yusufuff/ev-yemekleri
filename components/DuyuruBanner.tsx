'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DuyuruBanner() {
  const [duyuru, setDuyuru] = useState<{ mesaj: string; renk: string } | null>(null)
  const [kapali, setKapali] = useState(false)

  useEffect(() => {
    const yukle = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['duyuru_aktif', 'duyuru_mesaj', 'duyuru_renk'])

      if (!data) return
      const m = Object.fromEntries(data.map((d: any) => [d.key, d.value]))
      if (m.duyuru_aktif === 'true' && m.duyuru_mesaj) {
        setDuyuru({ mesaj: m.duyuru_mesaj, renk: m.duyuru_renk ?? '#E8622A' })
      }
    }
    yukle()
  }, [])

  if (!duyuru || kapali) return null

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '12px 20px',
      background: '#FAF6EF',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'white',
        border: `2px solid ${duyuru.renk}`,
        borderRadius: 50,
        padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: 600,
        width: '100%',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: duyuru.renk,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>📢</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#4A2C0E' }}>{duyuru.mesaj}</div>
        </div>
        <button
          onClick={() => setKapali(true)}
          style={{ background: 'none', border: 'none', color: '#8A7B6B', cursor: 'pointer', fontSize: 18, flexShrink: 0, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}