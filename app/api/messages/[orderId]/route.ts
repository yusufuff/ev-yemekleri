/**
 * GET    /api/messages/[orderId]  â€” KonuÅŸma geÃ§miÅŸi + okundu iÅŸareti
 * POST   /api/messages/[orderId]  â€” Yeni mesaj gÃ¶nder
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

// â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })

  const supabase = await getSupabaseServerClient()

  // KullanÄ±cÄ±nÄ±n bu sipariÅŸe eriÅŸim hakkÄ± var mÄ±?
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, chef_id, chef_profiles!inner(user_id)')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'SipariÅŸ bulunamadÄ±.' }, { status: 404 })

  const chefUserId = (order as any).chef_profiles?.user_id
  const isBuyer    = order.buyer_id === user.id
  const isChef     = chefUserId     === user.id

  if (!isBuyer && !isChef) {
    return NextResponse.json({ error: 'Yetkisiz eriÅŸim.' }, { status: 403 })
  }

  // MesajlarÄ± Ã§ek
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id, content, sender_id, is_read, created_at,
      users!sender_id ( full_name, avatar_url )
    `)
    .eq('order_id', params.orderId)
    .order('created_at', { ascending: true })

  // Gelen mesajlarÄ± okundu olarak iÅŸaretle
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('order_id', params.orderId)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  // KarÅŸÄ± taraf bilgisi
  const otherUserId = isBuyer ? chefUserId : order.buyer_id
  const { data: otherUser } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, phone')
    .eq('id', otherUserId)
    .single()

  return NextResponse.json({
    messages:   messages ?? [],
    other_user: otherUser,
    my_id:      user.id,
  })
}

// â”€â”€ POST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })

  const { content } = await req.json()
  const trimmed = content?.trim()
  if (!trimmed || trimmed.length > 1000) {
    return NextResponse.json({ error: 'Mesaj geÃ§ersiz (1â€“1000 karakter).' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // EriÅŸim kontrolÃ¼
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, chef_profiles!inner(user_id)')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'SipariÅŸ bulunamadÄ±.' }, { status: 404 })

  const chefUserId = (order as any).chef_profiles?.user_id
  const hasAccess  = order.buyer_id === user.id || chefUserId === user.id
  if (!hasAccess) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })

  // Mesaj ekle
  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      order_id:  params.orderId,
      sender_id: user.id,
      content:   trimmed,
      is_read:   false,
    })
    .select(`id, content, sender_id, is_read, created_at,
             users!sender_id ( full_name, avatar_url )`)
    .single()

  if (error) {
    console.error('[messages POST]', error)
    return NextResponse.json({ error: 'Mesaj gÃ¶nderilemedi.' }, { status: 500 })
  }

  return NextResponse.json(msg, { status: 201 })
}

