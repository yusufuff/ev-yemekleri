// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { initCheckoutForm } from '@/lib/iyzico'
import { createClient } from '@supabase/supabase-js'

const schema = z.object({ order_id: z.string().uuid() })

async function getUserFromRequest(req: NextRequest) {
  // 1. Bearer token (mobile)
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data?.user) return data.user
  }

  // 2. Cookie tabanlı (web)
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Giris yapmaniz gerekiyor.' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Gecersiz siparis ID.' }, { status: 400 })

  const { order_id } = parsed.data
  const supabase = await getSupabaseServerClient()

  // Siparisi cek
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, order_items (item_name, item_price, quantity, menu_item_id)')
    .eq('id', order_id)
    .eq('buyer_id', user.id)
    .eq('payment_status', 'pending')
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })

  // Chef sub-merchant key
  const { data: chefProfile } = await supabase
    .from('chef_profiles')
    .select('id, iyzico_sub_merchant_key')
    .eq('id', order.chef_id)
    .single()
  const subMerchantKey = chefProfile?.iyzico_sub_merchant_key ?? null

  // Kullanici bilgisi
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  // Email
  const buyerEmail = user.email ?? `${user.id.slice(0, 8)}@anneelim.com`

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
    buyerId:          user.id,
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

  await supabase.from('orders').update({ iyzico_token: result.token }).eq('id', order.id)

  return NextResponse.json({
    success:               true,
    order_id:              order.id,
    order_number:          order.order_number,
    checkout_form_content: result.content,
    token:                 result.token,
  })
}