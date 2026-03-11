// @ts-nocheck
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await getSupabaseServerClient()
  const today   = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const prevWeekAgo = new Date(Date.now() - 14 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { count: totalChefs },
    { count: totalOrders },
    { count: pendingChefs },
    { count: todayOrders },
    { data: weekRevData },
    { data: prevRevData },
    { count: activeOrders },
  ] = await Promise.all([
    (supabase as any).from('users').select('*', { count: 'exact', head: true }),
    (supabase as any).from('chef_profiles').select('*', { count: 'exact', head: true }),
    (supabase as any).from('orders').select('*', { count: 'exact', head: true }),
    (supabase as any).from('chef_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    (supabase as any).from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
    (supabase as any).from('orders').select('subtotal').eq('payment_status', 'paid').gte('created_at', weekAgo),
    (supabase as any).from('orders').select('subtotal').eq('payment_status', 'paid').gte('created_at', prevWeekAgo).lt('created_at', weekAgo),
    (supabase as any).from('orders').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'preparing', 'on_way']),
  ])

  const weekRevenue = (weekRevData ?? []).reduce((s: number, r: any) => s + (r.subtotal ?? 0), 0)
  const prevRevenue = (prevRevData ?? []).reduce((s: number, r: any) => s + (r.subtotal ?? 0), 0)
  const revenueGrowth = prevRevenue > 0 ? ((weekRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null

  // Son 7 gün günlük sipariş
  const { data: dailyOrders } = await supabase
    .from('orders')
    .select('created_at, subtotal')
    .gte('created_at', weekAgo)
    .eq('payment_status', 'paid')
    .order('created_at')

  // Gün bazlı gruplama
  const dailyMap: Record<string, { count: number; revenue: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    dailyMap[d] = { count: 0, revenue: 0 }
  }
  ;(dailyOrders ?? []).forEach((o: any) => {
    const d = o.created_at.slice(0, 10)
    if (dailyMap[d]) { dailyMap[d].count++; dailyMap[d].revenue += o.subtotal ?? 0 }
  })

  const chartData = Object.entries(dailyMap).map(([date, v]) => ({
    date,
    day: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    ...v,
  }))

  return NextResponse.json({
    stats: {
      total_users:   totalUsers   ?? 0,
      total_chefs:   totalChefs   ?? 0,
      total_orders:  totalOrders  ?? 0,
      pending_chefs: pendingChefs ?? 0,
      today_orders:  todayOrders  ?? 0,
      active_orders: activeOrders ?? 0,
      week_revenue:  weekRevenue,
      revenue_growth: revenueGrowth,
    },
    chart: chartData,
  })
}



