// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  if (token_hash && type) {
    const response = NextResponse.redirect(new URL('/', request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                path: '/',
              })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (error || !data.session) {
      console.error('[auth/callback] verifyOtp error:', error)
      return NextResponse.redirect(new URL('/giris?error=auth_failed', request.url))
    }

    const user = data.session.user
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()

    if (!profile?.full_name || profile.full_name.trim() === '') {
      return NextResponse.redirect(new URL('/giris/profil', request.url))
    }

    if (profile.role === 'chef') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  }

  if (code) {
    const response = NextResponse.redirect(new URL('/', request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                path: '/',
              })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      console.error('[auth/callback] exchangeCode error:', error)
      return NextResponse.redirect(new URL('/giris?error=auth_failed', request.url))
    }

    const user = data.session.user
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()

    if (!profile?.full_name || profile.full_name.trim() === '') {
      return NextResponse.redirect(new URL('/giris/profil', request.url))
    }

    if (profile.role === 'chef') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  }

  return NextResponse.redirect(new URL('/giris', request.url))
}