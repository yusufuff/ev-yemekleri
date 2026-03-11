// @ts-nocheck
'use client'

import { useState } from 'react'

interface OpenToggleProps {
  isOpen:       boolean
  chefName:     string
  onToggle:     (val: boolean) => void
  pendingCount: number
  onRefresh:    () => void
}

export function OpenToggle({
  isOpen,
  chefName,
  onToggle,
  pendingCount,
  onRefresh,
}: OpenToggleProps) {
  const [toggling,   setToggling]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const firstName = chefName.split(' ')[0]

  async function handleToggle() {
    setToggling(true)
    await onToggle(!isOpen)
    setToggling(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    onRefresh()
    await new Promise(r => setTimeout(r, 600))
    setRefreshing(false)
  }

  return (
    <div className="ot-wrap">
      {/* Sol — karşılama + durum */}
      <div className="ot-left">
        <div className="ot-greeting">
          Merhaba, <strong>{firstName}</strong> 👋
        </div>
        <div className="ot-status-row">
          <div className={`ot-pulse ${isOpen ? 'open' : 'closed'}`} />
          <span className={`ot-status-text ${isOpen ? 'open' : 'closed'}`}>
            {isOpen ? 'Şu an açıksınız — siparişler alınıyor' : 'Kapalısınız — siparişler duraklatıldı'}
          </span>
        </div>
      </div>

      {/* Sağ — kontroller */}
      <div className="ot-right">
        {/* Bekleyen badge */}
        {pendingCount > 0 && (
          <div className="ot-pending-badge">
            🔔 {pendingCount} bekliyor
          </div>
        )}

        {/* Yenile */}
        <button
          className={`ot-refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          title="Verileri yenile"
          aria-label="Yenile"
        >
          ↻
        </button>

        {/* Toggle */}
        <div className="ot-toggle-group">
          <span className="ot-toggle-label">{isOpen ? 'Açık' : 'Kapalı'}</span>
          <button
            role="switch"
            aria-checked={isOpen}
            aria-label={isOpen ? 'Kapatmak için tıkla' : 'Açmak için tıkla'}
            className={`ot-toggle ${isOpen ? 'on' : 'off'} ${toggling ? 'busy' : ''}`}
            onClick={handleToggle}
            disabled={toggling}
          >
            <span className="ot-thumb" />
          </button>
        </div>
      </div>

      <style>{`
        .ot-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ot-left { display: flex; flex-direction: column; gap: 3px; }

        .ot-greeting {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--brown);
        }

        .ot-status-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .ot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ot-pulse.open {
          background: var(--green);
          animation: live-pulse 2s ease-in-out infinite;
        }

        .ot-pulse.closed { background: var(--gray-light); }

        @keyframes live-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(61,107,71,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(61,107,71,0); }
        }

        .ot-status-text {
          font-size: 12px;
          font-weight: 500;
        }

        .ot-status-text.open   { color: var(--green); }
        .ot-status-text.closed { color: var(--gray); }

        /* ── Sağ kontroller ──────────────────── */
        .ot-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ot-pending-badge {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--orange);
          background: #FEF3EC;
          border: 1.5px solid rgba(232,98,42,0.3);
          padding: 5px 12px;
          border-radius: 20px;
          animation: badge-throb 1.5s ease-in-out infinite;
        }

        @keyframes badge-throb {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.03); }
        }

        .ot-refresh-btn {
          width: 34px;
          height: 34px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          color: var(--gray);
          line-height: 1;
        }

        .ot-refresh-btn:hover { border-color: var(--orange); color: var(--orange); }

        .ot-refresh-btn.spinning {
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Toggle ───────────────────────────── */
        .ot-toggle-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ot-toggle-label {
          font-size: 12px;
          font-weight: 700;
          min-width: 42px;
          text-align: right;
          color: var(--brown-mid);
        }

        .ot-toggle {
          width: 52px;
          height: 28px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.25s;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .ot-toggle.on  { background: var(--green); }
        .ot-toggle.off { background: var(--gray-light); }
        .ot-toggle.busy { opacity: 0.6; cursor: wait; }

        .ot-thumb {
          position: absolute;
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .ot-toggle.on  .ot-thumb { left: 27px; }
        .ot-toggle.off .ot-thumb { left: 3px; }
      `}</style>
    </div>
  )
}
