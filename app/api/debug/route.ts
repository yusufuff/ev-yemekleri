// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  const user = await getCurrentUser()
  const supabase = await getSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  return NextResponse.json({
    cookies: allCookies.map(c => c.name),
    currentUser: user ? { id: user.id, phone: user.phone } : null,
    authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
  })
}