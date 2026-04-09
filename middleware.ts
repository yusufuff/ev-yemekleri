import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/siparislerim',
  '/favorilerim',
  '/adreslerim',
  '/profil',
  '/odeme',
  '/bildirimler',
  '/mesajlar',
  '/dashboard',
  '/kazanc',
]

const CHEF_ONLY_ROUTES = [
  '/dashboard',
  '/kazanc',
]

const ADMIN_ROUTES = [
  '/admin',
]

const AUTH_ROUTES = [
  '/giris',
  '/kayit',
]

// Admin email listesi - buraya platform yöneticilerinin emaillerini ekle
const ADMIN_EMAILS = [
  'admin@anneelim.com',
  'info@anneelim.com',
  'yusufagal06@gmail.com',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isChefOnly  = CHEF_ONLY_ROUTES.some(route => pathname.startsWith(route))
  const isAdminOnly = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Admin route koruması
  if (isAdminOnly) {
    if (!user) {
      const redirectUrl = new URL('/giris', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // Admin email kontrolü
    const isAdmin = ADMIN_EMAILS.includes(user.email ?? '')
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (isProtected && !user) {
    const redirectUrl = new URL('/giris', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    const role = user.user_metadata?.role
    return NextResponse.redirect(new URL(role === 'chef' ? '/dashboard' : '/', request.url))
  }

  if (isChefOnly && user) {
    const role = user.user_metadata?.role
    if (role !== 'chef') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}