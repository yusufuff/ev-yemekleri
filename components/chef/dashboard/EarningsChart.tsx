'use client'

import type { EarningsDay } from '@/types/dashboard'

interface EarningsChartProps {
  data:         EarningsDay[]
  weekTotal:    number
  monthTotal:   number
  pendingBalance: number
}

const DAY_LABELS: Record<string, string> = {
  '0': 'Pzt', '1': 'Sal', '2': 'Çar',
  '3': 'Per', '4': 'Cum', '5': 'Cmt', '6': 'Paz',
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const diff  = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Dün'
  return DAY_LABELS[String(d.getDay() === 0 ? 6 : d.getDay() - 1)] ?? '—'
}

export function EarningsChart({
  data,
  weekTotal,
  monthTotal,
  pendingBalance,
}: EarningsChartProps) {
  const maxEarning = Math.max(...data.map(d => d.earning), 1)
  const todayIdx   = data.length - 1

  return (
    <div className="echart-wrap">
      {/* Özet satırı */}
      <div className="echart-summary">
        <div className="echart-summary-item">
          <div className="echart-summary-label">Bu Hafta</div>
          <div className="echart-summary-value">
            ₺{weekTotal.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="echart-summary-divider" />
        <div className="echart-summary-item">
          <div className="echart-summary-label">Bu Ay</div>
          <div className="echart-summary-value">
            ₺{monthTotal.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="echart-summary-divider" />
        <div className="echart-summary-item">
          <div className="echart-summary-label">Çekilebilir</div>
          <div className="echart-summary-value echart-pending">
            ₺{pendingBalance.toLocaleString('tr-TR')}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="echart-bars" role="img" aria-label="7 günlük kazanç grafiği">
        {data.map((day, idx) => {
          const pct     = (day.earning / maxEarning) * 100
          const isToday = idx === todayIdx
          const isEmpty = day.earning === 0

          return (
            <div key={day.day} className="echart-col">
              {/* Tutar label — hover'da göster */}
              {!isEmpty && (
                <div className="echart-tooltip">
                  ₺{day.earning.toLocaleString('tr-TR')}
                  <br />
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{day.order_count} sipariş</span>
                </div>
              )}

              {/* Bar */}
              <div className="echart-bar-track">
                <div
                  className={`echart-bar ${isToday ? 'today' : ''} ${isEmpty ? 'empty' : ''}`}
                  style={{ height: isEmpty ? '4px' : `${Math.max(pct, 6)}%` }}
                  aria-label={`${getDayLabel(day.day)}: ₺${day.earning}`}
                />
              </div>

              {/* Gün etiketi */}
              <div className={`echart-label ${isToday ? 'today-label' : ''}`}>
                {getDayLabel(day.day)}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .echart-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Özet ─────────────────────────────────── */
        .echart-summary {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--warm);
          border-radius: 10px;
          padding: 12px 0;
        }

        .echart-summary-item {
          flex: 1;
          text-align: center;
          padding: 0 8px;
        }

        .echart-summary-divider {
          width: 1px;
          height: 32px;
          background: var(--gray-light);
        }

        .echart-summary-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--gray);
          font-weight: 700;
          margin-bottom: 4px;
        }

        .echart-summary-value {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--brown);
        }

        .echart-pending { color: var(--green); }

        /* ── Grafik ───────────────────────────────── */
        .echart-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 120px;
          padding-bottom: 22px;
          position: relative;
        }

        .echart-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          position: relative;
        }

        .echart-col:hover .echart-tooltip {
          opacity: 1;
          transform: translateY(-4px);
        }

        .echart-tooltip {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%) translateY(0);
          background: var(--brown);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 7px;
          border-radius: 6px;
          white-space: nowrap;
          text-align: center;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          z-index: 10;
          line-height: 1.4;
        }

        .echart-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: var(--brown);
        }

        .echart-bar-track {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
        }

        .echart-bar {
          width: 100%;
          border-radius: 5px 5px 0 0;
          background: linear-gradient(to top, var(--orange), #F28B5E);
          transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          min-height: 4px;
        }

        .echart-bar.today {
          background: linear-gradient(to top, var(--green), #6BA37A);
          box-shadow: 0 -3px 8px rgba(61,107,71,0.3);
        }

        .echart-bar.empty {
          background: var(--gray-light);
        }

        .echart-label {
          position: absolute;
          bottom: 0;
          font-size: 10px;
          color: var(--gray);
          font-weight: 600;
          white-space: nowrap;
        }

        .today-label {
          color: var(--green);
          font-weight: 800;
        }
      `}</style>
    </div>
  )
}
