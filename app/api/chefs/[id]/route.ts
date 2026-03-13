import { NextRequest, NextResponse } from 'next/server'
import { MOCK_CHEFS, MOCK_MENU, MOCK_REVIEWS } from '@/lib/mock/data'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const chef = MOCK_CHEFS.find(c => c.chef_id === params.id)
  if (!chef) return NextResponse.json({ error: 'Aşçı bulunamadı' }, { status: 404 })

  const menuItems = MOCK_MENU[params.id] ?? []
  const reviews = MOCK_REVIEWS[params.id] ?? []

  return NextResponse.json({
    profile: {
      id: chef.chef_id,
      bio: `${chef.full_name} ev mutfağından lezzetli yemekler hazırlıyor. ${chef.total_orders} mutlu sipariş!`,
      location_approx: chef.location_approx,
      avg_rating: chef.avg_rating,
      total_reviews: chef.total_reviews,
      total_orders: chef.total_orders,
      badge: chef.badge,
      is_open: chef.is_open,
      delivery_types: chef.delivery_types,
      distance_km: chef.distance_km,
      working_hours: {
        mon: { open: '10:00', close: '19:00', closed: false },
        tue: { open: '10:00', close: '19:00', closed: false },
        wed: { open: '10:00', close: '19:00', closed: false },
        thu: { open: '10:00', close: '19:00', closed: false },
        fri: { open: '10:00', close: '19:00', closed: false },
        sat: { open: '10:00', close: '17:00', closed: false },
        sun: { open: null, close: null, closed: true },
      },
      user: { full_name: chef.full_name, avatar_url: chef.avatar_url },
      rating_breakdown: { 5: Math.floor(chef.total_reviews * 0.8), 4: Math.floor(chef.total_reviews * 0.15), 3: Math.floor(chef.total_reviews * 0.05), 2: 0, 1: 0 },
    },
    menuItems,
    reviews,
    reviewPage: 1,
    hasMoreReviews: false,
  })
}