// @ts-nocheck
/**
 * GET /api/discover?lat=37.00&lng=35.32&radius=5&sort=distance&category=main&delivery=all&open_only=false
 *
 * find_nearby_chefs() PostGIS fonksiyonunu çağırır.
 * Her aşçı için 3 menü önizlemesi ekler.
 * Harita pinleri için lat/lng de döndürür (yaklaşık "” exact adres gizli).
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { DiscoverResult, NearbyChef } from '@/types/discover'

const querySchema = z.object({
  lat:       z.coerce.number().min(-90).max(90),
  lng:       z.coerce.number().min(-180).max(180),
  radius:    z.coerce.number().min(1).max(20).default(5),
  sort:      z.enum(['distance', 'rating', 'price']).default('distance'),
  category:  z.enum(['main', 'soup', 'dessert', 'pastry', 'salad']).optional(),
  delivery:  z.enum(['all', 'delivery', 'pickup']).default('all'),
  open_only: z.coerce.boolean().default(false),
})

// Anon client "” RLS public erişimine izin verilen veriler
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { lat, lng, radius, sort, category, delivery, open_only } = parsed.data

  try {
    // 1. PostGIS find_nearby_chefs() çağrısı
    const { data: rawChefs, error: chefErr } = await supabase.rpc(
      'find_nearby_chefs',
      {
        user_lat:  lat,
        user_lng:  lng,
        radius_km: radius,
        category:  category ?? null,
        sort_by:   sort,
      }
    )

    if (chefErr) {
      console.error('find_nearby_chefs error:', chefErr)
      return NextResponse.json({ error: 'Aşçılar yüklenemedi.' }, { status: 500 })
    }

    let chefs = rawChefs ?? []

    // 2. Client-side filtreler (PostGIS fonksiyonuna eklenemeyenler)
    if (open_only) {
      chefs = chefs.filter((c: any) => c.is_open)
    }

    if (delivery !== 'all') {
      chefs = chefs.filter((c: any) =>
        delivery === 'delivery'
          ? c.delivery_types?.includes('delivery')
          : c.delivery_types?.includes('pickup')
      )
    }

    // 3. Her aşçı için menü önizlemesi çek (parallel)
    const chefIds = chefs.map((c: any) => c.chef_id)

    let previewMap: Record<string, any[]> = {}

    if (chefIds.length > 0) {
      const { data: menuItems } = await supabase
        .from('menu_items_with_chef')
        .select('id, chef_profile_id, name, price, category, remaining_stock, stock_status, photos')
        .in('chef_profile_id', chefIds)
        .eq('is_active', true)
        .gt('remaining_stock', 0)
        .order('price', { ascending: true })

      // chef_id'ye göre grupla
      for (const item of menuItems ?? []) {
        if (!previewMap[item.chef_profile_id]) {
          previewMap[item.chef_profile_id] = []
        }
        if (previewMap[item.chef_profile_id].length < 3) {
          previewMap[item.chef_profile_id].push(item)
        }
      }
    }

    // 4. Harita pinleri için yaklaşık koordinatlar
    //    Gerçek uygulamada: random offset ekle (50-150m) "” gizlilik
    //    Burada: Supabase'den ST_X / ST_Y ile yaklaşık merkez al
    let pinMap: Record<string, { lat: number; lng: number }> = {}

    if (chefIds.length > 0) {
      const { data: locationData } = await supabase
        .rpc('get_chef_approx_locations', { chef_ids: chefIds })
        .select('chef_id, approx_lat, approx_lng')

      for (const loc of locationData ?? []) {
        pinMap[loc.chef_id] = { lat: loc.approx_lat, lng: loc.approx_lng }
      }
    }

    // 5. Sonuçları birleştir
    const result: NearbyChef[] = chefs.map((c: any) => ({
      chef_id:         c.chef_id,
      user_id:         c.user_id,
      full_name:       c.full_name,
      avatar_url:      c.avatar_url,
      location_approx: c.location_approx,
      avg_rating:      c.avg_rating ? Number(c.avg_rating) : null,
      total_reviews:   c.total_reviews ?? 0,
      total_orders:    c.total_orders ?? 0,
      badge:           c.badge,
      is_open:         c.is_open,
      delivery_types:  c.delivery_types ?? [],
      distance_km:     Number(c.distance_km),
      min_price:       c.min_price ? Number(c.min_price) : null,
      menu_count:      Number(c.menu_count ?? 0),
      preview_items:   previewMap[c.chef_id] ?? [],
      // Pin koordinatları (yaklaşık)
      pin_lat:         pinMap[c.chef_id]?.lat ?? lat + (Math.random() - 0.5) * 0.02,
      pin_lng:         pinMap[c.chef_id]?.lng ?? lng + (Math.random() - 0.5) * 0.02,
    }))

    // 6. Konum string'i (reverse geocode "” basit)
    const locationStr = `${radius} km çevresi`

    const response: DiscoverResult & { pins: any[] } = {
      chefs:       result,
      total:       result.length,
      locationStr,
      pins:        result.map(c => ({
        chef_id:     c.chef_id,
        full_name:   c.full_name,
        lat:         (c as any).pin_lat,
        lng:         (c as any).pin_lng,
        is_open:     c.is_open,
        avg_rating:  c.avg_rating,
        distance_km: c.distance_km,
      })),
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    })

  } catch (err) {
    console.error('discover error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}


