/**
 * POST /api/reviews
 * Teslim edilmiÅŸ bir sipariÅŸ iÃ§in yorum ekler.
 * Bir sipariÅŸ iÃ§in birden fazla yorum engellenir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })

  const { order_id, rating, comment } = await req.json()
  if (!order_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'GeÃ§ersiz veri.' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // SipariÅŸi doÄŸrula â€” teslim edilmiÅŸ mi ve alÄ±cÄ±sÄ± bu kullanÄ±cÄ± mÄ±?
  const { data: order } = await supabase
    .from('orders')
    .select('id, chef_id, status, buyer_id')
    .eq('id', order_id)
    .eq('buyer_id', user.id)
    .eq('status', 'delivered')
    .single()

  if (!order) {
    return NextResponse.json(
      { error: 'SipariÅŸ bulunamadÄ± veya henÃ¼z teslim edilmedi.' },
      { status: 400 }
    )
  }

  // Daha Ã¶nce yorum yapÄ±lmÄ±ÅŸ mÄ±?
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', order_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Bu sipariÅŸ iÃ§in zaten yorum yapÄ±lmÄ±ÅŸ.' }, { status: 409 })
  }

  // Yorum ekle
  const { data, error } = await (supabase as any).from('reviews').insert({
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


