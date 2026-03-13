import { NextRequest, NextResponse } from 'next/server'
import { MOCK_CHEFS } from '@/lib/mock/data'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') || 'distance'
  const category = searchParams.get('category')
  const delivery = searchParams.get('delivery') || 'all'
  const open_only = searchParams.get('open_only') === 'true'

  let chefs = [...MOCK_CHEFS]

  if (open_only) chefs = chefs.filter(c => c.is_open)
  if (delivery === 'delivery') chefs = chefs.filter(c => c.delivery_types.includes('delivery'))
  if (delivery === 'pickup') chefs = chefs.filter(c => c.delivery_types.includes('pickup'))
  if (category) chefs = chefs.filter(c => c.preview_items.some((i: any) => i.category === category))

  if (sort === 'rating') chefs.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
  else if (sort === 'price') chefs.sort((a, b) => (a.min_price ?? 0) - (b.min_price ?? 0))
  else chefs.sort((a, b) => a.distance_km - b.distance_km)

  return NextResponse.json({
    chefs,
    total: chefs.length,
    locationStr: 'Adana, Seyhan',
  })
}