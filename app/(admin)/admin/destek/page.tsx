'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DURUM_RENK = {
  acik:       { bg: '#FEF3C7', text: '#92400E', label: '⏳ Açık' },
  cevaplandi: { bg: '#D1FAE5', text: '#065F46', label: '✅ Cevaplandı' },
  kapali:     { bg: '#F3F4F6', text: '#6B7280', label: '🔒 Kapalı' },
}

const ONCELIK_RENK = {
  düşük:  { bg: '#D1FAE5', text: '#065F46' },
  normal:  { bg: '#FEF3C7', text: '#92400E' },
  yüksek: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function AdminDestek() {
  const [talepler, setTalepler]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [secili, setSecili]         = useState(null)
  const [yanit, setYanit]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')
  const [filtre, setFiltre]         = useState('hepsi')

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    setTalepler(data ?? [])
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const yanitGonder = async () => {
    if (!secili || !yanit.trim()) return
    setSaving(true)
    try {
      await supabase.from('support_tickets').update({
        yanit: yanit.trim(),
        durum: 'cevaplandi',
        updated_at: new Date().toISOString(),
      }).eq('id', secili.id)

      // Kullanıcıya bildirim gönder
      if (secili.user_id) {
        await supabase.from('notifications').insert({
          user_id: secili.user_id,
          title: '✅ Destek Talebiniz Cevaplandı',
          body: 'Talep #' + secili.ticket_no + ' için yanıtımız hazır.',
          type: 'system',
          data: { ticket_no: secili.ticket_no, action: 'destek' },
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }

      setTalepler(prev => prev.map(t => t.id === secili.id ? { ...t, yanit: yanit.trim(), durum: 'cevaplandi' } : t))
      setSecili(prev => ({ ...prev, yanit: yanit.trim(), durum: 'cevaplandi' }))
      setYanit('')
      showToast('Yanıt gönderildi!')
    } catch { showToast('Hata oluştu.') }
    finally { setSaving(false) }
  }

  const durumDegistir = async (id: string, durum: string) => {
    await supabase.from('support_tickets').update({ durum, updated_at: new Date().toISOString() }).eq('id', id)
    setTalepler(prev => prev.map(t => t.id === id ? { ...t, durum } : t))
    if (secili?.id === id) setSecili(prev => ({ ...prev, durum }))
    showToast('Durum güncellendi!')
  }

  const filtreliTalepler = filtre === 'hepsi' ? talepler : talepler.filter(t => t.durum === filtre)

  const formatTarih = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>🎧 Destek Talepleri</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['hepsi', 'acik', 'cevaplandi', 'kapali'].map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid', borderColor: filtre === f ? '#E8622A' : '#E8E0D4', background: filtre === f ? '#E8622A' : 'white', color: filtre === f ? 'white' : '#4A2C0E', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f === 'hepsi' ? 'Hepsi (' + talepler.length + ')' : f === 'acik' ? '⏳ Açık' : f === 'cevaplandi' ? '✅ Cevaplı' : '🔒 Kapalı'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: secili ? '1fr 1.4fr' : '1fr', gap: 20 }}>
        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtreliTalepler.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8A7B6B' }}>Talep bulunamadı</div>
          ) : filtreliTalepler.map(t => {
            const durum = DURUM_RENK[t.durum] ?? DURUM_RENK.acik
            const onc = ONCELIK_RENK[t.oncelik] ?? ONCELIK_RENK.normal
            return (
              <div key={t.id} onClick={() => { setSecili(t); setYanit(t.yanit ?? '') }}
                style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(74,44,14,0.06)', cursor: 'pointer', border: secili?.id === t.id ? '2px solid #E8622A' : '2px solid transparent', transition: 'border 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#E8622A' }}>{t.ticket_no}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: onc.bg, color: onc.text, borderRadius: 6, padding: '2px 8px' }}>{t.oncelik}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: durum.bg, color: durum.text, borderRadius: 6, padding: '2px 8px' }}>{durum.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{t.konu}</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.mesaj}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa' }}>
                  <span>{t.users?.full_name ?? t.users?.email ?? 'Anonim'}</span>
                  <span>{formatTarih(t.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detay */}
        {secili && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>{secili.ticket_no}</h2>
              <button onClick={() => setSecili(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Kullanıcı', value: secili.users?.full_name ?? secili.users?.email ?? 'Anonim' },
                { label: 'Konu', value: secili.konu },
                { label: 'Öncelik', value: secili.oncelik },
                { label: 'Tarih', value: formatTarih(secili.created_at) },
              ].map(item => (
                <div key={item.label} style={{ background: '#FAF6EF', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#8A7B6B', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4A2C0E' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#FAF6EF', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', marginBottom: 8 }}>Mesaj</div>
              <div style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.6 }}>{secili.mesaj}</div>
            </div>

            {secili.foto_urls && secili.foto_urls.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', marginBottom: 8 }}>Ekli Fotoğraflar</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {secili.foto_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {secili.yanit && (
              <div style={{ background: '#D1FAE5', borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: '3px solid #22c55e' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>Gönderilen Yanıt</div>
                <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>{secili.yanit}</div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 6 }}>Yanıt Yaz</label>
              <textarea value={yanit} onChange={e => setYanit(e.target.value)}
                placeholder="Kullanıcıya yanıt yazın..." rows={4}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={yanitGonder} disabled={saving || !yanit.trim()}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', opacity: !yanit.trim() ? 0.6 : 1 }}>
                {saving ? 'Gönderiliyor...' : '📨 Yanıt Gönder'}
              </button>
              <button onClick={() => durumDegistir(secili.id, 'kapali')}
                style={{ padding: '10px 16px', borderRadius: 10, background: '#f5f5f5', color: '#555', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
                🔒 Kapat
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#4A2C0E', color: 'white', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, zIndex: 100 }}>✅ {toast}</div>
      )}
    </div>
  )
}