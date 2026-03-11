/**
 * PATCH /api/chef/orders
 * SipariÅŸ durumunu gÃ¼ncelle (onayla, hazÄ±rla, yola Ã§Ä±k, teslim et, iptal et)
 *
 * Body: { orderId: string, action: OrderAction }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/firebase/send-notification'
import type { OrderStatus } from '@/types/database'

// Ä°zin verilen durum geÃ§iÅŸleri
const TRANSITIONS: Record<string, OrderStatus> = {
  confirm:  'confirmed',
  prepare:  'preparing',
  ready:    'ready',
  dispatch: 'on_way',
  deliver:  'delivered',
  cancel:   'cancelled',
}

const schema = z.object({
  orderId:          z.string().uuid(),
  action:           z.enum(['confirm', 'prepare', 'ready', 'dispatch', 'deliver', 'cancel']),
  cancellationNote: z.string().max(300).optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { orderId, action, cancellationNote } = parsed.data
  const newStatus = TRANSITIONS[action]

  // Chef ID doÄŸrula
  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) return NextResponse.json({ error: 'Chef not found' }, { status: 404 })

  // SipariÅŸin bu aÅŸÃ§Ä±ya ait olduÄŸunu doÄŸrula
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, chef_id, buyer_id, order_number')
    .eq('id', orderId)
    .eq('chef_id', chefProfile.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Timestamp alanÄ±nÄ± belirle
  const timestampField: Record<string, string> = {
    confirmed:  'confirmed_at',
    preparing:  'preparing_at',
    ready:      'ready_at',
    on_way:     'on_way_at',
    delivered:  'delivered_at',
    cancelled:  'cancelled_at',
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    [timestampField[newStatus]]: new Date().toISOString(),
  }

  if (action === 'cancel' && cancellationNote) {
    updateData.cancellation_reason = cancellationNote
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (updateErr) {
    console.error('Order update error:', updateErr)
    return NextResponse.json({ error: 'GÃ¼ncelleme baÅŸarÄ±sÄ±z' }, { status: 500 })
  }

  // Stok dÃ¼ÅŸÃ¼r (sipariÅŸ onaylandÄ±ÄŸÄ±nda)
  if (action === 'confirm') {
    const { data: items } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity')
      .eq('order_id', orderId)

    if (items) {
      for (const item of items) {
        if (!item.menu_item_id) continue
        await supabase.rpc('decrement_stock', {
          item_id: item.menu_item_id,
          qty:     item.quantity,
        })
      }
    }
  }

  // AlÄ±cÄ±ya push bildirimi gÃ¶nder (notifications tablosuna da yazar)
  const statusMessages: Record<string, { title: string; body: string }> = {
    confirmed:  { title: 'SipariÅŸin OnaylandÄ±! âœ…',     body: 'AÅŸÃ§Ä± sipariÅŸini onayladÄ±, hazÄ±rlamaya baÅŸlÄ±yor.' },
    preparing:  { title: 'SipariÅŸin HazÄ±rlanÄ±yor ğŸ³',   body: 'AÅŸÃ§Ä± sipariÅŸini hazÄ±rlÄ±yor. Biraz bekle!' },
    ready:      { title: 'SipariÅŸin HazÄ±r! ğŸ“¦',         body: 'Gel-al sipariÅŸin hazÄ±r, teslim almaya gelebilirsin.' },
    on_way:     { title: 'SipariÅŸin Yolda ğŸ›µ',          body: 'Kurye kapÄ±na doÄŸru yola Ã§Ä±ktÄ±.' },
    delivered:  { title: 'SipariÅŸin Teslim Edildi ğŸ‰',  body: 'Afiyet olsun! Deneyimini deÄŸerlendirmeyi unutma.' },
    cancelled:  { title: 'SipariÅŸ Ä°ptal Edildi âŒ',     body: `SipariÅŸin iptal edildi.${cancellationNote ? ` Sebep: ${cancellationNote}` : ''}` },
  }

  const msg = statusMessages[newStatus]
  if (msg) {
    await sendPushNotification({
      userId: order.buyer_id,
      title:  msg.title,
      body:   msg.body,
      type:   `order_${newStatus}`,
      data:   { order_id: orderId, order_number: order.order_number ?? '' },
    }).catch(() => {})  // Bildirim hatasÄ± sipariÅŸi bloklamasÄ±n
  }

  return NextResponse.json({ success: true, newStatus })
}

/**
 * PATCH /api/chef/orders?toggle=open
 * AÅŸÃ§Ä± aÃ§Ä±k/kapalÄ± durumunu deÄŸiÅŸtir
 */
export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { is_open } = await req.json()

  const { error } = await supabase
    .from('chef_profiles')
    .update({ is_open: Boolean(is_open) })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'GÃ¼ncelleme baÅŸarÄ±sÄ±z' }, { status: 500 })

  return NextResponse.json({ success: true, is_open })
}

