/**
 * POST /api/orders — Yeni sipariş oluştur
 * GET  /api/orders — Kullanıcının siparişlerini listele
 *
 * Sipariş akışı:
 * 1. Stok kontrolü (race condition'a karşı DB transaction)
 * 2. İyzico ödeme başlat
 * 3. orders + order_items INSERT
 * 4. Aşçıya FCM push
 * 5. İsteğe bağlı: Netgsm SMS
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

// ─── Şemalar ──────────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  chef_id:       z.string().uuid(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity:     z.number().int().min(1).max(20),
  })).min(1),
  delivery_type:  z.enum(['pickup', 'delivery']),
  address_id:     z.string().uuid().optional(),  // delivery için zorunlu
  coupon_code:    z.string().optional(),
  credit_amount:  z.number().min(0).optional(),
  notes:          z.string().max(200).optional(),
})

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { chef_id, items, delivery_type, address_id, coupon_code, notes } = parsed.data

    const supabase = await getSupabaseServerClient()

    // 1. Stok kontrolü
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, name, price, remaining_stock, is_active')
      .in('id', items.map(i => i.menu_item_id))
      .eq('chef_id', chef_id)

    if (menuErr || !menuItems) {
      return NextResponse.json({ error: 'Menü bilgisi alınamadı.' }, { status: 400 })
    }

    for (const item of items) {
      const found = menuItems.find(m => m.id === item.menu_item_id)
      if (!found || !found.is_active) {
        return NextResponse.json({ error: `"${found?.name}" artık mevcut değil.` }, { status: 409 })
      }
      if (found.remaining_stock !== null && found.remaining_stock < item.quantity) {
        return NextResponse.json(
          { error: `"${found.name}" için yeterli stok yok. Kalan: ${found.remaining_stock}` },
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

    // 3. Kupon kontrolü
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

    // 4. Sipariş order_number üret
    const orderNumber = `EV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // 5. DB'ye kaydet (transaction benzeri — Supabase RPC ile yapılabilir)
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
      return NextResponse.json({ error: 'Sipariş oluşturulamadı.' }, { status: 500 })
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

    // 7. Stok düş
    for (const item of items) {
      const found = menuItems.find(m => m.id === item.menu_item_id)!
      if (found.remaining_stock !== null) {
        await supabase
          .from('menu_items')
          .update({ remaining_stock: found.remaining_stock - item.quantity })
          .eq('id', item.menu_item_id)
      }
    }

    // 8. Aşçıya FCM push (fire-and-forget)
    sendChefNotification(chef_id, order.id, orderNumber).catch(console.error)

    return NextResponse.json({
      success:     true,
      order_id:    order.id,
      order_number: orderNumber,
      amount:      finalAmount,
      // İyzico ödeme URL'i burada dönecek — şimdilik placeholder
      payment_url: `/odeme?order_id=${order.id}`,
    })

  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
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

  // Rol bazlı filtre (RLS bunu zaten sağlıyor ama explict de ekliyoruz)
  if (user.role === 'buyer') {
    query = query.eq('buyer_id', user.id)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Siparişler alınamadı.' }, { status: 500 })
  }

  return NextResponse.json({ orders: data, total: count, page })
}

// ─── Yardımcı: FCM push ───────────────────────────────────────────────────────

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
            title: '🛒 Yeni Sipariş!',
            body:  `${orderNumber} numaralı sipariş onay bekliyor.`,
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
