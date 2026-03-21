// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q         = searchParams.get('q')?.trim() ?? ''
  const category  = searchParams.get('category') ?? ''
  const min_price = Number(searchParams.get('min_price') ?? 0)
  const max_price = Number(searchParams.get('max_price') ?? 9999)
  const page      = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit     = 20
  const offset    = (page - 1) * limit

  try {
    // Önce onaylı aşçıların ID'lerini çek
    const { data: approvedChefs } = await supabase
      .from('chef_profiles')
      .select('id, user_id, bio, delivery_radius_km, avg_rating, total_orders, verification_status')
      .eq('verification_status', 'approved')

    if (!approvedChefs?.length) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const chefIds = approvedChefs.map(c => c.id)

    // Kullanıcı adlarını çek
    const userIds = approvedChefs.map(c => c.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]))
    const chefMap = Object.fromEntries(approvedChefs.map(c => ({
      ...c,
      user: userMap[c.user_id],
    })).map(c => [c.id, c]))

    // Menu items query
    let query = supabase
      .from('menu_items')
      .select('*', { count: 'exact' })
      .in('chef_id', chefIds)
      .eq('is_active', true)
      .gt('remaining_stock', 0)
      .gte('price', min_price)
      .lte('price', max_price)

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: items, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[search]', error)
      return NextResponse.json({ items: [], total: 0 })
    }

    // Her yemeğe aşçı bilgisi ekle
    const enriched = (items ?? []).map(item => ({
      ...item,
      chef: chefMap[item.chef_id] ?? null,
    }))

    return NextResponse.json({
      items: enriched,
      total: count ?? 0,
      page,
      pages: Math.ceil((count ?? 0) / limit),
    })
  } catch (err: any) {
    console.error('[search error]', err.message)
    return NextResponse.json({ items: [], total: 0 })
  }
}