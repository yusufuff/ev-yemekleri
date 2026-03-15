import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (cs) => cs.forEach(({name,value,options}) => response.cookies.set(name,value,options)) } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Demo: mock siparişler döndür
    const MOCK = [
      { id:'ord-1', created_at: new Date(Date.now()-1200000).toISOString(), status:'preparing', delivery_type:'delivery', total_amount:110, chef_name:'Fatma Hanim', chef_id:'chef-1', items:[{name:'Kuru Fasulye & Pilav',quantity:2,price:55}], estimated_minutes:25 },
      { id:'ord-2', created_at: new Date(Date.now()-86400000).toISOString(), status:'delivered', delivery_type:'pickup', total_amount:70, chef_name:'Fatma Hanim', chef_id:'chef-1', items:[{name:'Sutlac',quantity:2,price:35}], estimated_minutes:0 },
    ]
    return NextResponse.json({ orders: MOCK })
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [] })
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (cs) => cs.forEach(({name,value,options}) => response.cookies.set(name,value,options)) } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const body = await request.json()

  const newOrder = {
    id: 'ord-' + Date.now(),
    created_at: new Date().toISOString(),
    status: 'pending',
    ...body,
  }

  if (user) {
    const { data: order } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        chef_id: body.chef_id,
        status: 'pending',
        delivery_type: body.delivery_type ?? 'delivery',
        subtotal: body.total_amount,
        platform_fee: Math.round(body.total_amount * 0.10),
        chef_earning: Math.round(body.total_amount * 0.90),
        delivery_address: body.address ? { full_address: body.address } : null,
        note: body.note,
      })
      .select()
      .single()

    if (order) {
      await supabase.from('order_items').insert(
        (body.items ?? []).map((i: any) => ({
          order_id: order.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        }))
      )
      return NextResponse.json({ order, payment_url: '/siparis-basari?order_id=' + order.id })
    }
  }

  return NextResponse.json({ order: newOrder, payment_url: '/siparis-basari?order_id=' + newOrder.id })
}