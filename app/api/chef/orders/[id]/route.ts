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

const STATUS_MESSAGES: Record<string, { title: string; body: string; type: string }> = {
  confirmed:         { title: 'Siparisín Onaylandi!', body: 'Asci siparisini hazirlamaya basliyor.', type: 'order_confirmed' },
  preparing:         { title: 'Siparisín Hazirlaniyor', body: 'Asci yemegini hazirliyor, az kaldi!', type: 'order_preparing' },
  on_way:            { title: 'Siparisín Yolda!', body: 'Asci siparisini teslim etmek uzere.', type: 'order_on_way' },
  delivered_pending: { title: 'Siparisín Kapida!', body: 'Siparisín teslim edildi. Lutfen onayla.', type: 'order_delivered_pending' },
  delivered:         { title: 'Siparisín Teslim Edildi!', body: 'Afiyet olsun! Degerlendirme yapmayi unutma.', type: 'order_delivered' },
  cancelled:         { title: 'Siparisín Iptal Edildi', body: 'Siparisín iptal edildi.', type: 'order_cancelled' },
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

  // Bildirim gönder
  const msg = STATUS_MESSAGES[status]
  if (msg) {
    // Alıcıya bildirim (tüm durum değişikliklerinde)
    if (order.buyer_id) {
      // Notifications tablosuna kaydet
      await supabaseAdmin.from('notifications').insert({
        user_id:  order.buyer_id,
        type:     msg.type,
        title:    msg.title,
        message:  msg.body,
        data:     { order_id: params.id, order_number: order.order_number },
        is_read:  false,
      })
      // Push bildirim
      pushGonder(order.buyer_id, msg.title, msg.body)
    }

    // Aşçıya bildirim — sadece alıcı teslim aldığında
    if (status === 'delivered' && order.chef_id) {
      const { data: chefProfile } = await supabaseAdmin
        .from('chef_profiles')
        .select('user_id')
        .eq('id', order.chef_id)
        .single()

      if (chefProfile?.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id:  chefProfile.user_id,
          type:     'payout_completed',
          title:    'Odeme Hesabiniza Aktarildi!',
          message:  `#${order.order_number} siparisi teslim alindi. Odeme hesabiniza aktarilacak.`,
          data:     { order_id: params.id },
          is_read:  false,
        })
        pushGonder(chefProfile.user_id, 'Odeme Aktarildi!', `#${order.order_number} siparisi icin odeme hesabiniza aktarilacak.`)
      }
    }
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