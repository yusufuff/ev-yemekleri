/**
 * POST /api/reviews
 * Teslim edilmiş bir sipariş için yorum ekler.
 * Bir sipariş için birden fazla yorum engellenir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const { order_id, rating, comment } = await req.json()
  if (!order_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Geçersiz veri.' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Siparişi doğrula — teslim edilmiş mi ve alıcısı bu kullanıcı mı?
  const { data: order } = await supabase
    .from('orders')
    .select('id, chef_id, status, buyer_id')
    .eq('id', order_id)
    .eq('buyer_id', user.id)
    .eq('status', 'delivered')
    .single()

  if (!order) {
    return NextResponse.json(
      { error: 'Sipariş bulunamadı veya henüz teslim edilmedi.' },
      { status: 400 }
    )
  }

  // Daha önce yorum yapılmış mı?
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', order_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Bu sipariş için zaten yorum yapılmış.' }, { status: 409 })
  }

  // Yorum ekle
  const { data, error } = await supabase.from('reviews').insert({
    order_id,
    buyer_id: user.id,
    chef_id:  order.chef_id,
    rating,
    comment:  comment?.trim() || null,
  }).select('id').single()

  if (error) {
    console.error('[reviews POST]', error)
    return NextResponse.json({ error: 'Yorum kaydedilemedi.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
