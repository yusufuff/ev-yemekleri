// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const access_token = searchParams.get('access_token')
  const refresh_token = searchParams.get('refresh_token')
  const redirectTo = searchParams.get('redirectTo') || '/'

  console.log('[session] access_token:', access_token ? 'present' : 'missing')
  console.log('[session] redirectTo:', redirectTo)

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(new URL('/giris', request.url))
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          console.log('[session] setting cookies:', cookiesToSet.map(c => c.name))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  console.log('[session] setSession:', data?.session ? 'OK' : 'FAILED', error?.message)

  return response
}