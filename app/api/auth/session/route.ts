// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const access_token = searchParams.get('access_token')
  const refresh_token = searchParams.get('refresh_token')
  const redirectTo = searchParams.get('redirectTo') || '/'

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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.setSession({ access_token, refresh_token })

  return response
}