'use client'

import { useState, useEffect } from 'react'

interface Payout {
  id:          string
  chef_id:     string
  amount:      number
  status:      'pending' | 'processing' | 'paid' | 'failed'
  iban:        string
  created_at:  string
  processed_at?: string
  chef: {
    user: { full_name: string; phone: string }
  }
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Bekliyor',    color: 'bg-amber-500/10 text-amber-400' },
  processing: { label: 'İşleniyor',  color: 'bg-blue-500/10 text-blue-400' },
  paid:       { label: 'Ödendi',     color: 'bg-emerald-500/10 text-emerald-400' },
  failed:     { label: 'Başarısız',  color: 'bg-red-500/10 text-red-400' },
}

export default function AdminOdemeler() {
  const [payouts,  setPayouts]  = useState<Payout[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending')
  const [busy,     setBusy]     = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/payouts?status=${filter}`)
      .then(r => r.json())
      .then(d => { setPayouts(d.payouts ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [filter])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handle = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id)
    const res = await fetch('/api/admin/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: id, action }),
    })
    const d = await res.json()
    if (res.ok) {
      setPayouts(prev => prev.filter(p => p.id !== id))
      showToast(d.message ?? 'İşlem tamamlandı')
    } else {
      showToast('Hata: ' + (d.error ?? 'Bilinmeyen'))
    }
    setBusy(null)
  }

  const pendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[3px] uppercase text-[#E8622A] mb-2 font-semibold">Ödemeler</div>
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-2xl font-bold text-white/90">Ödeme Talepleri</h1>
          {filter === 'pending' && pendingAmount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] uppercase tracking-widest text-amber-400/60">Bekleyen Toplam</div>
              <div className="text-amber-400 font-bold font-mono">₺{pendingAmount.toLocaleString('tr-TR')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-6 bg-[#1A1612] border border-white/[0.07] rounded-xl p-1.5 w-fit">
        {[['pending','Bekleyen'],['processing','İşleniyor'],['paid','Ödendi'],['failed','Başarısız']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${
              filter === k ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/60'
            }`}>{l}</button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-[#1A1612] border border-white/[0.07] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/25 text-sm">Yükleniyor…</div>
        ) : payouts.length === 0 ? (
          <div className="py-16 text-center text-white/25 text-sm">
            {filter === 'pending' ? 'Bekleyen ödeme talebi yok' : 'Kayıt bulunamadı'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Aşçı', 'Tutar', 'IBAN', 'Talep Tarihi', 'Durum', 'İşlem'].map(h => (
                  <th key={h} className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/25 px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => {
                const sm = STATUS_META[p.status] ?? { label: p.status, color: 'text-white/40' }
                return (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="text-white/75 text-[13px] font-medium">{p.chef?.user?.full_name}</div>
                      <div className="text-white/30 text-[11px] font-mono">{p.chef?.user?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[14px] text-[#E8622A] font-bold">
                      ₺{p.amount.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-white/35">
                      {p.iban_snapshot ? `****${p.iban_snapshot.slice(-4)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-white/30 text-[12px]">
                      {new Date(p.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button disabled={busy === p.id} onClick={() => handle(p.id, 'approve')}
                            className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40">
                            ✅ Onayla
                          </button>
                          <button disabled={busy === p.id} onClick={() => handle(p.id, 'reject')}
                            className="text-[11px] font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/15 transition-all disabled:opacity-40">
                            ❌
                          </button>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1A1612] border border-white/10 rounded-xl px-5 py-3 text-[13px] text-white/80 shadow-2xl z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
