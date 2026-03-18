// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ items: [] })
  }

  const supabase = await getSupabaseServerClient()

  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) {
    return NextResponse.json({ items: [] })
  }

  const { data: items, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('chef_id', chefProfile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[menu GET] error:', error)
    return NextResponse.json({ items: [] })
  }

  return NextResponse.json({ items: items ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'Giris yapmaniz gerekiyor.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) {
    return NextResponse.json({ error: 'Asci profili bulunamadi.' }, { status: 404 })
  }

  const body = await req.json()

  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({
      chef_id: chefProfile.id,
      name: body.name,
      description: body.description ?? '',
      category: body.category ?? 'main',
      price: body.price,
      daily_stock: body.daily_stock ?? 10,
      remaining_stock: body.daily_stock ?? 10,
      allergens: body.allergens ?? [],
      prep_time_min: body.prep_time_min ?? 30,
      is_active: true,
      photos: body.photos ?? [],
    })
    .select()
    .single()

  if (error) {
    console.error('[menu POST] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'Giris yapmaniz gerekiyor.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) {
    return NextResponse.json({ error: 'Asci profili bulunamadi.' }, { status: 404 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  const { data: item, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .eq('chef_id', chefProfile.id)
    .select()
    .single()

  if (error) {
    console.error('[menu PATCH] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'Giris yapmaniz gerekiyor.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) {
    return NextResponse.json({ error: 'Asci profili bulunamadi.' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
    .eq('chef_id', chefProfile.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}