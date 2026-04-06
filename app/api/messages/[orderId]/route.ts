// @ts-nocheck
/**
 * GET    /api/messages/[orderId]  — Konuþma geçmiþi + okundu iþareti
 * POST   /api/messages/[orderId]  — Yeni mesaj gönder
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

// ¦¦ GET ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'Giriþ gerekli.' }, { status: 401 })

  const supabase = await getSupabaseServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, chef_id, chef_profiles!inner(user_id)')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Sipariþ bulunamadý.' }, { status: 404 })

  const chefUserId = (order as any).chef_profiles?.user_id
  const isBuyer    = order.buyer_id === user.id
  const isChef     = chefUserId     === user.id

  if (!isBuyer && !isChef) {
    return NextResponse.json({ error: 'Yetkisiz eriþim.' }, { status: 403 })
  }

  const { data: messages } = await supabase
    .from('messages')
    .select(`id, content, sender_id, recipient_id, is_read, created_at, users!sender_id ( full_name, avatar_url )`)
    .eq('order_id', params.orderId)
    .order('created_at', { ascending: true })

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('order_id', params.orderId)
    .neq('sender_id', user.id)
    .eq('is_read', false)

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

// ¦¦ POST ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'Giriþ gerekli.' }, { status: 401 })

  const { content } = await req.json()
  const trimmed = content?.trim()
  if (!trimmed || trimmed.length > 1000) {
    return NextResponse.json({ error: 'Mesaj geçersiz (1–1000 karakter).' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, chef_id, chef_profiles!inner(user_id)')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Sipariþ bulunamadý.' }, { status: 404 })

  const chefUserId = (order as any).chef_profiles?.user_id
  const isBuyer    = order.buyer_id === user.id
  const isChef     = chefUserId === user.id
  const hasAccess  = isBuyer || isChef
  if (!hasAccess) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })

  // recipient = karþý tarafýn user_id'si
  const recipientId = isBuyer ? chefUserId : order.buyer_id

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      order_id:     params.orderId,
      sender_id:    user.id,
      recipient_id: recipientId,
      content:      trimmed,
      is_read:      false,
    })
    .select(`id, content, sender_id, recipient_id, is_read, created_at, users!sender_id ( full_name, avatar_url )`)
    .single()

  if (error) {
    console.error('[messages POST]', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi.' }, { status: 500 })
  }

  // Karþý tarafa bildirim gönder
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await admin.from('notifications').insert({
      user_id: recipientId,
      type:    'system',
      title:   isChef ? '????? Aþçýnýzdan mesaj' : '?? Yeni mesaj',
      body:    trimmed.slice(0, 80),
      is_read: false,
    })
  } catch (e) {
    console.error('[messages notification]', e)
  }

  return NextResponse.json(msg, { status: 201 })
}
