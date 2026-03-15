import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat      = parseFloat(searchParams.get('lat')  ?? '37.0017')
  const lng      = parseFloat(searchParams.get('lng')  ?? '35.3289')
  const radius   = parseFloat(searchParams.get('radius') ?? '5')
  const sort     = searchParams.get('sort') ?? 'distance'
  const category = searchParams.get('category') ?? null
  const openOnly = searchParams.get('open_only') === 'true'

  try {
    const { data, error } = await supabase.rpc('find_nearby_chefs', {
      user_lat:  lat,
      user_lng:  lng,
      radius_km: radius,
      sort_by:   sort,
      category:  category,
      open_only: openOnly,
    })

    if (error) throw error

    // Her aşçı için menü önizlemesi ekle
    const chefs = await Promise.all((data ?? []).map(async (chef: any) => {
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, price, category, remaining_stock')
        .eq('chef_id', chef.chef_id)
        .eq('is_active', true)
        .limit(3)

      return {
        ...chef,
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
    // Supabase bağlantısı yoksa mock'a düş
    const { MOCK_CHEFS } = await import('@/lib/mock/data')
    return NextResponse.json({ chefs: MOCK_CHEFS, total: MOCK_CHEFS.length, locationStr: 'Adana, Seyhan' })
  }
}