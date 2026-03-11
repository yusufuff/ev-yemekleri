// @ts-nocheck
'use client'

import { useChefDashboard }  from '@/hooks/useChefDashboard'
import { OpenToggle }        from '@/components/chef/dashboard/OpenToggle'
import { StatsRow }          from '@/components/chef/dashboard/StatsRow'
import { PendingOrders }     from '@/components/chef/dashboard/PendingOrders'
import { ActiveOrders }      from '@/components/chef/dashboard/ActiveOrders'
import { EarningsChart }     from '@/components/chef/dashboard/EarningsChart'
import { StockPanel }        from '@/components/chef/dashboard/StockPanel'
import { RecentOrders }      from '@/components/chef/dashboard/RecentOrders'
import Link from 'next/link'

// ── Skeleton bileşeni ─────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, radius = 6 }: { w?: string; h?: number; radius?: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: radius,
        background: 'linear-gradient(90deg, var(--gray-light) 25%, var(--warm) 50%, var(--gray-light) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} h={90} radius={14} />)}
      </div>
      {/* İki sütun */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Skeleton h={280} radius={14} />
        <Skeleton h={280} radius={14} />
      </div>
      <Skeleton h={180} radius={14} />
    </div>
  )
}

// ── Hata ekranı ───────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      background: '#FEF2F2',
      border: '1.5px solid #FECACA',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 13, color: '#DC2626' }}>⚠️ {message}</span>
      <button
        onClick={onRetry}
        style={{
          padding: '6px 14px',
          background: '#DC2626',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Yenile
      </button>
    </div>
  )
}

// ── Kart sarmalayıcı ──────────────────────────────────────────────────────────
function Panel({
  title,
  action,
  children,
}: {
  title:    string
  action?:  React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h2 className="panel-title">{title}</h2>
        {action && <div className="panel-action">{action}</div>}
      </div>
      {children}
      <style>{`
        .dashboard-panel {
          background: var(--white);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 16px rgba(74,44,14,0.07);
          border: 1px solid rgba(232,224,212,0.6);
        }
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .panel-title {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--brown);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .panel-title::after {
          content: '';
          flex: 1;
        }
        .panel-action { flex-shrink: 0; }
      `}</style>
    </div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export default function ChefDashboard() {
  const {
    data,
    isLoading,
    error,
    refresh,
    updateOrderStatus,
    toggleOpen,
  } = useChefDashboard()

  // ── Yükleniyor ──
  if (isLoading && !data) {
    return (
      <div className="dash-wrap">
        <div className="dash-header-skeleton">
          <Skeleton w="200px" h={28} />
          <Skeleton w="120px" h={28} />
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  if (!data) return null

  const { stats, pendingOrders, activeOrders, recentOrders, earningsByDay, stockItems, chefName } = data

  const hasPending = pendingOrders.length > 0
  const hasActive  = activeOrders.length > 0

  return (
    <div className="dash-wrap">

      {/* ── Üst bar ──────────────────────────────────────────────────────── */}
      <div className="dash-topbar">
        <OpenToggle
          isOpen={stats.is_open}
          chefName={chefName}
          onToggle={toggleOpen}
          pendingCount={stats.pending_count}
          onRefresh={refresh}
        />
      </div>

      {/* ── Hata banner ────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* ── İstatistikler ──────────────────────────────────────────────── */}
      <StatsRow stats={stats} />

      {/* ── Siparişler + Stok (iki sütun) ─────────────────────────────── */}
      <div className="dash-grid-2">

        {/* Sol sütun — Siparişler */}
        <div className="dash-orders-col">

          {hasPending && (
            <Panel
              title={`⏳ Bekleyen (${pendingOrders.length})`}
              action={
                <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>
                  Yeni sipariş!
                </span>
              }
            >
              <PendingOrders orders={pendingOrders} onAction={updateOrderStatus} />
            </Panel>
          )}

          {hasActive && (
            <Panel title={`🍳 Aktif (${activeOrders.length})`}>
              <ActiveOrders orders={activeOrders} onAction={updateOrderStatus} />
            </Panel>
          )}

          {!hasPending && !hasActive && (
            <Panel title="📋 Siparişler">
              <div style={{
                textAlign: 'center',
                padding: '32px 20px',
                color: 'var(--gray)',
                fontSize: 13,
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>
                  {stats.is_open ? '☕' : '😴'}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>
                  {stats.is_open ? 'Sipariş bekleniyor' : 'Şu an kapalısınız'}
                </div>
                <div style={{ fontSize: 12 }}>
                  {stats.is_open
                    ? 'Yeni siparişler gerçek zamanlı olarak görünür'
                    : 'Sipariş almak için yukarıdaki butonu açık konuma getirin'}
                </div>
              </div>
            </Panel>
          )}
        </div>

        {/* Sağ sütun — Grafik + Stok */}
        <div className="dash-right-col">

          <Panel
            title="📊 Kazanç"
            action={
              <Link
                href="/kazanc"
                style={{ fontSize: 11.5, color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}
              >
                Tümü →
              </Link>
            }
          >
            <EarningsChart
              data={earningsByDay}
              weekTotal={stats.week_earning}
              monthTotal={stats.month_earning}
              pendingBalance={stats.pending_balance}
            />
          </Panel>

          <Panel
            title="📦 Stok Durumu"
            action={
              <Link
                href="/menu"
                style={{ fontSize: 11.5, color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}
              >
                Menüyü Yönet →
              </Link>
            }
          >
            <StockPanel items={stockItems} onRefresh={refresh} />
          </Panel>
        </div>
      </div>

      {/* ── Son siparişler (tam genişlik) ─────────────────────────────── */}
      {recentOrders.length > 0 && (
        <Panel
          title="🕐 Son Siparişler"
          action={
            <Link
              href="/siparisler"
              style={{ fontSize: 11.5, color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}
            >
              Tümünü Gör →
            </Link>
          }
        >
          <RecentOrders orders={recentOrders} />
        </Panel>
      )}

      {/* ── Hızlı linkler ─────────────────────────────────────────────── */}
      <div className="quick-links">
        <Link href="/menu/yeni"        className="quick-link">➕ Yemek Ekle</Link>
        <Link href="/siparisler"       className="quick-link">📋 Tüm Siparişler</Link>
        <Link href="/kazanc"           className="quick-link">💰 Kazanç & Ödeme</Link>
        <Link href="/asci-ayarlar"     className="quick-link">⚙️ Profil Ayarları</Link>
        <Link href="/asci-istatistik"  className="quick-link">📈 İstatistikler</Link>
      </div>

      <style>{`
        .dash-wrap {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dash-topbar {
          background: var(--white);
          border-radius: 16px;
          padding: 18px 24px;
          box-shadow: 0 2px 16px rgba(74,44,14,0.07);
          border: 1px solid rgba(232,224,212,0.6);
        }

        .dash-header-skeleton {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .dash-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .dash-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .dash-orders-col,
        .dash-right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Hızlı linkler */
        .quick-links {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-bottom: 8px;
        }

        .quick-link {
          padding: 8px 16px;
          background: var(--white);
          border: 1.5px solid var(--gray-light);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--brown-mid);
          text-decoration: none;
          transition: all 0.15s;
          box-shadow: 0 1px 4px rgba(74,44,14,0.06);
        }

        .quick-link:hover {
          border-color: var(--orange);
          color: var(--orange);
          background: #FFF9F5;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(232,98,42,0.12);
        }
      `}</style>
    </div>
  )
}
