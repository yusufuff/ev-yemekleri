import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser() as any

  if (!user) {
    const MOCK = [
      { id:'ord-1', created_at: new Date(Date.now()-1200000).toISOString(), status:'preparing', delivery_type:'delivery', total_amount:110, chef_name:'Fatma Hanim', chef_id:'chef-1', items:[{item_name:'Kuru Fasulye & Pilav',quantity:2,item_price:55}], estimated_minutes:25 },
      { id:'ord-2', created_at: new Date(Date.now()-86400000).toISOString(), status:'delivered', delivery_type:'pickup', total_amount:70, chef_name:'Fatma Hanim', chef_id:'chef-1', items:[{item_name:'Sutlac',quantity:2,item_price:35}], estimated_minutes:0 },
    ]
    return NextResponse.json({ orders: MOCK })
  }

  const supabase = await getSupabaseServerClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [] })
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
      subtotal: body.total_amount,
      total_amount: body.total_amount,
      platform_fee: Math.round(body.total_amount * 0.10),
      chef_earning: Math.round(body.total_amount * 0.90),
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

  // Asciya bildirim gonder (fire and forget)
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
            title: 'Yeni Siparis! 🛒',
            body: `${body.items?.length ?? 1} urun · ₺${body.total_amount}`,
            data: { order_id: order.id, type: 'new_order' },
          }),
        }).catch(() => {})
      }
    }
  } catch {}

  return NextResponse.json({ order, payment_url: '/siparis-basari?order_id=' + order.id })
}