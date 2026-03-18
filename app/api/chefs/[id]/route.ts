// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: cp, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !cp) {
      return NextResponse.json({ error: 'Aşçı bulunamadı.' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, created_at')
      .eq('id', cp.user_id)
      .single()

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

    const usersData = userData ?? {
      id: cp.user_id,
      full_name: 'Aşçı',
      avatar_url: null,
      created_at: cp.created_at,
    }

    return NextResponse.json({
      profile: { ...cp, users: usersData },
      menu_items: menu_items ?? [],
      reviews: (reviewsRaw ?? []).map(r => ({ ...r, users: r.users })),
      review_count: count ?? 0,
      review_pages: Math.ceil((count ?? 0) / 5),
      rating_dist,
      favorite_count: 0,
    })
  } catch (err: any) {
    console.error('[chefs] error:', err.message)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}