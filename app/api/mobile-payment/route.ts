// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { initCheckoutForm } from '@/lib/iyzico'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const order_id = searchParams.get('order_id')

  if (!order_id) {
    return new NextResponse('<h1>Gecersiz siparis</h1>', { headers: { 'Content-Type': 'text/html' } })
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
    return new NextResponse('<h1>Siparis bulunamadi</h1>', { headers: { 'Content-Type': 'text/html' } })
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
    return new NextResponse('<h1>Hata: ' + result.error + '</h1>', { headers: { 'Content-Type': 'text/html' } })
  }

  await adminClient.from('orders').update({ iyzico_token: result.token }).eq('id', order.id)

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Guvenli Odeme</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #FAF6EF; font-family: -apple-system, sans-serif; }
    #iyzipay-checkout-form { padding: 16px; }
  </style>
</head>
<body>
  <div id="iyzipay-checkout-form" class="responsive"></div>
  ${result.content}
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}