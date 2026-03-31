// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function parseLocation(hex) {
  try {
    if (!hex || hex.length < 50) return null
    const buf = Buffer.from(hex, 'hex')
    const x = buf.readDoubleLE(9)
    const y = buf.readDoubleLE(17)
    if (isNaN(x) || isNaN(y)) return null
    return { lat: y, lng: x }
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') ?? 'distance'
    const category = searchParams.get('category') ?? null
    const userLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : null
    const userLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : null

    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('verification_status', 'approved')

    console.log('[discover] data count:', data?.length, 'error:', JSON.stringify(error))

    if (error) {
      return NextResponse.json({ chefs: [], total: 0, error: error.message })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ chefs: [], total: 0, locationStr: 'Adana, Seyhan', debug: 'no data from supabase' })
    }

    const chefs = await Promise.all(data.map(async (chef) => {
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', chef.user_id)
        .single()

      let itemsQuery = supabase
        .from('menu_items')
        .select('id, name, price, category, remaining_stock')
        .eq('chef_id', chef.id)
        .eq('is_active', true)
        .limit(3)

      if (category) itemsQuery = itemsQuery.eq('category', category)
      const { data: items } = await itemsQuery

      let distanceKm = 5
      const chefCoords = parseLocation(chef.location)
      if (userLat && userLng && chefCoords) {
        distanceKm = haversine(userLat, userLng, chefCoords.lat, chefCoords.lng)
      } else if (chefCoords) {
        distanceKm = haversine(36.9914, 35.3308, chefCoords.lat, chefCoords.lng)
      }

      return {
        chef_id: chef.id,
        user_id: chef.user_id,
        full_name: userData?.full_name ?? 'Aşçı',
        avatar_url: userData?.avatar_url ?? null,
        bio: chef.bio,
        location_approx: chef.location_approx,
        lat: chefCoords?.lat ?? null,
        lng: chefCoords?.lng ?? null,
        delivery_types: chef.delivery_types ?? ['delivery'],
        min_order_amount: chef.min_order_amount,
        is_open: chef.is_open,
        avg_rating: chef.avg_rating,
        total_reviews: chef.total_reviews ?? 0,
        total_orders: chef.total_orders ?? 0,
        badge: chef.badge,
        distance_km: Math.round(distanceKm * 10) / 10,
        preview_items: (items ?? []).map(i => ({
          ...i,
          stock_status: !i.remaining_stock ? 'out_of_stock'
            : i.remaining_stock <= 2 ? 'critical'
            : i.remaining_stock <= 5 ? 'low' : 'ok',
        })),
      }
    }))

    if (sort === 'rating') {
      chefs.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    } else if (sort === 'price') {
      chefs.sort((a, b) => (a.preview_items[0]?.price ?? 999) - (b.preview_items[0]?.price ?? 999))
    } else {
      chefs.sort((a, b) => {
        if (a.is_open && !b.is_open) return -1
        if (!a.is_open && b.is_open) return 1
        return a.distance_km - b.distance_km
      })
    }

    const locationStr = userLat ? `${userLat.toFixed(4)}, ${userLng?.toFixed(4)}` : 'Adana, Seyhan'
    return NextResponse.json({ chefs, total: chefs.length, locationStr })

  } catch (err) {
    console.error('[discover] catch error:', err)
    return NextResponse.json({ chefs: [], total: 0, error: String(err) })
  }
}