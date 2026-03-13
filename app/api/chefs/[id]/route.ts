import { NextRequest, NextResponse } from 'next/server'
import { MOCK_CHEFS, MOCK_MENU, MOCK_REVIEWS } from '@/lib/mock/data'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const chef = MOCK_CHEFS.find(c => c.chef_id === params.id)
  if (!chef) return NextResponse.json({ error: 'Aşçı bulunamadı' }, { status: 404 })

  const menu_items = MOCK_MENU[params.id] ?? []
  const reviewList = MOCK_REVIEWS[params.id] ?? []

  // Sayfa data.profile.users.full_name bekliyor
  const profile = {
    id:               chef.chef_id,
    bio:              `${chef.full_name} ev mutfağından lezzetli yemekler hazırlıyor. ${chef.total_orders} mutlu sipariş!`,
    location_approx:  chef.location_approx,
    avg_rating:       chef.avg_rating,
    total_reviews:    chef.total_reviews,
    total_orders:     chef.total_orders,
    badge:            chef.badge,
    is_open:          chef.is_open,
    delivery_types:   chef.delivery_types,
    distance_km:      chef.distance_km,
    delivery_radius_km: 5,
    working_hours: {
      mon: { open: '10:00', close: '19:00' },
      tue: { open: '10:00', close: '19:00' },
      wed: { open: '10:00', close: '19:00' },
      thu: { open: '10:00', close: '19:00' },
      fri: { open: '10:00', close: '19:00' },
      sat: { open: '10:00', close: '17:00' },
      sun: null,
    },
    // Sayfa profile.users.full_name şeklinde erişiyor
    users: {
      id:         chef.user_id,
      full_name:  chef.full_name,
      avatar_url: chef.avatar_url,
      created_at: '2024-01-01',
    },
    rating_breakdown: {
      5: Math.floor(chef.total_reviews * 0.80),
      4: Math.floor(chef.total_reviews * 0.15),
      3: Math.floor(chef.total_reviews * 0.05),
      2: 0,
      1: 0,
    },
  }

  // Yorumlar: sayfa review.users.full_name bekliyor
  const reviews = reviewList.map((r: any) => ({
    ...r,
    users: { full_name: r.reviewer_name, avatar_url: null },
  }))

  return NextResponse.json({
    profile,
    menu_items,
    reviews,
    review_count:  reviews.length,
    review_pages:  1,
    rating_dist:   profile.rating_breakdown,
    favorite_count: 0,
  })
}