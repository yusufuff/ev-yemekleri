// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { initCheckoutForm } from '@/lib/iyzico'
import { createClient } from '@supabase/supabase-js'

const schema = z.object({ order_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Gecersiz siparis ID.' }, { status: 400 })

  const { order_id } = parsed.data

  // Service role ile siparisi cek (auth gerektirmez, UUID güvenli)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: order, error: orderErr } = await adminClient
    .from('orders')
    .select('*, order_items (item_name, item_price, quantity, menu_item_id)')
    .eq('id', order_id)
    .eq('payment_status', 'pending')
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })

  // buyer_id order'dan al
  const buyerId = order.buyer_id

  // Chef sub-merchant key
  const { data: chefProfile } = await adminClient
    .from('chef_profiles')
    .select('id, iyzico_sub_merchant_key')
    .eq('id', order.chef_id)
    .single()
  const subMerchantKey = chefProfile?.iyzico_sub_merchant_key ?? null

  // Kullanici bilgisi
  const { data: profile } = await adminClient
    .from('users')
    .select('full_name, phone')
    .eq('id', buyerId)
    .single()

  // Email
  const { data: authData } = await adminClient.auth.admin.getUserById(buyerId)
  const buyerEmail = authData?.user?.email ?? `${buyerId.slice(0, 8)}@anneelim.com`

  // Adres
  const addr    = order.delivery_address as any
  const city    = addr?.city ?? 'Istanbul'
  const address = addr?.full_address ?? 'Turkiye'

  const totalAmount = Number(order.total_amount)

  // iyzico baslat
  const result = await initCheckoutForm({
    orderId:          order.id,
    orderNumber:      order.order_number,
    amount:           totalAmount,
    buyerId:          buyerId,
    buyerName:        profile?.full_name ?? 'Kullanici',
    buyerPhone:       profile?.phone ?? '+905550000000',
    buyerEmail,
    city,
    address,
    subMerchantKey:   subMerchantKey ?? undefined,
    subMerchantPrice: subMerchantKey ? totalAmount : undefined,
    items: (order.order_items ?? []).map((item: any) => ({
      id:       item.menu_item_id ?? 'item',
      name:     item.item_name,
      price:    Number(item.item_price),
      category: 'Ev Yemegi',
      quantity: item.quantity,
    })),
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Odeme baslatılamadi.' }, { status: 502 })
  }

  await adminClient.from('orders').update({ iyzico_token: result.token }).eq('id', order.id)

  return NextResponse.json({
    success:               true,
    order_id:              order.id,
    order_number:          order.order_number,
    checkout_form_content: result.content,
    token:                 result.token,
  })
}