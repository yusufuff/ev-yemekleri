// app/(chef)/dashboard/page.tsx - Server Component
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = cookies()

  // Auth icin anon client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Veri cekme icin admin client (RLS bypass)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: cp } = await admin
    .from('chef_profiles')
    .select('id, is_open, avg_rating, total_orders, profile_views')
    .eq('user_id', user.id)
    .single()

  if (!cp) redirect('/')

  const chefId = cp.id

  const { data: pendingOrders } = await admin
    .from('orders')
    .select('id, order_number, status, subtotal, total_amount, created_at, delivery_type, buyer_id, order_items(id, item_name, quantity)')
    .eq('chef_id', chefId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: activeOrders } = await admin
    .from('orders')
    .select('id, order_number, status, subtotal, total_amount, created_at, delivery_type, buyer_id, order_items(id, item_name, quantity)')
    .eq('chef_id', chefId)
    .in('status', ['confirmed', 'preparing', 'on_way', 'delivered_pending'])
    .order('created_at', { ascending: false })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todayOrders } = await admin
    .from('orders')
    .select('subtotal, total_amount, status')
    .eq('chef_id', chefId)
    .gte('created_at', today.toISOString())
    .neq('status', 'cancelled')

  const todayEarnings = (todayOrders ?? []).reduce((sum: number, o: any) => sum + (parseFloat(o.subtotal ?? o.total_amount ?? 0) * 0.9), 0)

  const allOrders = [...(pendingOrders ?? []), ...(activeOrders ?? [])]
  const buyerIds = Array.from(new Set(allOrders.map((o: any) => o.buyer_id).filter(Boolean)))
  const { data: buyers } = buyerIds.length > 0
    ? await admin.from('users').select('id, full_name').in('id', buyerIds)
    : { data: [] }
  const buyerMap = Object.fromEntries((buyers ?? []).map((b: any) => [b.id, b.full_name]))

  const { data: menuItems } = await admin
    .from('menu_items')
    .select('id, name, remaining_stock, daily_stock')
    .eq('chef_id', chefId)
    .eq('is_active', true)

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { data: weekOrders } = await admin
    .from('orders')
    .select('subtotal, total_amount, created_at, status')
    .eq('chef_id', chefId)
    .gte('created_at', weekAgo.toISOString())
    .neq('status', 'cancelled')

  const weeklyEarnings = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    const dayStr = d.toISOString().split('T')[0]
    const dayOrders = (weekOrders ?? []).filter((o: any) => o.created_at.startsWith(dayStr))
    return dayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.subtotal ?? o.total_amount ?? 0) * 0.9), 0)
  })

  const formatOrder = (o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    created_at: o.created_at,
    buyer_name: buyerMap[o.buyer_id] ?? 'Misafir',
    delivery_type: o.delivery_type,
    total_amount: parseFloat(o.subtotal ?? o.total_amount ?? 0),
    items: (o.order_items ?? []).map((i: any) => ({ name: i.item_name ?? i.name, quantity: i.quantity })),
  })

  const dashboardData = {
    is_open: cp.is_open,
    stats: {
      today_orders: (todayOrders ?? []).length,
      today_earnings: Math.round(todayEarnings),
      pending_count: (pendingOrders ?? []).length,
      avg_rating: cp.avg_rating ?? 0,
      profile_views: cp.profile_views ?? 0,
    },
    pending_orders: (pendingOrders ?? []).map(formatOrder),
    active_orders: (activeOrders ?? []).map(formatOrder),
    stock: (menuItems ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      remaining_stock: m.remaining_stock ?? 0,
      daily_stock: m.daily_stock ?? 10,
    })),
    weekly_earnings: weeklyEarnings,
  }

  return <DashboardClient initialData={dashboardData} />
}