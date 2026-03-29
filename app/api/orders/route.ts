// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser() as any

  if (!user) {
    const MOCK = [
      { id:'ord-1', created_at: new Date(Date.now()-1200000).toISOString(), status:'preparing', delivery_type:'delivery', total_amount:110, chef_name:'Fatma Hanim', chef_id:'chef-1', items:[{name:'Kuru Fasulye & Pilav',quantity:2,price:55}], estimated_minutes:25 },
      { id:'ord-2', created_at: new Date(Date.now()-86400000).toISOString(), status:'delivered', delivery_type:'pickup', total_amount:70, chef_name:'Fatma Hanim', chef_id:'chef-1', items:[{name:'Sutlac',quantity:2,price:35}], estimated_minutes:0 },
    ]
    return NextResponse.json({ orders: MOCK })
  }

  const supabase = await getSupabaseServerClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, delivery_type, total_amount, subtotal, created_at, delivery_address, estimated_minutes, chef_id, order_items(id, item_name, quantity, item_price, menu_item_id)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  // Chef isimlerini ayrı çek
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

  console.log('[orders POST] user:', user?.id ?? 'null')

  if (!user) {
    console.log('[orders POST] kullanici bulunamadi, mock donuyor')
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
    console.error('[orders POST] order insert error:', orderError)
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

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: chefUser } = await supabaseAdmin
      .from('chef_profiles')
      .select('user_id')
      .eq('id', body.chef_id)
      .single()
    if (chefUser) {
      const { data: chefProfile } = await supabaseAdmin
        .from('users')
        .select('fcm_token')
        .eq('id', chefUser.user_id)
        .single()
      if (chefProfile?.fcm_token) {
        fetch(new URL('/api/notifications', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: chefProfile.fcm_token,
            title: 'Yeni Siparis!',
            body: `${body.items?.length ?? 1} urun · ₺${body.total_amount}`,
            data: { order_id: order.id, type: 'new_order' },
          }),
        }).catch(() => {})
      }
    }
  } catch {}

  return NextResponse.json({ order, payment_url: '/siparis-basari?order_id=' + order.id })
}