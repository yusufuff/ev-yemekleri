// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return getMockDashboard()

  try {
    const { data: cp } = await supabase
      .from('chef_profiles')
      .select('id, is_open, avg_rating, total_orders, profile_views')
      .eq('user_id', user.id)
      .single()

    if (!cp) return getMockDashboard()

    const chefId = cp.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Bugünkü siparişler
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, subtotal, total_amount, created_at, delivery_type, buyer_id, order_items(id, item_name, quantity)')
      .eq('chef_id', chefId)
      .gte('created_at', today.toISOString())

    // Aktif siparişler (bugün + önceki günler dahil)
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, subtotal, total_amount, created_at, delivery_type, buyer_id, order_items(id, item_name, quantity)')
      .eq('chef_id', chefId)
      .in('status', ['confirmed', 'preparing', 'on_way', 'delivered_pending'])
      .order('created_at', { ascending: false })

    const todayEarnings = (todayOrders ?? [])
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.subtotal ?? o.total_amount ?? 0) * 0.9), 0)

    const { data: pendingOrdersData } = await supabase
  .from('orders')
  .select('id, order_number, status, subtotal, total_amount, created_at, delivery_type, buyer_id, order_items(id, item_name, quantity)')
  .eq('chef_id', chefId)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })

const pendingOrders = pendingOrdersData ?? []

    // Tüm buyer ID'lerini topla
    const allOrders = [...(todayOrders ?? []), ...(activeOrders ?? [])]
    const buyerIds = Array.from(new Set(allOrders.map(o => o.buyer_id).filter(Boolean)))
    const { data: buyers } = buyerIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', buyerIds)
      : { data: [] }

    const buyerMap = Object.fromEntries((buyers ?? []).map(b => [b.id, b.full_name]))

    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, remaining_stock, daily_stock, is_active')
      .eq('chef_id', chefId)
      .eq('is_active', true)

    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('chef_id', chefId)

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('subtotal, total_amount, created_at, status')
      .eq('chef_id', chefId)
      .gte('created_at', weekAgo.toISOString())
      .neq('status', 'cancelled')

    const weekEarnings = (weekOrders ?? []).reduce((sum, o) => sum + (parseFloat(o.subtotal ?? o.total_amount ?? 0) * 0.9), 0)

    const chart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
      const dayStr = d.toISOString().split('T')[0]
      const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
      const dayOrders = (weekOrders ?? []).filter(o => o.created_at.startsWith(dayStr))
      return {
        day: days[d.getDay()],
        earnings: dayOrders.reduce((sum, o) => sum + (parseFloat(o.subtotal ?? o.total_amount ?? 0) * 0.9), 0),
        count: dayOrders.length,
      }
    })

    const formatOrder = (o: any) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      created_at: o.created_at,
      buyer_name: buyerMap[o.buyer_id] ?? 'Misafir',
      delivery_type: o.delivery_type,
      total_amount: parseFloat(o.subtotal ?? o.total_amount ?? 0),
      items: (o.order_items ?? []).map((i: any) => ({
        name: i.item_name ?? i.name,
        quantity: i.quantity,
      })),
    })

    return NextResponse.json({
      is_open: cp.is_open,
      stats: {
        today_orders: (todayOrders ?? []).length,
        today_earnings: Math.round(todayEarnings),
        pending_count: pendingOrders.length,
        avg_rating: cp.avg_rating ?? 0,
        total_reviews: reviewCount ?? 0,
        week_earnings: Math.round(weekEarnings),
        profile_views: cp.profile_views ?? 0,
      },
      pending_orders: pendingOrders.map(formatOrder),
      active_orders: (activeOrders ?? []).map(formatOrder),
      stock: (menuItems ?? []).map(m => ({
        id: m.id,
        name: m.name,
        remaining_stock: m.remaining_stock ?? 0,
        daily_stock: m.daily_stock ?? 10,
      })),
      weekly_earnings: chart.map(c => c.earnings),
    })
  } catch (err: any) {
    console.error('[chef/dashboard]', err)
    return getMockDashboard()
  }
}

export async function PATCH(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: cp } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) return NextResponse.json({ error: 'Chef not found' }, { status: 404 })

  await supabase
    .from('chef_profiles')
    .update({ is_open: body.is_open })
    .eq('id', cp.id)

  return NextResponse.json({ success: true })
}

function getMockDashboard() {
  return NextResponse.json({
    is_open: true,
    stats: { today_orders: 0, today_earnings: 0, pending_count: 0, avg_rating: 0, total_reviews: 0, week_earnings: 0, profile_views: 0 },
    pending_orders: [],
    active_orders: [],
    stock: [],
    weekly_earnings: [0, 0, 0, 0, 0, 0, 0],
  })
}