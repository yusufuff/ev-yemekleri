// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient, getCurrentUser, getAuthUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getAuthUser() as any

  if (!user) {
    return NextResponse.json({ orders: [] })
  }

  const supabase = await getSupabaseServerClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, delivery_type, total_amount, subtotal, created_at, delivery_address, estimated_minutes, chef_id, order_items(id, item_name, quantity, item_price, menu_item_id)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const chefIds = [...new Set((orders ?? []).map((o: any) => o.chef_id).filter(Boolean))]
  let chefMap: Record<string, string> = {}
  if (chefIds.length > 0) {
    const { data: chefData } = await supabase
      .from('chef_public_profiles')
      .select('chef_id, full_name')
      .in('chef_id', chefIds)
    ;(chefData ?? []).forEach((c: any) => { chefMap[c.chef_id] = c.full_name })
  }

  const formatli = (orders ?? []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    delivery_type: o.delivery_type,
    total_amount: parseFloat(o.total_amount ?? o.subtotal ?? 0),
    created_at: o.created_at,
    estimated_minutes: o.estimated_minutes ?? 0,
    chef_id: o.chef_id,
    chef_name: chefMap[o.chef_id] ?? 'Asci',
    delivery_address: typeof o.delivery_address === 'object'
      ? (o.delivery_address?.full_address ?? '')
      : (o.delivery_address ?? ''),
    items: (o.order_items ?? []).map((i: any) => ({
      id: i.id,
      name: i.item_name ?? i.name,
      quantity: i.quantity,
      price: parseFloat(i.item_price ?? 0),
      menu_item_id: i.menu_item_id,
    })),
  }))

  return NextResponse.json({ orders: formatli })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser() as any
  const body = await request.json()

  if (!user) {
    const newOrder = {
      id: 'ord-' + Date.now(),
      created_at: new Date().toISOString(),
      status: 'pending',
      ...body,
    }
    return NextResponse.json({ order: newOrder, payment_url: '/siparis-basari?order_id=' + newOrder.id })
  }

  const supabase = await getSupabaseServerClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      chef_id: body.chef_id,
      status: 'pending',
      delivery_type: body.delivery_type ?? 'delivery',
      subtotal: body.total_amount + (body.discount_amount || 0),
      delivery_fee: 0,
      discount_amount: body.discount_amount || 0,
      total_amount: body.total_amount,
      platform_fee: Math.round(body.total_amount * 0.10),
      chef_earning: Math.round(body.total_amount * 0.90),
      coupon_code: body.coupon_code,
      delivery_address: body.address ? { full_address: body.address } : null,
      notes: body.note,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    (body.items ?? []).map((i: any) => ({
      order_id:     order.id,
      menu_item_id: i.menu_item_id ?? null,
      item_name:    i.name,
      item_price:   i.price,
      quantity:     i.quantity,
    }))
  )

  if (itemsError) {
    console.error('[orders POST] order_items insert error:', itemsError)
  }

  // Aşçıya direkt Supabase ile bildirim yaz
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: chefProfile } = await supabaseAdmin
      .from('chef_profiles')
      .select('user_id')
      .eq('id', body.chef_id)
      .single()

    if (chefProfile?.user_id) {
      const itemCount = body.items?.length ?? 1
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: chefProfile.user_id,
          type:    'new_order',
          title:   'Yeni Siparis Geldi!',
          body:    `${itemCount} urun - ${body.total_amount} TL`,
          data:    { order_id: order.id, order_number: order.order_number ?? '' },
          is_read: false,
        })

      if (notifError) {
        console.error('[orders] bildirim hatasi:', notifError.message)
      } else {
        console.log('[orders] asci bildirimi gonderildi:', chefProfile.user_id)
      }
    }
  } catch (err: any) {
    console.error('[orders] bildirim try-catch hatasi:', err.message)
  }

  return NextResponse.json({ order, payment_url: '/siparis-basari?order_id=' + order.id })
}