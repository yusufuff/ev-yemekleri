// @ts-nocheck
/**
 * GET /api/chefs/[id]
 * Herkese açık aşçı profil verisi:
 *  - Kullanıcı bilgisi (ad, avatar)
 *  - Aşçı profili (bio, konum, çalışma saatleri, rozet, puan)
 *  - Aktif menü öğeleri
 *  - Son yorumlar (sayfalı)
 *  - Toplam sipariş ve yorum sayısı
 *
 * Kesin adres / IBAN / iyzico bilgileri hiçbir zaman döndürülmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const REVIEWS_PER_PAGE = 5

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await getSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const reviewPage = parseInt(searchParams.get('reviews') ?? '1')

  // â”€â”€ Aşçı profili + kullanıcı bilgisi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: profile, error: profileError } = await supabase
    .from('chef_profiles')
    .select(`
      id,
      bio,
      location_approx,
      delivery_radius_km,
      delivery_types,
      is_open,
      vacation_until,
      avg_rating,
      total_orders,
      badge,
      verification_status,
      working_hours,
      created_at,
      users!inner (
        id,
        full_name,
        avatar_url,
        created_at
      )
    `)
    .eq('id', params.id)
    .eq('verification_status', 'approved')   // Onaylı profiller
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Aşçı bulunamadı.' }, { status: 404 })
  }

  // â”€â”€ Aktif menü öğeleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, description, price, daily_stock, remaining_stock, category, allergens, prep_time_min, is_active, photos')
    .eq('chef_id', params.id)
    .eq('is_active', true)
    .order('category')
    .order('name')

  // â”€â”€ Yorumlar (sayfalı) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const from = (reviewPage - 1) * REVIEWS_PER_PAGE
  const to   = from + REVIEWS_PER_PAGE - 1

  const { data: reviews, count: reviewCount } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      chef_reply,
      replied_at,
      created_at,
      users!buyer_id (
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('chef_id', params.id)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  // â”€â”€ Puan dağılımı (1"“5 yıldız) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: ratingDist } = await supabase
    .from('reviews')
    .select('rating')
    .eq('chef_id', params.id)

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratingDist?.forEach(r => { dist[r.rating] = (dist[r.rating] ?? 0) + 1 })

  // â”€â”€ Favori sayısı â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { count: favoriteCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('chef_id', params.id)

  return NextResponse.json({
    profile,
    menu_items:      menuItems    ?? [],
    reviews:         reviews      ?? [],
    review_count:    reviewCount  ?? 0,
    review_pages:    Math.ceil((reviewCount ?? 0) / REVIEWS_PER_PAGE),
    rating_dist:     dist,
    favorite_count:  favoriteCount ?? 0,
  })
}


