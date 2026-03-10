'use client'

import { useEffect, useRef } from 'react'

interface MobileDrawerProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  /** 'bottom' (default) veya 'right' — masaüstünde right, mobilde bottom */
  variant?:   'bottom' | 'right' | 'auto'
  maxHeight?: string
}

/**
 * MobileDrawer — Responsive modal/drawer.
 * - Mobil (<768px): altta açılan sheet (bottom drawer)
 * - Masaüstü (≥768px): sağdan açılan sidebar
 * variant='auto' (default) her iki tarafta uygun görünümü seçer.
 */
export function MobileDrawer({
  open,
  onClose,
  title,
  children,
  variant = 'auto',
  maxHeight = '85vh',
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // ESC ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Scroll kilitle
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        className={`md-overlay ${open ? 'md-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`md-drawer md-drawer--${variant} ${open ? 'md-drawer--open' : ''}`}
        role="dialog"
        aria-modal
        aria-label={title}
        style={{ '--max-h': maxHeight } as React.CSSProperties}
      >
        {/* Handle (sadece bottom) */}
        <div className="md-handle" aria-hidden />

        {/* Başlık */}
        {title && (
          <div className="md-header">
            <div className="md-title">{title}</div>
            <button className="md-close" onClick={onClose} aria-label="Kapat">✕</button>
          </div>
        )}

        {/* İçerik */}
        <div className="md-body">
          {children}
        </div>
      </div>

      <style>{`
        /* ── Overlay ────────────────────────────── */
        .md-overlay {
          position: fixed; inset: 0;
          background: rgba(74,44,14,0.4);
          z-index: 300;
          opacity: 0; pointer-events: none;
          transition: opacity 0.25s ease;
          backdrop-filter: blur(2px);
        }

        .md-overlay--open {
          opacity: 1; pointer-events: all;
        }

        /* ── Drawer ─────────────────────────────── */
        .md-drawer {
          position: fixed;
          z-index: 301;
          background: var(--white);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        /* ── Bottom variant (mobil default) ─────── */
        .md-drawer--bottom,
        .md-drawer--auto {
          bottom: 0; left: 0; right: 0;
          border-radius: 20px 20px 0 0;
          max-height: var(--max-h, 85vh);
          transform: translateY(100%);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .md-drawer--bottom.md-drawer--open,
        .md-drawer--auto.md-drawer--open {
          transform: translateY(0);
        }

        /* ── Right variant (masaüstü) ───────────── */
        @media (min-width: 768px) {
          .md-drawer--auto,
          .md-drawer--right {
            top: 0; right: 0; bottom: 0;
            width: 420px; max-height: none;
            border-radius: 0;
            transform: translateX(100%);
          }

          .md-drawer--auto.md-drawer--open,
          .md-drawer--right.md-drawer--open {
            transform: translateX(0);
          }

          /* Mobil handle masaüstünde gizli */
          .md-handle { display: none; }
        }

        /* ── Handle çizgisi ─────────────────────── */
        .md-handle {
          width: 36px; height: 4px;
          background: var(--gray-light);
          border-radius: 2px;
          margin: 10px auto 2px;
          flex-shrink: 0;
        }

        /* ── Header ─────────────────────────────── */
        .md-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--gray-light);
          flex-shrink: 0;
        }

        .md-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 700;
          color: var(--brown);
        }

        .md-close {
          width: 32px; height: 32px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          color: var(--gray);
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .md-close:hover { border-color: var(--orange); color: var(--orange); }

        /* ── Body ───────────────────────────────── */
        .md-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px 20px;
        }
      `}</style>
    </>
  )
}
