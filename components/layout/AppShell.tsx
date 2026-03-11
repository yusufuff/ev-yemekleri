// @ts-nocheck
import { getCurrentUser } from '@/lib/supabase/server'
import Sidebar from './Sidebar'
import Header from './Header'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'

interface ShellProps {
  children:        React.ReactNode
  title:           string
  subtitle?:       string
  actions?:        React.ReactNode
  mobileTitle?:    string
  showMobileBack?: boolean
}

/**
 * AppShell — Responsive tam sayfa iskelet.
 *
 * Masaüstü (≥768px): Sidebar + Header + İçerik
 * Mobil   (<768px):  MobileHeader + İçerik + BottomNav
 */
export default async function AppShell({
  children,
  title,
  subtitle,
  actions,
  mobileTitle,
  showMobileBack = false,
}: ShellProps) {
  const user = await getCurrentUser()

  return (
    <>
      {/* ── Masaüstü ─── */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header title={title} subtitle={subtitle} user={user} actions={actions} />
          <main className="flex-1 overflow-y-auto bg-cream">{children}</main>
        </div>
      </div>

      {/* ── Mobil ─────── */}
      <div
        className="flex flex-col md:hidden min-h-screen"
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <MobileHeader
          title={mobileTitle ?? title}
          showBack={showMobileBack}
          actions={actions}
        />
        <main className="flex-1 bg-cream p-4">{children}</main>
        <BottomNav role={user?.role as 'buyer' | 'chef' | 'admin' | null} />
      </div>
    </>
  )
}
