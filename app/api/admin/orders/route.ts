import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp     = req.nextUrl.searchParams
  const page   = parseInt(sp.get('page')  ?? '1')
  const limit  = parseInt(sp.get('limit') ?? '25')
  const status = sp.get('status')       // pending | confirmed | ... | delivered
  const search = sp.get('q')?.trim()    // sipariÅŸ no veya kullanÄ±cÄ± adÄ±
  const dateFrom = sp.get('date_from')
  const dateTo   = sp.get('date_to')
  const from   = (page - 1) * limit

  const supabase = await getSupabaseServerClient()
  let query = supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status,
      subtotal, delivery_fee, platform_fee,
      delivery_type, created_at,
      buyer:users!buyer_id ( id, full_name, phone ),
      chef:chef_profiles!chef_id ( id,
        user:users ( full_name )
      ),
      order_items ( quantity, unit_price,
        menu_item:menu_items ( name )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (status)   query = query.eq('status', status)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo)
  if (search)   query = query.ilike('order_number', `%${search}%`)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data, total: count, page, limit })
}

// â”€â”€ PATCH â€” admin sipariÅŸ iptal / iade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { order_id, action, reason }: {
    order_id: string; action: 'cancel' | 'refund'; reason?: string
  } = await req.json()

  if (!order_id || !action) return NextResponse.json({ error: 'order_id and action required' }, { status: 400 })

  const supabase = await getSupabaseServerClient()

  if (action === 'cancel') {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', order_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log
    await (supabase as any).from('audit_logs').insert({
      actor_id:   user.id,
      action:     'admin_cancel_order',
      target_id:  order_id,
      target_type:'order',
      metadata:   { reason },
    }).then(() => {})

    return NextResponse.json({ ok: true, message: 'SipariÅŸ iptal edildi' })
  }

  if (action === 'refund') {
    // Ä°yzico iade isteÄŸi burada tetiklenir
    // Åimdilik sadece payment_status gÃ¼ncelle
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', order_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await (supabase as any).from('audit_logs').insert({
      actor_id:   user.id,
      action:     'admin_refund_order',
      target_id:  order_id,
      target_type:'order',
      metadata:   { reason },
    }).then(() => {})

    return NextResponse.json({ ok: true, message: 'Ä°ade iÅŸlemi baÅŸlatÄ±ldÄ±' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}


