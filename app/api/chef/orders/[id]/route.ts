// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:           ['confirmed', 'cancelled'],
  confirmed:         ['preparing', 'cancelled'],
  preparing:         ['on_way', 'cancelled'],
  on_way:            ['delivered_pending', 'delivered'],
  delivered_pending: ['delivered'],
  delivered:         [],
  cancelled:         [],
}

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed:         { title: '✅ Siparişin Onaylandı!', body: 'Aşçı siparişini hazırlamaya başlıyor.' },
  preparing:         { title: '👨‍🍳 Siparişin Hazırlanıyor', body: 'Aşçı yemeğini hazırlıyor, az kaldı!' },
  on_way:            { title: '🛵 Siparişin Yolda!', body: 'Aşçı siparişini teslim etmek üzere.' },
  delivered_pending: { title: '📦 Siparişin Kapıda!', body: 'Siparişin teslim edildi. Lütfen onayla.' },
  delivered:         { title: '🎉 Siparişin Teslim Edildi!', body: 'Afiyet olsun! Değerlendirme yapmayı unutma.' },
  cancelled:         { title: '❌ Siparişin İptal Edildi', body: 'Siparişin iptal edildi.' },
}

async function pushGonder(userId: string, title: string, body: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ user_id: userId, title, body }),
    })
  } catch (e) {
    console.error('[Push] hata:', e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Gecersiz istek.' }, { status: 400 })
  }

  const { status } = body
  if (!status) {
    return NextResponse.json({ error: 'Status gerekli.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, chef_id, buyer_id, order_number')
    .eq('id', params.id)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })
  }

  const allowed = VALID_TRANSITIONS[order.status] ?? []

  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `${order.status} -> ${status} gecisi yapilamaz.`, current_status: order.status, allowed },
      { status: 400 }
    )
  }

  const updateData: Record<string, any> = { status }

  if (status === 'delivered_pending') {
    updateData.delivered_at = new Date().toISOString()
  }

  if (status === 'delivered') {
    updateData.delivered_at = updateData.delivered_at ?? new Date().toISOString()
  }

  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', params.id)

  if (updateErr) {
    return NextResponse.json({ error: 'Guncelleme basarisiz.' }, { status: 500 })
  }

  // Push bildirim gönder (alıcıya)
  const msg = STATUS_MESSAGES[status]
  if (msg && order.buyer_id) {
    pushGonder(order.buyer_id, msg.title, msg.body)
  }

  return NextResponse.json({ success: true, status, order_id: params.id })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}