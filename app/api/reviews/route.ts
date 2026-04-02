// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const user = await getAuthUser() as any
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const body = await req.json()
  const { order_id, chef_id, menu_item_id, rating, comment } = body

  if (!chef_id || !rating) {
    return NextResponse.json({ error: 'chef_id ve rating zorunlu.' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Puan 1-5 arasında olmalı.' }, { status: 400 })
  }

  const supabase = getAdmin()

  // Daha önce yorum yapılmış mı kontrol et
  if (order_id) {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .eq('buyer_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Bu sipariş için zaten yorum yaptınız.' }, { status: 400 })
    }
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      order_id:     order_id ?? null,
      buyer_id:     user.id,
      chef_id,
      menu_item_id: menu_item_id ?? null,
      rating,
      comment:      comment ?? null,
      is_visible:   true,
    })
    .select()
    .single()

  if (error) {
    console.error('[reviews POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const chef_id = searchParams.get('chef_id')
  const order_id = searchParams.get('order_id')

  const supabase = getAdmin()

  let query = supabase
    .from('reviews')
    .select('id, rating, comment, created_at, chef_reply, replied_at, buyer_id, menu_item_id')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (chef_id) query = query.eq('chef_id', chef_id)
  if (order_id) query = query.eq('order_id', order_id)

  const { data: reviews, error } = await query

  if (error) return NextResponse.json({ reviews: [] })

  // Alıcı isimlerini çek
  const buyerIds = [...new Set((reviews ?? []).map((r: any) => r.buyer_id).filter(Boolean))]
  let buyerMap: Record<string, string> = {}
  if (buyerIds.length > 0) {
    const { data: buyers } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', buyerIds)
    ;(buyers ?? []).forEach((b: any) => { buyerMap[b.id] = b.full_name })
  }

  const formatted = (reviews ?? []).map((r: any) => ({
    ...r,
    buyer_name: buyerMap[r.buyer_id] ?? 'Misafir',
  }))

  return NextResponse.json({ reviews: formatted })
}