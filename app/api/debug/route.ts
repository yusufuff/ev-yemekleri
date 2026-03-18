// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser, getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  
  // Cookie'den token'i manuel oku
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    .replace('https://', '')
    .replace('.supabase.co', '')
  
  const cookieName = `sb-${projectRef}-auth-token`
  const singleCookie = request.cookies.get(cookieName)?.value
  const chunk0 = request.cookies.get(`${cookieName}.0`)?.value
  const chunk1 = request.cookies.get(`${cookieName}.1`)?.value

  let tokenData = null
  let accessToken = null
  
  try {
    if (singleCookie) {
      tokenData = JSON.parse(decodeURIComponent(singleCookie))
      accessToken = tokenData?.access_token
    } else if (chunk0) {
      const combined = decodeURIComponent(chunk0) + (chunk1 ? decodeURIComponent(chunk1) : '')
      tokenData = JSON.parse(combined)
      accessToken = tokenData?.access_token
    }
  } catch (e) {
    console.error('[debug] token parse error:', e)
  }

  // Token ile direkt getUser dene
  let directUser = null
  if (accessToken) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await adminClient.auth.getUser(accessToken)
    directUser = data?.user ? { id: data.user.id, email: data.user.email } : null
    console.log('[debug] directUser:', directUser?.id ?? 'null', 'error:', error?.message ?? 'none')
  }

  const user = await getCurrentUser()
  const supabase = await getSupabaseServerClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  return NextResponse.json({
    cookies: allCookies.map(c => c.name),
    hasAccessToken: !!accessToken,
    accessTokenPreview: accessToken ? accessToken.slice(0, 30) + '...' : null,
    directUser,
    currentUser: user ? { id: user.id } : null,
    authUser: authUser ? { id: authUser.id } : null,
    authError: authError?.message ?? null,
  })
}