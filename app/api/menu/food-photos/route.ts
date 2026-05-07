// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ photos: [] })
  const { data } = await supabase
    .from('standard_food_photos')
    .select('id, food_name, photo_url')
    .ilike('food_name', `%${q}%`)
    .limit(6)
  return NextResponse.json({ photos: data ?? [] })
}