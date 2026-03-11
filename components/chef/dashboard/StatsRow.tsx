// @ts-nocheck
'use client'

import type { DashboardStats } from '@/types/dashboard'

const BADGE_META: Record<string, { label: string; emoji: string; color: string }> = {
  new:     { label: 'Yeni Aşçı',  emoji: '🌱', color: '#9CA3AF' },
  trusted: { label: 'Güvenilir',  emoji: '⭐', color: '#34D399' },
  master:  { label: 'Usta Eller', emoji: '🏅', color: '#F59E0B' },
  chef:    { label: 'Ev Şefi',    emoji: '👑', color: '#F59E0B' },
}

interface StatsRowProps {
  stats: DashboardStats
}

export function StatsRow({ stats }: StatsRowProps) {
  const badge = BADGE_META[stats.badge ?? 'new']

  const cards = [
    {
      label:   'Bekleyen Sipariş',
      value:   stats.pending_count,
      sub:     stats.pending_count > 0 ? '⚡ Onay bekliyor' : 'Yeni sipariş bekleniyor',
      icon:    '🛒',
      accent:  'orange' as const,
      urgent:  stats.pending_count > 0,
    },
    {
      label:   'Bugünkü Kazanç',
      value:   `₺${stats.today_earning.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`,
      sub:     `${stats.today_order_count} sipariş tamamlandı`,
      icon:    '💰',
      accent:  'green' as const,
      urgent:  false,
    },
    {
      label:   'Bu Hafta',
      value:   `₺${stats.week_earning.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`,
      sub:     `Çekilebilir: ₺${stats.pending_balance.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`,
      icon:    '📅',
      accent:  'brown' as const,
      urgent:  false,
    },
    {
      label:   'Puan Ortalaması',
      value:   stats.avg_rating ? stats.avg_rating.toFixed(1) : '—',
      sub:     `${stats.total_reviews} değerlendirme`,
      icon:    '⭐',
      accent:  'blue' as const,
      urgent:  false,
    },
  ]

  return (
    <div className="stats-section">
      {/* Badge + Genel bilgi */}
      <div className="stats-header">
        <div
          className="badge-pill"
          style={{ background: badge.color + '22', color: badge.color, borderColor: badge.color + '44' }}
        >
          {badge.emoji} {badge.label} · {stats.total_orders} sipariş
        </div>
        {stats.unanswered_reviews > 0 && (
          <div className="review-alert">
            💬 {stats.unanswered_reviews} yoruma yanıt verilmedi
          </div>
        )}
      </div>

      {/* Kartlar */}
      <div className="stats-grid">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`stat-card stat-${card.accent} ${card.urgent ? 'stat-urgent' : ''}`}
          >
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
            <div className={`stat-sub ${card.urgent ? 'stat-sub-urgent' : ''}`}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .stats-section { display: flex; flex-direction: column; gap: 12px; }

        .stats-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid;
        }

        .review-alert {
          font-size: 11.5px;
          color: var(--orange);
          background: #FEF3EC;
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 600;
          animation: pulse-subtle 2s infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-card {
          background: var(--white);
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 2px 12px rgba(74,44,14,0.07);
          border: 1px solid rgba(232,224,212,0.6);
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(74,44,14,0.11);
        }

        /* Accent çizgisi */
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 14px 14px 0 0;
        }

        .stat-orange::before { background: var(--orange); }
        .stat-green::before  { background: var(--green); }
        .stat-brown::before  { background: var(--brown); }
        .stat-blue::before   { background: #3B82F6; }

        .stat-urgent {
          border-color: rgba(232,98,42,0.3);
          background: linear-gradient(135deg, #fff, #FFF9F5);
          animation: urgent-glow 2.5s ease-in-out infinite;
        }

        @keyframes urgent-glow {
          0%, 100% { box-shadow: 0 2px 12px rgba(74,44,14,0.07); }
          50%       { box-shadow: 0 2px 20px rgba(232,98,42,0.18); }
        }

        .stat-icon {
          position: absolute;
          right: 14px;
          top: 18px;
          font-size: 26px;
          opacity: 0.13;
        }

        .stat-label {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--gray);
          font-weight: 700;
          margin-bottom: 6px;
        }

        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 700;
          color: var(--brown);
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-sub {
          font-size: 11.5px;
          color: var(--gray);
          font-weight: 500;
        }

        .stat-sub-urgent {
          color: var(--orange);
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}
