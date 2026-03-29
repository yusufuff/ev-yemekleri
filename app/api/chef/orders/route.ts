import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:           ['confirmed', 'cancelled'],
  confirmed:         ['preparing', 'cancelled'],
  preparing:         ['on_way', 'cancelled'],
  on_way:            ['delivered_pending', 'delivered'],
  delivered_pending: ['delivered'],
  delivered:         [],
  cancelled:         [],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const body = await req.json()
  const { status } = body

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status, chef_id')
    .eq('id', params.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `${order.status} → ${status} geçişi yapılamaz.` }, { status: 400 })
  }

  const updateData: any = { status, updated_at: new Date().toISOString() }
  if (status === 'delivered_pending') {
    updateData.delivered_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, status })
}