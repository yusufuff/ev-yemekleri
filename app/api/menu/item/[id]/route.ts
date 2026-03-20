// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()

  const { data: item, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !item) {
    return NextResponse.json({ error: 'Yemek bulunamadi.' }, { status: 404 })
  }

  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id, user_id, location_approx, avg_rating, badge')
    .eq('id', item.chef_id)
    .single()

  const { data: chefUser } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', chefProfile?.user_id ?? '')
    .single()

  return NextResponse.json({
    item,
    chef: chefProfile ? {
      full_name: chefUser?.full_name ?? 'Asci',
      avatar_url: chefUser?.avatar_url ?? null,
      chef_profile_id: chefProfile.id,
      location_approx: chefProfile.location_approx,
      avg_rating: chefProfile.avg_rating,
      badge: chefProfile.badge,
    } : null,
  })
}