'use client'

import { useState } from 'react'
import { useAdminChefs, type AdminChef } from '@/hooks/useAdmin'

const STATUS_TABS = [
  { key: 'pending',  label: 'Onay Bekleyen', color: 'text-amber-400' },
  { key: 'approved', label: 'Onaylı',         color: 'text-emerald-400' },
  { key: 'rejected', label: 'Reddedilen',     color: 'text-red-400' },
] as const

function ChefCard({
  chef, onReview,
}: {
  chef: AdminChef
  onReview: (id: string, action: 'approve' | 'reject' | 'suspend' | 'unsuspend', reason?: string) => Promise<boolean>
}) {
  const [expanded, setExpanded] = useState(false)
  const [reason,   setReason]   = useState('')
  const [busy,     setBusy]     = useState(false)

  const handle = async (action: 'approve' | 'reject' | 'suspend' | 'unsuspend') => {
    setBusy(true)
    await onReview(chef.id, action, reason)
    setBusy(false)
  }

  const isPending  = chef.verification_status === 'pending'
  const isApproved = chef.verification_status === 'approved'

  return (
    <div className="bg-[#1A1612] border border-white/[0.07] rounded-xl overflow-hidden transition-all">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #E8622A33, #F28B5E33)', color: '#F28B5E' }}>
          {chef.user.full_name[0]}
        </div>

        {/* Bilgi */}
        <div className="flex-1 min-w-0">
          <div className="text-white/80 font-semibold text-[14px]">{chef.user.full_name}</div>
          <div className="text-white/30 text-[12px] font-mono mt-0.5">{chef.user.phone}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {chef.kitchen_types?.map(k => (
              <span key={k} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40">
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0">
          <div className="text-[11px] text-white/25">
            {new Date(chef.created_at).toLocaleDateString('tr-TR')}
          </div>
          <div className="text-[11px] text-white/35 mt-0.5">
            {chef.chef_documents?.length ?? 0} belge
          </div>
          <div className={`text-[20px] mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ⌄
          </div>
        </div>
      </div>

      {/* Detay */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-5 space-y-4">
          {/* Biyografi */}
          {chef.bio && (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Biyografi</div>
              <p className="text-[13px] text-white/55 leading-relaxed">{chef.bio}</p>
            </div>
          )}

          {/* Belgeler */}
          {chef.chef_documents && chef.chef_documents.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Belgeler</div>
              <div className="grid grid-cols-2 gap-2">
                {chef.chef_documents.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl px-3 py-2.5 transition-all">
                    <span className="text-lg">📄</span>
                    <div>
                      <div className="text-[12px] text-white/60 font-medium">
                        {doc.doc_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-[#E8622A]">Görüntüle →</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* İstatistikler (onaylı aşçılar için) */}
          {isApproved && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Ortalama Puan', value: chef.average_rating?.toFixed(1) ?? '—' },
                { label: 'Toplam Sipariş', value: chef.total_orders ?? 0 },
                { label: 'Durum', value: chef.is_active ? 'Aktif' : 'Askıda' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05] text-center">
                  <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1">{label}</div>
                  <div className="text-white/70 font-bold text-sm">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sebep girişi + aksiyonlar */}
          <div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Karar sebebi (opsiyonel — aşçıya bildirim gönderilir)…"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-white/60 placeholder-white/20 focus:outline-none focus:border-[#E8622A]/40 resize-none mb-3"
            />

            <div className="flex gap-2 flex-wrap">
              {isPending && (
                <>
                  <button disabled={busy} onClick={() => handle('approve')}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-40">
                    ✅ Onayla
                  </button>
                  <button disabled={busy} onClick={() => handle('reject')}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-40">
                    ❌ Reddet
                  </button>
                </>
              )}
              {isApproved && (
                <button disabled={busy} onClick={() => handle(chef.is_active ? 'suspend' : 'unsuspend')}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40 border ${
                    chef.is_active
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                  }`}>
                  {chef.is_active ? '⏸ Askıya Al' : '▶ Aktifleştir'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminAsciler() {
  const { chefs, total, loading, status, changeStatus, reviewChef } = useAdminChefs()

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[3px] uppercase text-[#E8622A] mb-2 font-semibold">Aşçılar</div>
        <h1 className="font-serif text-2xl font-bold text-white/90">Aşçı Yönetimi</h1>
        <p className="text-white/35 text-sm mt-1">{total} kayıt</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-6 bg-[#1A1612] border border-white/[0.07] rounded-xl p-1.5 w-fit">
        {STATUS_TABS.map(tab => (
          <button key={tab.key}
            onClick={() => changeStatus(tab.key)}
            className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${
              status === tab.key
                ? `bg-white/10 ${tab.color}`
                : 'text-white/30 hover:text-white/60'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-16 text-center text-white/25 text-sm">Yükleniyor…</div>
      ) : chefs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-4xl mb-3 opacity-30">👩‍🍳</div>
          <div className="text-white/25 text-sm">
            {status === 'pending' ? 'Onay bekleyen başvuru yok' : 'Aşçı bulunamadı'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {chefs.map(chef => (
            <ChefCard key={chef.id} chef={chef} onReview={reviewChef} />
          ))}
        </div>
      )}
    </div>
  )
}
