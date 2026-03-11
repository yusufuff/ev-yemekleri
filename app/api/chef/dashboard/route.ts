/**
 * GET /api/chef/dashboard
 * AÅŸÃ§Ä± dashboard'u iÃ§in tek seferde tÃ¼m veriyi dÃ¶ndÃ¼rÃ¼r.
 * Server Component ve client-side refresh her ikisi de bu endpoint'i kullanÄ±r.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { DashboardData } from '@/types/dashboard'

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient()

  // 1. Oturum kontrolÃ¼
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Chef profile bul
  const { data: chefProfile, error: profileErr } = await supabase
    .from('chef_profiles')
    .select('id, is_open, avg_rating, total_reviews, total_orders, badge')
    .eq('user_id', user.id)
    .single()

  if (profileErr || !chefProfile) {
    return NextResponse.json({ error: 'Chef profile not found' }, { status: 404 })
  }

  const chefId = chefProfile.id

  // 3. Parallel veri Ã§ekme
  const [
    statsResult,
    pendingResult,
    activeResult,
    recentResult,
    earningsResult,
    stockResult,
    userResult,
  ] = await Promise.all([

    // Dashboard istatistikleri (view'dan)
    supabase
      .from('chef_dashboard_stats')
      .select('*')
      .eq('chef_id', chefId)
      .single(),

    // Bekleyen sipariÅŸler
    supabase
      .from('order_summary')
      .select('*')
      .eq('chef_id', chefId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10),

    // Aktif sipariÅŸler (hazÄ±rlanÄ±yor, yolda vb.)
    supabase
      .from('order_summary')
      .select('*')
      .eq('chef_id', chefId)
      .in('status', ['confirmed', 'preparing', 'ready', 'on_way'])
      .order('created_at', { ascending: true }),

    // Son tamamlanan sipariÅŸler
    supabase
      .from('order_summary')
      .select('*')
      .eq('chef_id', chefId)
      .in('status', ['delivered', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(8),

    // Son 7 gÃ¼nlÃ¼k kazanÃ§ (grafik)
    supabase
      .from('chef_earnings_by_day')
      .select('day, order_count, earning')
      .eq('chef_id', chefId)
      .gte('day', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('day', { ascending: true }),

    // Stok durumu
    supabase
      .from('menu_items')
      .select('id, name, category, price, daily_stock, remaining_stock, is_active')
      .eq('chef_id', chefId)
      .order('is_active', { ascending: false })
      .order('name'),

    // KullanÄ±cÄ± adÄ±
    supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single(),
  ])

  // 4. Hata kontrolÃ¼ (kritik olanlar)
  if (statsResult.error) {
    console.error('Dashboard stats error:', statsResult.error)
    // Stats view'dan veri gelmezse chef_profile'dan fallback
  }

  // 5. KazanÃ§ gÃ¼nlerini tam 7 gÃ¼ne tamamla (boÅŸ gÃ¼nler 0 gÃ¶sterir)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const earningsMap = new Map(
    (earningsResult.data ?? []).map(r => [r.day, r])
  )

  const earningsByDay = last7Days.map(day => ({
    day,
    order_count: earningsMap.get(day)?.order_count ?? 0,
    earning:     earningsMap.get(day)?.earning ?? 0,
  }))

  // 6. Stats fallback
  const stats = statsResult.data ?? {
    chef_id:            chefId,
    user_id:            user.id,
    is_open:            chefProfile.is_open,
    avg_rating:         chefProfile.avg_rating,
    total_reviews:      chefProfile.total_reviews,
    total_orders:       chefProfile.total_orders,
    badge:              chefProfile.badge,
    today_order_count:  0,
    today_earning:      0,
    pending_count:      pendingResult.data?.length ?? 0,
    active_count:       activeResult.data?.length ?? 0,
    week_earning:       earningsByDay.reduce((s, d) => s + d.earning, 0),
    month_earning:      0,
    pending_balance:    0,
    unanswered_reviews: 0,
  }

  const response: DashboardData = {
    stats,
    pendingOrders:  pendingResult.data  ?? [],
    activeOrders:   activeResult.data   ?? [],
    recentOrders:   recentResult.data   ?? [],
    earningsByDay,
    stockItems:     stockResult.data    ?? [],
    chefName:       userResult.data?.full_name ?? 'AÅŸÃ§Ä±',
  }

  return NextResponse.json(response, {
    headers: {
      // 30 saniyelik cache (CDN'de deÄŸil, browser'da)
      'Cache-Control': 'private, max-age=30',
    },
  })
}

