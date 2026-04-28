'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DURUM_META: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Açık',      color: '#E8622A', bg: '#FEF3EC' },
  in_progress: { label: 'İşlemde',   color: '#3B82F6', bg: '#EFF6FF' },
  resolved:    { label: 'Çözüldü',   color: '#3D6B47', bg: '#ECFDF5' },
  closed:      { label: 'Kapatıldı', color: '#8A7B6B', bg: '#F5F5F5' },
}

const ONCELIK_META: Record<string, { label: string; color: string }> = {
  low:      { label: 'Düşük',  color: '#8A7B6B' },
  medium:   { label: 'Orta',   color: '#F59E0B' },
  high:     { label: 'Yüksek', color: '#E8622A' },
  critical: { label: 'Kritik', color: '#DC2626' },
}

export default function AdminDestek() {
  const [talepler, setTalepler] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('open')
  const [secili, setSecili]     = useState<any>(null)
  const [yanit, setYanit]       = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    yukle()
    const kanal = supabase.channel('admin-destek')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => yukle())
      .subscribe()
    return () => { supabase.removeChannel(kanal) }
  }, [filter])

  const yukle = async () => {
    setLoading(true)
    const q = supabase.from('support_tickets').select('*, users(full_name, email)').order('created_at', { ascending: false })
    if (filter !== 'hepsi') q.eq('durum', filter)
    const { data } = await q
    setTalepler(data ?? [])
    setLoading(false)
  }

  const durumGuncelle = async (id: string, durum: string) => {
    await supabase.from('support_tickets').update({ durum, updated_at: new Date().toISOString() }).eq('id', id)
    yukle()
    if (secili?.id === id) setSecili((prev: any) => ({ ...prev, durum }))
  }

  const yanitGonder = async () => {
    if (!yanit.trim() || !secili) return
    setSaving(true)
    await supabase.from('support_tickets').update({ yanit, durum: 'resolved', updated_at: new Date().toISOString() }).eq('id', secili.id)
    setSaving(false); setYanit('')
    setSecili((prev: any) => ({ ...prev, yanit, durum: 'resolved' }))
    yukle()
  }

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>Destek Talepleri</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['open','Açık'],['in_progress','İşlemde'],['resolved','Çözüldü'],['closed','Kapatıldı'],['hepsi','Hepsi']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
            background: filter === k ? '#4A2C0E' : 'white', color: filter === k ? 'white' : '#8A7B6B',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: secili ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8A7B6B' }}>Yükleniyor...</div>
          ) : talepler.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8A7B6B' }}>Talep bulunamadı</div>
          ) : talepler.map(t => {
            const dm = DURUM_META[t.durum] ?? DURUM_META.open
            const om = ONCELIK_META[t.oncelik] ?? ONCELIK_META.medium
            return (
              <div key={t.id} onClick={() => { setSecili(t); setYanit(t.yanit ?? '') }}
                style={{ padding: '14px 18px', borderBottom: '1px solid #FAF6EF', cursor: 'pointer', background: secili?.id === t.id ? '#FEF3EC' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4A2C0E' }}>{t.konu}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: dm.bg, color: dm.color, fontWeight: 700 }}>{dm.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8A7B6B' }}>{t.users?.full_name ?? '-'} · #{t.ticket_no}</span>
                  <span style={{ fontSize: 11, color: om.color, fontWeight: 600 }}>{om.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</div>
              </div>
            )
          })}
        </div>

        {secili && (
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>{secili.konu}</h2>
              <button onClick={() => setSecili(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#8A7B6B' }}>✕</button>
            </div>
            <div style={{ marginBottom: 12, padding: 14, background: '#FAF6EF', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: '#8A7B6B', marginBottom: 4 }}>Kullanıcı: {secili.users?.full_name} · {secili.users?.email}</div>
              <p style={{ margin: 0, fontSize: 14, color: '#4A2C0E', lineHeight: 1.6 }}>{secili.mesaj}</p>
            </div>
            {secili.yanit && (
              <div style={{ marginBottom: 12, padding: 14, background: '#ECFDF5', borderRadius: 10, borderLeft: '3px solid #3D6B47' }}>
                <div style={{ fontSize: 12, color: '#3D6B47', fontWeight: 700, marginBottom: 4 }}>Yanıtınız:</div>
                <p style={{ margin: 0, fontSize: 14, color: '#4A2C0E' }}>{secili.yanit}</p>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 6 }}>Yanıt Yaz</label>
              <textarea value={yanit} onChange={e => setYanit(e.target.value)} rows={4} placeholder="Kullanıcıya yanıt yaz..."
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={yanitGonder} disabled={saving || !yanit.trim()}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#3D6B47', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Gönderiliyor...' : '✓ Yanıt Gönder'}
              </button>
              {Object.entries(DURUM_META).map(([k, v]) => (
                <button key={k} onClick={() => durumGuncelle(secili.id, k)}
                  style={{ padding: '10px 14px', borderRadius: 10, background: v.bg, color: v.color, border: `1px solid ${v.color}30`, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}