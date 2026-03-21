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
    const page      = Math.max(1, Number(searchParams.get('page')  ?? 1))
    const limit     = Math.min(50, Number(searchParams.get('limit') ?? 25))
    const status    = searchParams.get('status')    ?? ''
    const q         = searchParams.get('q')         ?? ''
    const date_from = searchParams.get('date_from') ?? ''
    const date_to   = searchParams.get('date_to')   ?? ''
    const offset    = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select(`
        id, order_number, status, payment_status,
        total_amount, delivery_fee, delivery_type, created_at,
        buyer_id, chef_id,
        order_items (
          quantity, item_name, item_price
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status)    query = query.eq('status', status)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to)   query = query.lte('created_at', date_to + 'T23:59:59')

    const { data: orders, count, error } = await query
    if (error) throw error

    // Buyer + chef isimlerini çek
    const buyerIds = [...new Set((orders ?? []).map((o: any) => o.buyer_id).filter(Boolean))]
    const chefIds  = [...new Set((orders ?? []).map((o: any) => o.chef_id).filter(Boolean))]

    const [{ data: buyers }, { data: chefProfiles }] = await Promise.all([
      buyerIds.length > 0
        ? supabase.from('users').select('id, full_name, phone').in('id', buyerIds)
        : Promise.resolve({ data: [] }),
      chefIds.length > 0
        ? supabase.from('chef_profiles').select('id, user_id').in('id', chefIds)
        : Promise.resolve({ data: [] }),
    ])

    const chefUserIds = (chefProfiles ?? []).map((c: any) => c.user_id).filter(Boolean)
    const { data: chefUsers } = chefUserIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', chefUserIds)
      : { data: [] }

    const buyerMap     = Object.fromEntries((buyers       ?? []).map((u: any) => [u.id, u]))
    const chefMap      = Object.fromEntries((chefProfiles ?? []).map((c: any) => [c.id, c]))
    const chefUserMap  = Object.fromEntries((chefUsers    ?? []).map((u: any) => [u.id, u]))

    const enriched = (orders ?? []).map((o: any) => {
      const chef    = chefMap[o.chef_id]
      const chefUser = chef ? chefUserMap[chef.user_id] : null
      return {
        ...o,
        buyer:      buyerMap[o.buyer_id] ?? { full_name: 'Bilinmiyor', phone: '' },
        chef_name:  chefUser?.full_name ?? 'Bilinmiyor',
      }
    })

    // q filtresi (alıcı adı)
    const filtered = q
      ? enriched.filter((o: any) =>
          o.buyer?.full_name?.toLowerCase().includes(q.toLowerCase()) ||
          o.order_number?.includes(q)
        )
      : enriched

    return NextResponse.json({ orders: filtered, total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) })
  } catch (err: any) {
    console.error('[admin/orders]', err.message)
    return NextResponse.json({ orders: [], total: 0 }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { order_id, action } = await req.json()

    if (action === 'cancel') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order_id)
    } else if (action === 'refund') {
      await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', order_id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}