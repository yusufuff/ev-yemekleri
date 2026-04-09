// @ts-nocheck
/**
 * POST /api/payments/callback
 * İyzico ödeme sonrası bu URL'e POST eder.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { retrieveCheckoutForm } from '@/lib/iyzico'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const form  = await req.formData()
  const token = form.get('token')?.toString()

  if (!token) {
    return NextResponse.redirect(new URL('/odeme/hata?reason=no_token', req.url))
  }

  // İyzico'da doğrula
  const result = await retrieveCheckoutForm(token)

  // Siparişi token'dan bul
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, buyer_id, chef_id, total_amount')
    .eq('iyzico_token', token)
    .single()

  if (!order) {
    return NextResponse.redirect(new URL('/odeme/hata?reason=order_not_found', req.url))
  }

  if (!result.success) {
    await supabase
      .from('orders')
      .update({
        payment_status:  'pending',
        status:          'cancelled',
        cancelled_at:    new Date().toISOString(),
        cancellation_reason: `İyzico: ${result.error ?? 'Ödeme reddedildi'}`,
      })
      .eq('id', order.id)

    return NextResponse.redirect(
      new URL(`/odeme/hata?order_id=${order.id}&reason=payment_failed`, req.url)
    )
  }

  // Başarılı ödeme — payment_transaction_id'yi kaydet (Marketplace approve için lazım)
  await supabase
    .from('orders')
    .update({
      payment_status:                   'paid',
      status:                           'pending',
      iyzico_payment_id:                result.paymentId,
      iyzico_payment_transaction_id:    result.paymentTransactionId,
    })
    .eq('id', order.id)

  // Aşçıya yeni sipariş bildirimi
  const { data: chefData } = await supabase
    .from('chef_profiles')
    .select('user_id')
    .eq('id', order.chef_id)
    .single()

  if (chefData?.user_id) {
    await supabase.from('notifications').insert({
      user_id: chefData.user_id,
      type:    'new_order',
      title:   'Yeni Sipariş! 🎉',
      message: `#${order.order_number} numaralı yeni bir sipariş geldi.`,
      data:    { order_id: order.id },
      is_read: false,
    })
  }

  return NextResponse.redirect(
    new URL(`/siparis-basari?order_id=${order.id}`, req.url)
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/odeme/hata', req.url))

  const mockForm = new FormData()
  mockForm.set('token', token)
  const mockReq = new NextRequest(req.url, { method: 'POST', body: mockForm })
  return POST(mockReq)
}