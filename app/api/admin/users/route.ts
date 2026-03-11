// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function adminGuard() {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'admin') return null
  return user
}

// â”€â”€ GET "” kullanıcı listesi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp       = req.nextUrl.searchParams
  const page     = parseInt(sp.get('page') ?? '1')
  const limit    = parseInt(sp.get('limit') ?? '20')
  const role     = sp.get('role')        // buyer | chef | admin
  const search   = sp.get('q')?.trim()
  const active   = sp.get('active')      // 'true' | 'false'
  const from     = (page - 1) * limit

  const supabase = await getSupabaseServerClient()
  let query = supabase
    .from('users')
    .select(`
      id, full_name, phone, role, avatar_url,
      is_active, platform_credit, created_at,
      chef_profiles ( verification_status, average_rating, total_orders )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (role)   query = query.eq('role', role)
  if (active) query = query.eq('is_active', active === 'true')
  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data, total: count, page, limit })
}

// â”€â”€ PATCH "” ban / unban / role değiştir â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function PATCH(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: { user_id: string; action: 'ban' | 'unban' | 'set_role'; role?: string } = await req.json()
  const { user_id, action, role } = body
  if (!user_id || !action) return NextResponse.json({ error: 'user_id and action required' }, { status: 400 })

  const supabase = await getSupabaseServerClient()

  if (action === 'ban') {
    const { error } = await (supabase as any).from('users').update({ is_active: false }).eq('id', user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Kullanıcı banlandı' })
  }

  if (action === 'unban') {
    const { error } = await (supabase as any).from('users').update({ is_active: true }).eq('id', user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Ban kaldırıldı' })
  }

  if (action === 'set_role' && role) {
    const { error } = await (supabase as any).from('users').update({ role }).eq('id', user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: `Rol güncellendi: ${role}` })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}



