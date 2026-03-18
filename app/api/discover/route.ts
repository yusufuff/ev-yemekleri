// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select(`
        id,
        user_id,
        bio,
        location_approx,
        delivery_radius_km,
        delivery_types,
        min_order_amount,
        is_open,
        avg_rating,
        total_reviews,
        total_orders,
        badge,
        verification_status,
        users!inner(id, full_name, avatar_url)
      `)
      .eq('verification_status', 'approved')
      .eq('is_open', true)
      .order('avg_rating', { ascending: false })

    if (error) throw error

    const chefs = await Promise.all((data ?? []).map(async (chef: any) => {
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, price, category, remaining_stock')
        .eq('chef_id', chef.id)
        .eq('is_active', true)
        .limit(3)

      return {
        chef_id: chef.id,
        user_id: chef.user_id,
        full_name: chef.users?.full_name ?? 'Asci',
        avatar_url: chef.users?.avatar_url ?? null,
        bio: chef.bio,
        location_approx: chef.location_approx,
        delivery_types: chef.delivery_types,
        min_order_amount: chef.min_order_amount,
        is_open: chef.is_open,
        avg_rating: chef.avg_rating,
        total_reviews: chef.total_reviews,
        total_orders: chef.total_orders,
        badge: chef.badge,
        distance_km: 2.5,
        preview_items: (items ?? []).map(i => ({
          ...i,
          stock_status: !i.remaining_stock ? 'out_of_stock'
            : i.remaining_stock <= 2 ? 'critical'
            : i.remaining_stock <= 5 ? 'low' : 'ok',
          photos: [],
        })),
      }
    }))

    return NextResponse.json({ chefs, total: chefs.length, locationStr: 'Adana, Seyhan' })
  } catch (err: any) {
    console.error('[discover] error:', err.message)
    return NextResponse.json({ chefs: [], total: 0, locationStr: 'Adana, Seyhan' })
  }
}