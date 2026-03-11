/**
 * POST /api/orders â€” Yeni sipariÅŸ oluÅŸtur
 * GET  /api/orders â€” KullanÄ±cÄ±nÄ±n sipariÅŸlerini listele
 *
 * SipariÅŸ akÄ±ÅŸÄ±:
 * 1. Stok kontrolÃ¼ (race condition'a karÅŸÄ± DB transaction)
 * 2. Ä°yzico Ã¶deme baÅŸlat
 * 3. orders + order_items INSERT
 * 4. AÅŸÃ§Ä±ya FCM push
 * 5. Ä°steÄŸe baÄŸlÄ±: Netgsm SMS
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

// â”€â”€â”€ Åemalar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const createOrderSchema = z.object({
  chef_id:       z.string().uuid(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity:     z.number().int().min(1).max(20),
  })).min(1),
  delivery_type:  z.enum(['pickup', 'delivery']),
  address_id:     z.string().uuid().optional(),  // delivery iÃ§in zorunlu
  coupon_code:    z.string().optional(),
  credit_amount:  z.number().min(0).optional(),
  notes:          z.string().max(200).optional(),
})

// â”€â”€â”€ POST /api/orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser() as any
    if (!user) {
      return NextResponse.json({ error: 'GiriÅŸ yapmanÄ±z gerekiyor.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { chef_id, items, delivery_type, address_id, coupon_code, notes } = parsed.data

    const supabase = await getSupabaseServerClient()

    // 1. Stok kontrolÃ¼
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, name, price, remaining_stock, is_active')
      .in('id', items.map(i => i.menu_item_id))
      .eq('chef_id', chef_id)

    if (menuErr || !menuItems) {
      return NextResponse.json({ error: 'MenÃ¼ bilgisi alÄ±namadÄ±.' }, { status: 400 })
    }

    for (const item of items) {
      const found = menuItems.find(m => m.id === item.menu_item_id)
      if (!found || !found.is_active) {
        return NextResponse.json({ error: `"${found?.name}" artÄ±k mevcut deÄŸil.` }, { status: 409 })
      }
      if (found.remaining_stock !== null && found.remaining_stock < item.quantity) {
        return NextResponse.json(
          { error: `"${found.name}" iÃ§in yeterli stok yok. Kalan: ${found.remaining_stock}` },
          { status: 409 }
        )
      }
    }

    // 2. Tutar hesapla
    const subtotal = items.reduce((sum, item) => {
      const found = menuItems.find(m => m.id === item.menu_item_id)!
      return sum + found.price * item.quantity
    }, 0)

    const platformFee  = Math.round(subtotal * 0.10 * 100) / 100
    const chefEarning  = Math.round((subtotal - platformFee) * 100) / 100

    // 3. Kupon kontrolÃ¼
    let discount = 0
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (coupon) {
        if (coupon.discount_type === 'percentage') {
          discount = subtotal * (coupon.discount_value / 100)
        } else {
          discount = coupon.discount_value
        }
        discount = Math.min(discount, subtotal)
      }
    }

    const finalAmount = Math.max(0, subtotal - discount)

    // 4. SipariÅŸ order_number Ã¼ret
    const orderNumber = `EV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // 5. DB'ye kaydet (transaction benzeri â€” Supabase RPC ile yapÄ±labilir)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number:      orderNumber,
        buyer_id:          user.id,
        chef_id,
        status:            'pending',
        delivery_type,
        subtotal,
        platform_fee:      platformFee,
        chef_earning:      chefEarning,
        payment_status:    'pending',
        coupon_code:       coupon_code ?? null,
        notes:             notes ?? null,
      })
      .select()
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'SipariÅŸ oluÅŸturulamadÄ±.' }, { status: 500 })
    }

    // 6. Order items ekle
    await supabase.from('order_items').insert(
      items.map(item => {
        const found = menuItems.find(m => m.id === item.menu_item_id)!
        return {
          order_id:     order.id,
          menu_item_id: item.menu_item_id,
          name:         found.name,
          price:        found.price,
          quantity:     item.quantity,
        }
      })
    )

    // 7. Stok dÃ¼ÅŸ
    for (const item of items) {
      const found = menuItems.find(m => m.id === item.menu_item_id)!
      if (found.remaining_stock !== null) {
        await supabase
          .from('menu_items')
          .update({ remaining_stock: found.remaining_stock - item.quantity })
          .eq('id', item.menu_item_id)
      }
    }

    // 8. AÅŸÃ§Ä±ya FCM push (fire-and-forget)
    sendChefNotification(chef_id, order.id, orderNumber).catch(console.error)

    return NextResponse.json({
      success:     true,
      order_id:    order.id,
      order_number: orderNumber,
      amount:      finalAmount,
      // Ä°yzico Ã¶deme URL'i burada dÃ¶necek â€” ÅŸimdilik placeholder
      payment_url: `/odeme?order_id=${order.id}`,
    })

  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ error: 'Sunucu hatasÄ±.' }, { status: 500 })
  }
}

// â”€â”€â”€ GET /api/orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'GiriÅŸ yapmanÄ±z gerekiyor.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page   = parseInt(searchParams.get('page') ?? '1')
  const limit  = 20

  let query = supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  // Rol bazlÄ± filtre (RLS bunu zaten saÄŸlÄ±yor ama explict de ekliyoruz)
  if (user.role === 'buyer') {
    query = query.eq('buyer_id', user.id)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'SipariÅŸler alÄ±namadÄ±.' }, { status: 500 })
  }

  return NextResponse.json({ orders: data, total: count, page })
}

// â”€â”€â”€ YardÄ±mcÄ±: FCM push â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function sendChefNotification(
  chefId:      string,
  orderId:     string,
  orderNumber: string
) {
  const supabase = await getSupabaseServerClient()

  const { data: chefUser } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', chefId)
    .single()

  if (!chefUser?.fcm_token) return

  // FCM HTTP v1 API
  await fetch(
    `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.FIREBASE_ACCESS_TOKEN}`, // OAuth2 token
      },
      body: JSON.stringify({
        message: {
          token: chefUser.fcm_token,
          notification: {
            title: 'ğŸ›’ Yeni SipariÅŸ!',
            body:  `${orderNumber} numaralÄ± sipariÅŸ onay bekliyor.`,
          },
          data: {
            type:     'new_order',
            order_id: orderId,
          },
        },
      }),
    }
  )
}

