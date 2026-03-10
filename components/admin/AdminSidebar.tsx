'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV = [
  { href: '/admin',             icon: '📊', label: 'Dashboard'        },
  { href: '/admin/kullanicilar', icon: '👥', label: 'Kullanıcılar',  badge: null },
  { href: '/admin/asciler',      icon: '👩‍🍳', label: 'Aşçılar'        },
  { href: '/admin/siparisler',   icon: '📋', label: 'Siparişler'      },
  { href: '/admin/odemeler',     icon: '💰', label: 'Ödemeler'        },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-[#14110D] border-r border-white/[0.07] flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.07]">
        <div className="font-serif text-[15px] font-black text-[#E8622A] tracking-wide">EV YEMEKLERİ</div>
        <div className="text-[10px] text-white/30 mt-0.5 tracking-[2px] uppercase">Admin Panel</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-[#E8622A]/15 text-[#E8622A] border border-[#E8622A]/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.07]">
        <Link href="/" className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
          ← Platforma Dön
        </Link>
      </div>
    </aside>
  )
}
