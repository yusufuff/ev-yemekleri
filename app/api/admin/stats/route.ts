// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const today   = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [
      { count: totalUsers },
      { count: totalChefs },
      { count: totalOrders },
      { count: pendingChefs },
      { count: todayOrders },
      { data: weekOrders },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('chef_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('chef_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('orders').select('total_amount, created_at').gte('created_at', weekAgo),
    ])

    const weekRevenue = (weekOrders ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)

    // Son 7 günün grafik verisi
    const days = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']
    const chart = Array.from({ length: 7 }, (_, i) => {
      const d      = new Date(Date.now() - (6 - i) * 86400000)
      const dayStr = d.toISOString().slice(0, 10)
      const dayOrders = (weekOrders ?? []).filter((o: any) => o.created_at?.startsWith(dayStr))
      return {
        date:    dayStr,
        day:     days[d.getDay()],
        count:   dayOrders.length,
        revenue: dayOrders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0),
      }
    })

    return NextResponse.json({
      total_users:   totalUsers   ?? 0,
      total_chefs:   totalChefs   ?? 0,
      total_orders:  totalOrders  ?? 0,
      pending_chefs: pendingChefs ?? 0,
      today_orders:  todayOrders  ?? 0,
      week_revenue:  Math.round(weekRevenue),
      revenue_growth: null,
      chart,
    })
  } catch (err: any) {
    console.error('[admin/stats]', err.message)
    return NextResponse.json({ total_users:0, total_chefs:0, total_orders:0, pending_chefs:0, today_orders:0, week_revenue:0, chart:[] })
  }
}