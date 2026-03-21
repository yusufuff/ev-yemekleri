// @ts-nocheck
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import type { User } from '@/types/database'

// ─── Nav Yapısı ───────────────────────────────────────────────────────────────

const NAV_PUBLIC = [
  { href: '/',             icon: '🏠', label: 'Ana Sayfa' },
  { href: '/kesif',        icon: '🗺️', label: 'Keşfet' },
  { href: '/ara',          icon: '🔍', label: 'Yemek Ara' },
  { href: '/blog',         icon: '🍽️', label: 'Blog & Tarifler' },
  { href: '/kurumsal',     icon: '🏢', label: 'Kurumsal' },
  { href: '/indir',        icon: '📱', label: 'Uygulamayı İndir' },
  { href: '/yardim',       icon: '❓', label: 'Yardım / SSS' },
]

const NAV_BUYER = [
  { href: '/siparislerim', icon: '📦', label: 'Siparişlerim',    badge: 1 },
  { href: '/favorilerim',  icon: '❤️', label: 'Favorilerim' },
  { href: '/adreslerim',   icon: '📍', label: 'Adreslerim' },
  { href: '/profil',       icon: '🔔', label: 'Profil & Bildirimler' },
]

const NAV_CHEF = [
  { href: '/dashboard',      icon: '📊', label: 'Dashboard',         badge: 3 },
  { href: '/menu',           icon: '🍳', label: 'Menü Yönetimi' },
  { href: '/siparisler',     icon: '📋', label: 'Siparişler',         badge: 2 },
  { href: '/kazanc',         icon: '💰', label: 'Kazanç & Ödeme' },
  { href: '/asci-ayarlar',   icon: '⚙️', label: 'Profil Ayarları' },
]

const NAV_ADMIN = [
  { href: '/admin',              icon: '👑', label: 'Admin Dashboard' },
  { href: '/admin/ascilar',      icon: '👩‍🍳', label: 'Aşçı Yönetimi' },
  { href: '/admin/siparisler',   icon: '📋', label: 'Siparişler' },
  { href: '/admin/kullanicilar', icon: '👥', label: 'Kullanıcılar' },
  { href: '/admin/finans',       icon: '💰', label: 'Finans Raporu' },
  { href: '/admin/yorumlar',     icon: '⭐', label: 'Yorum Moderasyon' },
  { href: '/admin/blog',         icon: '📝', label: 'Blog Yönetimi' },
  { href: '/admin/sistem',       icon: '🔧', label: 'Sistem Ayarları' },
]

// ─── Bileşen ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  user?: User | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="w-60 bg-brown flex flex-col flex-shrink-0 overflow-y-auto">

      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <Link href="/" className="block">
          <div className="text-white font-serif text-lg font-black tracking-wide leading-tight">
            EV YEMEKLERİ
          </div>
          <div className="text-orange-light text-[10px] tracking-[2px] uppercase mt-0.5">
            Platform
          </div>
        </Link>
      </div>

      {/* Genel */}
      <NavSection label="Keşfet">
        {NAV_PUBLIC.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </NavSection>

      {/* Alıcı — giriş yapılmışsa göster */}
      {user && user.role !== 'chef' && user.role !== 'admin' && (
        <NavSection label="Alıcı Paneli">
          {NAV_BUYER.map(item => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </NavSection>
      )}

      {/* Aşçı */}
      {user && (user.role === 'chef' || user.role === 'admin') && (
        <NavSection label="Aşçı Paneli">
          {NAV_CHEF.map(item => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </NavSection>
      )}

      {/* Admin */}
      {user?.role === 'admin' && (
        <NavSection label="Admin">
          {NAV_ADMIN.map(item => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </NavSection>
      )}

      {/* Giriş yap (misafir) */}
      {!user && (
        <div className="p-3 mt-auto border-t border-white/10">
          <Link
            href="/giris"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                       bg-orange text-white text-sm font-semibold hover:bg-orange/90 transition"
          >
            🔑 Giriş Yap
          </Link>
        </div>
      )}

    </aside>
  )
}

// ─── Alt Bileşenler ───────────────────────────────────────────────────────────

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-4">
      <div className="text-[9px] tracking-[2px] uppercase text-white/35 px-3 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  )
}

interface NavItemProps {
  href:   string
  icon:   string
  label:  string
  badge?: number
  active: boolean
}

function NavItem({ href, icon, label, badge, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'nav-item',
        active && 'active'
      )}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={clsx(
          'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
          active ? 'bg-white/30 text-white' : 'bg-orange text-white'
        )}>
          {badge}
        </span>
      )}
    </Link>
  )
}
