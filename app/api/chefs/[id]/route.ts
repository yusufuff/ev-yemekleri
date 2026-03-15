import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MOCK_CHEFS, MOCK_MENU, MOCK_REVIEWS } from '@/lib/mock/data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Aşçı profili
    const { data: cp, error } = await supabase
      .from('chef_profiles')
      .select(`*, users!inner(id, full_name, avatar_url, created_at)`)
      .eq('id', params.id)
      .single()

    if (error || !cp) throw new Error('not found')

    const { data: menu_items } = await supabase
      .from('menu_items')
      .select('*')
      .eq('chef_id', params.id)
      .eq('is_active', true)

    const { data: reviewsRaw } = await supabase
      .from('reviews')
      .select('*, users!buyer_id(full_name, avatar_url)')
      .eq('chef_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('chef_id', params.id)

    const rating_dist: Record<number, number> = { 5:0, 4:0, 3:0, 2:0, 1:0 }
    reviewsRaw?.forEach(r => { rating_dist[r.rating] = (rating_dist[r.rating] ?? 0) + 1 })

    return NextResponse.json({
      profile: { ...cp, users: cp.users },
      menu_items: menu_items ?? [],
      reviews: (reviewsRaw ?? []).map(r => ({ ...r, users: r.users })),
      review_count: count ?? 0,
      review_pages: Math.ceil((count ?? 0) / 5),
      rating_dist,
      favorite_count: 0,
    })
  } catch {
    // Mock fallback
    const chef = MOCK_CHEFS.find(c => c.chef_id === params.id)
    if (!chef) return NextResponse.json({ error: 'Bulunamadi' }, { status: 404 })
    const menu_items = MOCK_MENU[params.id] ?? []
    const reviews = (MOCK_REVIEWS[params.id] ?? []).map((r: any) => ({ ...r, users: { full_name: r.reviewer_name, avatar_url: null } }))
    return NextResponse.json({
      profile: {
        id: chef.chef_id, bio: chef.full_name + ' ev mutfagindan lezzetli yemekler.',
        location_approx: chef.location_approx, avg_rating: chef.avg_rating,
        total_reviews: chef.total_reviews, total_orders: chef.total_orders,
        badge: chef.badge, is_open: chef.is_open, delivery_types: chef.delivery_types,
        distance_km: chef.distance_km, delivery_radius_km: 5,
        working_hours: { mon:{open:'10:00',close:'19:00'}, tue:{open:'10:00',close:'19:00'}, wed:{open:'10:00',close:'19:00'}, thu:{open:'10:00',close:'19:00'}, fri:{open:'10:00',close:'19:00'}, sat:{open:'10:00',close:'17:00'}, sun: null },
        users: { id: chef.user_id, full_name: chef.full_name, avatar_url: chef.avatar_url, created_at: '2024-01-01' },
        rating_breakdown: { 5: Math.floor(chef.total_reviews*0.8), 4: Math.floor(chef.total_reviews*0.15), 3: Math.floor(chef.total_reviews*0.05), 2:0, 1:0 },
      },
      menu_items, reviews, review_count: reviews.length, review_pages: 1, rating_dist: {}, favorite_count: 0,
    })
  }
}