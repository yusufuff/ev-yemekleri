// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { initCheckoutForm } from '@/lib/iyzico'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const order_id = searchParams.get('order_id')

  if (!order_id) {
    return NextResponse.json({ error: 'Gecersiz siparis' })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: order } = await adminClient
    .from('orders')
    .select('*, order_items (item_name, item_price, quantity, menu_item_id)')
    .eq('id', order_id)
    .eq('payment_status', 'pending')
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Siparis bulunamadi' })
  }

  const { data: chefProfile } = await adminClient
    .from('chef_profiles')
    .select('iyzico_sub_merchant_key')
    .eq('id', order.chef_id)
    .single()

  const { data: profile } = await adminClient
    .from('users')
    .select('full_name, phone')
    .eq('id', order.buyer_id)
    .single()

  const { data: authData } = await adminClient.auth.admin.getUserById(order.buyer_id)
  const buyerEmail = authData?.user?.email ?? (order.buyer_id.slice(0, 8) + '@anneelim.com')

  const addr = order.delivery_address as any
  const totalAmount = Number(order.total_amount)
  const subMerchantKey = chefProfile?.iyzico_sub_merchant_key ?? null

  const result = await initCheckoutForm({
    orderId:          order.id,
    orderNumber:      order.order_number,
    amount:           totalAmount,
    buyerId:          order.buyer_id,
    buyerName:        profile?.full_name ?? 'Kullanici',
    buyerPhone:       profile?.phone ?? '+905550000000',
    buyerEmail,
    city:             addr?.city ?? 'Istanbul',
    address:          addr?.full_address ?? 'Turkiye',
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
    return NextResponse.json({ error: result.error })
  }

  await adminClient.from('orders').update({ iyzico_token: result.token }).eq('id', order.id)

  return NextResponse.redirect(
    'https://sandbox-static.iyzipay.com/checkoutform/initialize/auth/ecom?token=' + result.token,
    { status: 302 }
  )
}