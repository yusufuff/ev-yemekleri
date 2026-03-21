import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTHENTICATED_ROUTES = ['/siparislerim','/favorilerim','/adreslerim','/profil','/odeme']
const CHEF_ROUTES = ['/dashboard','/menu','/siparisler','/kazanc','/asci-ayarlar']
const ADMIN_ROUTES = ['/admin']
const AUTH_PAGES = ['/giris', '/kayit']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isAuthFlowPage =
    pathname === '/giris/profil' ||
    pathname.startsWith('/giris/otp') ||
    pathname.startsWith('/giris/onboarding')

  if (!isAuthFlowPage && AUTH_PAGES.some(p => pathname.startsWith(p)) && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (AUTHENTICATED_ROUTES.some(p => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL('/giris', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const needsRoleCheck =
    CHEF_ROUTES.some(p => pathname.startsWith(p)) ||
    ADMIN_ROUTES.some(p => pathname.startsWith(p))

  if (needsRoleCheck) {
    if (!user) {
      const loginUrl = new URL('/giris', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|icons|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}