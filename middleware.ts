/**
 * Next.js Middleware — Auth Guard + Role-Based Access Control
 * Her request'te çalışır. Supabase session'ı yeniler ve role kontrolü yapar.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Route Grupları ────────────────────────────────────────────────────────────

/** Sadece giriş yapmış kullanıcılar */
const AUTHENTICATED_ROUTES = [
  '/siparislerim',
  '/favorilerim',
  '/adreslerim',
  '/profil',
  '/odeme',
]

/** Sadece aşçılar */
const CHEF_ROUTES = [
  '/dashboard',
  '/menu',
  '/siparisler',
  '/kazanc',
  '/asci-ayarlar',
]

/** Sadece adminler */
const ADMIN_ROUTES = ['/admin']

/** Giriş yapmışlar erişemez (giriş/kayıt sayfaları) */
const AUTH_PAGES = ['/giris', '/kayit']

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Supabase session yenile
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── Giriş sayfaları: giriş yapılmışsa dashboard'a yönlendir ──────────────
  if (AUTH_PAGES.some(p => pathname.startsWith(p)) && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Authenticated route'lar: giriş yapılmamışsa login'e ──────────────────
  if (AUTHENTICATED_ROUTES.some(p => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL('/giris', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Chef / Admin route'ları: role için DB sorgusu ────────────────────────
  const needsRoleCheck =
    CHEF_ROUTES.some(p => pathname.startsWith(p)) ||
    ADMIN_ROUTES.some(p => pathname.startsWith(p))

  if (needsRoleCheck) {
    if (!user) {
      const loginUrl = new URL('/giris', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // JWT'de role claim olmayabilir — users tablosundan oku
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (ADMIN_ROUTES.some(p => pathname.startsWith(p)) && role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (CHEF_ROUTES.some(p => pathname.startsWith(p)) && role !== 'chef' && role !== 'admin') {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt
     * - public klasörü
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
