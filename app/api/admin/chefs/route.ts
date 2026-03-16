import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('chef_profiles')
      .select('*, users!inner(id, full_name, phone, avatar_url)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const chefs = (data ?? []).map(cp => ({
      id: cp.id,
      full_name: (cp.users as any).full_name,
      phone: (cp.users as any).phone,
      badge: cp.badge ?? 'new',
      avg_rating: cp.avg_rating,
      total_orders: cp.total_orders,
      is_active: true,
      verification_status: cp.verification_status,
      pending_approval: cp.verification_status === 'pending',
    }))

    return NextResponse.json({ chefs, total: chefs.length })
  } catch {
    // Mock fallback
    return NextResponse.json({ chefs: [
      { id: 'chef-1', full_name: 'Fatma Hanım',   phone: '+90 555 444 55 66', badge: 'master',  avg_rating: 4.9, total_orders: 843,  verification_status: 'approved', pending_approval: false },
      { id: 'chef-2', full_name: 'Zeynep Arslan', phone: '+90 555 123 45 67', badge: 'chef',    avg_rating: 5.0, total_orders: 1241, verification_status: 'approved', pending_approval: false },
      { id: 'chef-3', full_name: 'Elif Demirci',  phone: '+90 532 111 22 33', badge: 'new',     avg_rating: null, total_orders: 0,  verification_status: 'pending',  pending_approval: true  },
    ], total: 3 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { chef_id, verification_status, badge } = await req.json()

    const updates: any = {}
    if (verification_status) updates.verification_status = verification_status
    if (badge) updates.badge = badge

    const { error } = await supabaseAdmin
      .from('chef_profiles')
      .update(updates)
      .eq('id', chef_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}