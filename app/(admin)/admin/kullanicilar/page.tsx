// @ts-nocheck
'use client'

import { useState } from 'react'
import { useAdminUsers, type AdminUser } from '@/hooks/useAdmin'

const ROLE_LABELS: Record<string, string> = { buyer: 'Alıcı', chef: 'Aşçı', admin: 'Admin' }
const ROLE_COLORS: Record<string, string> = {
  buyer: 'bg-blue-500/10 text-blue-400',
  chef:  'bg-amber-500/10 text-amber-400',
  admin: 'bg-purple-500/10 text-purple-400',
}

function UserRow({ user, onBan }: { user: AdminUser; onBan: (id: string, ban: boolean) => void }) {
  const chef = user.chef_profiles?.[0]
  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E8622A]/20 flex items-center justify-center text-[#E8622A] text-xs font-bold flex-shrink-0">
            {user.full_name[0]}
          </div>
          <div>
            <div className="text-white/80 text-[13px] font-medium">{user.full_name}</div>
            <div className="text-white/30 text-[11px] font-mono">{user.phone}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
          {ROLE_LABELS[user.role]}
        </span>
      </td>
      <td className="py-3 px-4 text-white/40 text-[12px]">
        {new Date(user.created_at).toLocaleDateString('tr-TR')}
      </td>
      <td className="py-3 px-4">
        {chef ? (
          <div className="text-[12px]">
            <div className="text-amber-400">⭐ {chef.average_rating?.toFixed(1) ?? '—'}</div>
            <div className="text-white/30">{chef.total_orders ?? 0} sipariş</div>
          </div>
        ) : <span className="text-white/20 text-[11px]">—</span>}
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {user.is_active ? 'Aktif' : 'Banlı'}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onBan(user.id, user.is_active)}
            className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-all ${
              user.is_active
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {user.is_active ? '🚫 Banla' : '✅ Aktifleştir'}
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AdminKullanicilar() {
  const { users, total, loading, page, setPage, filters, updateFilter, banUser } = useAdminUsers()
  const [confirmBan, setConfirmBan] = useState<{ id: string; ban: boolean } | null>(null)

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[3px] uppercase text-[#E8622A] mb-2 font-semibold">Kullanıcılar</div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-white/90">Kullanıcı Yönetimi</h1>
            <p className="text-white/35 text-sm mt-1">{total.toLocaleString('tr-TR')} kayıtlı kullanıcı</p>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Arama */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm">🔍</span>
          <input
            className="bg-[#1A1612] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2 text-[13px] text-white/70 placeholder-white/25 focus:outline-none focus:border-[#E8622A]/50 w-52 transition-colors"
            placeholder="Ad veya telefon ara…"
            value={filters.q}
            onChange={e => updateFilter('q', e.target.value)}
          />
        </div>

        {/* Rol filtresi */}
        <div className="flex gap-1.5">
          {[['', 'Tümü'], ['buyer', 'Alıcı'], ['chef', 'Aşçı'], ['admin', 'Admin']].map(([val, label]) => (
            <button key={val}
              onClick={() => updateFilter('role', val)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filters.role === val
                  ? 'bg-[#E8622A] text-white'
                  : 'bg-white/[0.05] text-white/40 hover:text-white/70'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Durum filtresi */}
        <div className="flex gap-1.5 ml-auto">
          {[['', 'Tümü'], ['true', 'Aktif'], ['false', 'Banlı']].map(([val, label]) => (
            <button key={val}
              onClick={() => updateFilter('active', val)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filters.active === val
                  ? 'bg-white/15 text-white'
                  : 'bg-white/[0.04] text-white/35 hover:text-white/60'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-[#1A1612] border border-white/[0.07] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/25 text-sm">Yükleniyor…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Kullanıcı', 'Rol', 'Kayıt Tarihi', 'Aşçı Bilgisi', 'Durum', 'İşlem'].map(h => (
                  <th key={h} className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/25 px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-white/25 text-sm">Kullanıcı bulunamadı</td></tr>
              ) : (
                users.map(u => (
                  <UserRow key={u.id} user={u} onBan={(id, ban) => setConfirmBan({ id, ban })} />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-white/30">
            {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.05] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
              ← Önceki
            </button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] bg-[#E8622A]/15 text-[#E8622A] font-bold">
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-[12px] bg-white/[0.05] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
              Sonraki →
            </button>
          </div>
        </div>
      )}

      {/* Ban onay modalı */}
      {confirmBan && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setConfirmBan(null)}>
          <div className="bg-[#1A1612] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-white/90 mb-2">
              {confirmBan.ban ? '🚫 Kullanıcıyı Banla' : '✅ Banı Kaldır'}
            </div>
            <p className="text-sm text-white/40 mb-6">
              {confirmBan.ban ? 'Bu kullanıcı platforma erişemez.' : 'Kullanıcı yeniden aktifleşecek.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBan(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-white/40 hover:text-white/70 transition-colors">
                İptal
              </button>
              <button
                onClick={async () => {
                  await banUser(confirmBan.id, confirmBan.ban)
                  setConfirmBan(null)
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  confirmBan.ban ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {confirmBan.ban ? 'Banla' : 'Aktifleştir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
