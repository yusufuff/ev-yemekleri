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
      background: duyuru.renk,
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      fontSize: '13px',
      fontWeight: 600,
      position: 'relative',
    }}>
      <span>📢 {duyuru.mesaj}</span>
      <button
        onClick={() => setKapali(true)}
        style={{ position: 'absolute', right: 16, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  )
}