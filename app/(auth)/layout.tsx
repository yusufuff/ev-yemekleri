import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Giriş Yap — Ev Yemekleri',
  description: 'Mahallenizdeki ev aşçılarından sipariş verin',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {/* Dekoratif arka plan */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
        <div className="auth-bg-pattern" />
      </div>

      {/* Logo */}
      <div className="auth-header">
        <Link href="/" className="auth-logo">
          <span className="auth-logo-icon">🍽️</span>
          <div>
            <div className="auth-logo-name">EV YEMEKLERİ</div>
            <div className="auth-logo-tagline">MAHALLE LEZZETLERI</div>
          </div>
        </Link>
      </div>

      {/* İçerik */}
      <main className="auth-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <span>© 2024 Ev Yemekleri</span>
        <span>·</span>
        <Link href="/kvkk">KVKK</Link>
        <span>·</span>
        <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
      </footer>

      <style>{`
        .auth-shell {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: 0 16px;
        }

        /* Dekoratif arka plan elementleri */
        .auth-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .auth-bg-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.06;
        }

        .auth-bg-circle-1 {
          width: 600px;
          height: 600px;
          background: var(--orange);
          top: -200px;
          right: -150px;
        }

        .auth-bg-circle-2 {
          width: 400px;
          height: 400px;
          background: var(--green);
          bottom: -100px;
          left: -100px;
        }

        .auth-bg-pattern {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(232,98,42,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(61,107,71,0.04) 0%, transparent 50%);
        }

        /* Header */
        .auth-header {
          position: relative;
          z-index: 1;
          padding: 32px 0 0;
          width: 100%;
          max-width: 480px;
        }

        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .auth-logo:hover { opacity: 0.75; }

        .auth-logo-icon {
          font-size: 26px;
          line-height: 1;
        }

        .auth-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 900;
          color: var(--brown);
          letter-spacing: 1px;
          line-height: 1.2;
        }

        .auth-logo-tagline {
          font-size: 8px;
          letter-spacing: 2.5px;
          color: var(--orange);
          text-transform: uppercase;
          font-weight: 700;
        }

        /* Main */
        .auth-main {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 0 40px;
        }

        /* Footer */
        .auth-footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--gray);
          padding: 16px 0 24px;
        }

        .auth-footer a {
          color: var(--gray);
          text-decoration: none;
          transition: color 0.15s;
        }

        .auth-footer a:hover { color: var(--orange); }
      `}</style>
    </div>
  )
}
