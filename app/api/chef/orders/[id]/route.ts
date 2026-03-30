// v2 - delivered_pending gecisi aktif
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
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Oturum acik degil.' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Gecersiz istek.' }, { status: 400 })
  }

  const { status } = body
  if (!status) {
    return NextResponse.json({ error: 'Status gerekli.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, chef_id')
    .eq('id', params.id)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })
  }

  const allowed = VALID_TRANSITIONS[order.status] ?? []

  if (!allowed.includes(status)) {
    return NextResponse.json(
      {
        error: `${order.status} -> ${status} gecisi yapilamaz.`,
        current_status: order.status,
        allowed,
      },
      { status: 400 }
    )
  }

  const updateData: Record<string, any> = { status }

  if (status === 'delivered_pending') {
    updateData.delivered_at = new Date().toISOString()
  }

  if (status === 'delivered') {
    updateData.delivered_at = updateData.delivered_at ?? new Date().toISOString()
  }

  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', params.id)

  if (updateErr) {
    console.error('Order update error:', updateErr)
    return NextResponse.json({ error: 'Guncelleme basarisiz.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status, order_id: params.id })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}