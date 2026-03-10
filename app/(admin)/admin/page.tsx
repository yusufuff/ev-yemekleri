'use client'

import { useAdminStats } from '@/hooks/useAdmin'

// Basit bar grafik — recharts veya Chart.js yerine native SVG
function MiniChart({ data }: { data: { day: string; count: number; revenue: number }[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end gap-2 h-28 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-[10px] text-white/30 font-mono">
            {d.revenue > 0 ? `₺${Math.round(d.revenue / 1000)}K` : ''}
          </div>
          <div
            className="w-full rounded-t bg-gradient-to-t from-[#E8622A] to-[#F28B5E] transition-all duration-500"
            style={{ height: `${Math.max((d.revenue / maxRev) * 80, 4)}%` }}
          />
          <div className="text-[10px] text-white/40">{d.day}</div>
        </div>
      ))}
    </div>
  )
}

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string | number; sub?: string; color: string; icon: string
}) {
  return (
    <div className={`relative bg-[#1A1612] border border-white/[0.07] rounded-xl p-5 overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
      <div className="absolute right-4 top-4 text-3xl opacity-10">{icon}</div>
      <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-white/35 mb-2">{label}</div>
      <div className="font-serif text-3xl font-bold text-white/90">{value}</div>
      {sub && <div className="text-[12px] text-emerald-400/80 mt-1">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const { stats, chart, loading } = useAdminStats()

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="text-white/30 text-sm">Yükleniyor…</div>
    </div>
  )

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] tracking-[3px] uppercase text-[#E8622A] mb-2 font-semibold">Admin Panel</div>
        <h1 className="font-serif text-3xl font-bold text-white/90">Dashboard</h1>
        <p className="text-white/35 text-sm mt-1">Platform genel durumu — gerçek zamanlı</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Toplam Kullanıcı"  value={stats?.total_users ?? 0}  icon="👥" color="bg-blue-500"
          sub={`${stats?.today_orders ?? 0} bugün sipariş`} />
        <StatCard label="Kayıtlı Aşçı"      value={stats?.total_chefs ?? 0}   icon="👩‍🍳" color="bg-amber-500"
          sub={stats?.pending_chefs ? `${stats.pending_chefs} onay bekliyor` : undefined} />
        <StatCard label="Toplam Sipariş"    value={stats?.total_orders ?? 0}  icon="📋" color="bg-[#E8622A]"
          sub={`${stats?.active_orders ?? 0} aktif`} />
        <StatCard label="Haftalık Gelir"
          value={`₺${((stats?.week_revenue ?? 0) / 1000).toFixed(1)}K`}
          icon="💰" color="bg-emerald-500"
          sub={stats?.revenue_growth ? `↑ %${stats.revenue_growth} geçen haftaya göre` : undefined} />
      </div>

      {/* Grafik + Hızlı linkler */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Grafik */}
        <div className="col-span-2 bg-[#1A1612] border border-white/[0.07] rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-white/80 font-semibold text-sm">Haftalık Sipariş & Gelir</div>
              <div className="text-white/30 text-[11px] mt-0.5">Son 7 gün</div>
            </div>
            <div className="text-[11px] text-white/30">
              Toplam <span className="text-white/60 font-bold">
                ₺{((stats?.week_revenue ?? 0)).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
          <MiniChart data={chart} />
        </div>

        {/* Hızlı aksiyonlar */}
        <div className="bg-[#1A1612] border border-white/[0.07] rounded-xl p-5">
          <div className="text-white/60 text-sm font-semibold mb-4">Hızlı Erişim</div>
          <div className="flex flex-col gap-2">
            {[
              { href: '/admin/asciler?status=pending', label: 'Onay Bekleyen Aşçılar', count: stats?.pending_chefs, color: 'text-amber-400', urgent: true },
              { href: '/admin/siparisler?status=pending', label: 'Bekleyen Siparişler', count: stats?.today_orders, color: 'text-[#E8622A]', urgent: false },
              { href: '/admin/kullanicilar', label: 'Tüm Kullanıcılar', count: stats?.total_users, color: 'text-blue-400', urgent: false },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 transition-all group">
                <span className={`text-[13px] font-medium ${item.urgent ? 'text-white/80' : 'text-white/50'} group-hover:text-white/80`}>
                  {item.label}
                </span>
                {(item.count ?? 0) > 0 && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] ${item.color}`}>
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
