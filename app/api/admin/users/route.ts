// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1))
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 20))
    const role  = searchParams.get('role') ?? ''
    const q     = searchParams.get('q')    ?? ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('id, full_name, phone, role, platform_credit, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role) query = query.eq('role', role)
    if (q)    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)

    const { data: users, count, error } = await query
    if (error) throw error

    return NextResponse.json({ users: users ?? [], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) })
  } catch (err: any) {
    return NextResponse.json({ users: [], total: 0 }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user_id, action } = await req.json()
    if (!user_id || !action) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })

    if (action === 'ban') {
      await supabase.from('users').update({ is_active: false }).eq('id', user_id)
    } else if (action === 'unban') {
      await supabase.from('users').update({ is_active: true }).eq('id', user_id)
    } else if (action === 'make_admin') {
      await supabase.from('users').update({ role: 'admin' }).eq('id', user_id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}