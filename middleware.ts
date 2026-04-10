import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/siparislerim',
  '/favorilerim',
  '/adreslerim',
  '/profil',
  '/bildirimler',
  '/mesajlar',
  '/dashboard',
  '/kazanc',
  '/odeme',
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

  // Odeme callback ve basari sayfasini koru - her zaman izin ver
  if (pathname.startsWith('/siparis-basari') || pathname.startsWith('/odeme/callback') || pathname.startsWith('/api/payments')) {
    return supabaseResponse
  }

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isChefOnly  = CHEF_ONLY_ROUTES.some(route => pathname.startsWith(route))
  const isAdminOnly = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Admin route koruması
  if (isAdminOnly) {
    // /admin/giris sayfasına izin ver
    if (pathname === '/admin/giris') return supabaseResponse

    if (!user) {
      return NextResponse.redirect(new URL('/admin/giris', request.url))
    }

    // Önce admin cookie kontrolü
    const adminToken = request.cookies.get('admin_token')?.value

    // Cookie yoksa is_admin kontrolü yap
    if (!adminToken) {
      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/admin/giris', request.url))
      }
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