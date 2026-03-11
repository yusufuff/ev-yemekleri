// @ts-nocheck
/**
 * GET    /api/messages/[orderId]  "” Konuşma geçmişi + okundu işareti
 * POST   /api/messages/[orderId]  "” Yeni mesaj gönder
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

// â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const supabase = await getSupabaseServerClient()

  // Kullanıcının bu siparişe erişim hakkı var mı?
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, chef_id, chef_profiles!inner(user_id)')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })

  const chefUserId = (order as any).chef_profiles?.user_id
  const isBuyer    = order.buyer_id === user.id
  const isChef     = chefUserId     === user.id

  if (!isBuyer && !isChef) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  // Mesajları çek
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id, content, sender_id, is_read, created_at,
      users!sender_id ( full_name, avatar_url )
    `)
    .eq('order_id', params.orderId)
    .order('created_at', { ascending: true })

  // Gelen mesajları okundu olarak işaretle
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('order_id', params.orderId)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  // Karşı taraf bilgisi
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
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const { content } = await req.json()
  const trimmed = content?.trim()
  if (!trimmed || trimmed.length > 1000) {
    return NextResponse.json({ error: 'Mesaj geçersiz (1"“1000 karakter).' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Erişim kontrolü
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, chef_profiles!inner(user_id)')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })

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
    return NextResponse.json({ error: 'Mesaj gönderilemedi.' }, { status: 500 })
  }

  return NextResponse.json(msg, { status: 201 })
}



