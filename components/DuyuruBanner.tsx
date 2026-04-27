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
    <>
      <style>{`
        @keyframes duyuruFloat {
          0%, 100% { transform: translateY(0); }
          33% { transform: translateY(-8px); }
          66% { transform: translateY(-16px); }
        }
        @keyframes duyuruPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,98,42,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(232,98,42,0); }
        }
        .duyuru-wrap {
          display: flex;
          justify-content: center;
          padding: 16px 20px 8px;
          background: transparent;
        }
        .duyuru-balon {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 50px;
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          cursor: default;
          position: relative;
          animation: duyuruFloat 3s ease-in-out infinite, duyuruPulse 2s ease-in-out infinite;
        }
        .duyuru-kapat {
          background: rgba(255,255,255,0.25);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 14px;
          margin-left: 4px;
          flex-shrink: 0;
        }
        .duyuru-kapat:hover {
          background: rgba(255,255,255,0.4);
        }
      `}</style>
      <div className="duyuru-wrap">
        <div className="duyuru-balon" style={{ background: duyuru.renk }}>
          <span style={{ fontSize: 18 }}>📢</span>
          <span>{duyuru.mesaj}</span>
          <button className="duyuru-kapat" onClick={() => setKapali(true)}>✕</button>
        </div>
      </div>
    </>
  )
}