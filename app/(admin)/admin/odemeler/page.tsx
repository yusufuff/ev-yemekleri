// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'

const STATUS_META = {
  pending:    { label: 'Bekliyor',  color: '#F59E0B', bg: '#FFFBEB' },
  processing: { label: 'İşleniyor', color: '#3B82F6', bg: '#EFF6FF' },
  paid:       { label: 'Ödendi',    color: '#3D6B47', bg: '#ECFDF5' },
  failed:     { label: 'Başarısız', color: '#DC2626', bg: '#FEE2E2' },
}

export default function AdminOdemeler() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('pending')
  const [busy,    setBusy]    = useState(null)
  const [toast,   setToast]   = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/payouts?status=${filter}`)
      .then(r => r.json())
      .then(d => { setPayouts(d.payouts ?? []) })
      .finally(() => setLoading(false))
  }, [filter])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handle = async (id, action) => {
    setBusy(id)
    const res = await fetch('/api/admin/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: id, action }),
    })
    let d = {}
    try { const text = await res.text(); d = text ? JSON.parse(text) : {} } catch (_) {}
    if (res.ok) { setPayouts(prev => prev.filter(p => p.id !== id)); showToast(d.message ?? 'İşlem tamamlandı') }
    else showToast('Hata: ' + (d.error ?? 'Bilinmeyen'))
    setBusy(null)
  }

  const pendingAmount = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#E8622A', marginBottom: 6, fontWeight: 600 }}>Ödemeler</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Ödeme Talepleri</h1>
        </div>
        {filter === 'pending' && pendingAmount > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 18px', textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#92400E', marginBottom: 4 }}>Bekleyen Toplam</div>
            <div style={{ color: '#D97706', fontWeight: 700, fontSize: 18 }}>₺{pendingAmount.toLocaleString('tr-TR')}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['pending','Bekleyen'],['processing','İşleniyor'],['paid','Ödendi'],['failed','Başarısız']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
            background: filter === k ? '#4A2C0E' : 'white', color: filter === k ? 'white' : '#8A7B6B',
            boxShadow: filter === k ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#8A7B6B' }}>Yükleniyor...</div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#8A7B6B' }}>
            {filter === 'pending' ? 'Bekleyen ödeme talebi yok' : 'Kayıt bulunamadı'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F5EDD8' }}>
                {['Aşçı','Tutar','IBAN','Talep Tarihi','Durum','İşlem'].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8A7B6B', padding: '12px 16px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => {
                const sm = STATUS_META[p.status] ?? { label: p.status, color: '#8A7B6B', bg: '#f5f5f5' }
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #FAF6EF' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4A2C0E' }}>{p.chef?.user?.full_name ?? '-'}</div>
                      <div style={{ fontSize: 11, color: '#8A7B6B', fontFamily: 'monospace' }}>{p.chef?.user?.phone ?? ''}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 15, color: '#E8622A', fontWeight: 700 }}>₺{p.amount.toLocaleString('tr-TR')}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#8A7B6B' }}>{p.iban_last4 ? `****${p.iban_last4}` : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#8A7B6B' }}>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sm.bg, color: sm.color }}>{sm.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button disabled={busy === p.id} onClick={() => handle(p.id, 'approve')}
                            style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: '#ECFDF5', color: '#3D6B47', border: 'none', cursor: 'pointer', opacity: busy === p.id ? 0.5 : 1 }}>Onayla</button>
                          <button disabled={busy === p.id} onClick={() => handle(p.id, 'reject')}
                            style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', opacity: busy === p.id ? 0.5 : 1 }}>Reddet</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#4A2C0E', color: 'white', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}
    </div>
  )
}