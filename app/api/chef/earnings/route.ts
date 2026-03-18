// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  // Chef profile ID al
  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) {
    return NextResponse.json({ error: 'Asci profili bulunamadi.' }, { status: 404 })
  }

  const chefId = chefProfile.id
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Bu haftaki kazanc
  const { data: thisWeekOrders } = await supabase
    .from('orders')
    .select('chef_earning, created_at')
    .eq('chef_id', chefId)
    .eq('status', 'delivered')
    .gte('created_at', startOfWeek.toISOString())

  // Gecen haftaki kazanc
  const { data: lastWeekOrders } = await supabase
    .from('orders')
    .select('chef_earning')
    .eq('chef_id', chefId)
    .eq('status', 'delivered')
    .gte('created_at', startOfLastWeek.toISOString())
    .lt('created_at', startOfWeek.toISOString())

  // Bu ayki kazanc
  const { data: thisMonthOrders } = await supabase
    .from('orders')
    .select('chef_earning')
    .eq('chef_id', chefId)
    .eq('status', 'delivered')
    .gte('created_at', startOfMonth.toISOString())

  // Gecen ayki kazanc
  const { data: lastMonthOrders } = await supabase
    .from('orders')
    .select('chef_earning')
    .eq('chef_id', chefId)
    .eq('status', 'delivered')
    .gte('created_at', startOfLastMonth.toISOString())
    .lte('created_at', endOfLastMonth.toISOString())

  // Bekleyen bakiye (delivered ama henuz odenmemis)
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('chef_earning')
    .eq('chef_id', chefId)
    .eq('status', 'delivered')
    .eq('payment_status', 'paid')

  // Gunluk kazanc (son 7 gun)
  const dailyEarnings: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('tr-TR', { weekday: 'short' })
    dailyEarnings[key] = 0
  }

  thisWeekOrders?.forEach((order: any) => {
    const d = new Date(order.created_at)
    const key = d.toLocaleDateString('tr-TR', { weekday: 'short' })
    if (dailyEarnings[key] !== undefined) {
      dailyEarnings[key] += Number(order.chef_earning ?? 0)
    }
  })

  const sum = (orders: any[]) =>
    (orders ?? []).reduce((acc, o) => acc + Number(o.chef_earning ?? 0), 0)

  const thisWeek = sum(thisWeekOrders ?? [])
  const lastWeek = sum(lastWeekOrders ?? [])
  const thisMonth = sum(thisMonthOrders ?? [])
  const lastMonth = sum(lastMonthOrders ?? [])
  const pendingBalance = sum(pendingOrders ?? [])

  const weekChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0
  const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0

  return NextResponse.json({
    this_week: thisWeek,
    last_week: lastWeek,
    this_month: thisMonth,
    last_month: lastMonth,
    pending_balance: pendingBalance,
    week_change: weekChange,
    month_change: monthChange,
    daily_earnings: dailyEarnings,
  })
}