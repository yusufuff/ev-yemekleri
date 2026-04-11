// @ts-nocheck
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { retrieveCheckoutForm } from '@/lib/iyzico'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function redirect303(url: string, req: NextRequest) {
  const res = NextResponse.redirect(new URL(url, req.url), { status: 303 })
  return res
}

async function handleCallback(token: string, req: NextRequest) {
  if (!token) return redirect303('/odeme/hata?reason=no_token', req)

  const result = await retrieveCheckoutForm(token)

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, buyer_id, chef_id, total_amount')
    .eq('iyzico_token', token)
    .single()

  if (!order) return redirect303('/odeme/hata?reason=order_not_found', req)

  if (!result.success) {
    await supabase.from('orders').update({
      payment_status:      'pending',
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: `iyzico: ${result.error ?? 'Odeme reddedildi'}`,
    }).eq('id', order.id)
    return redirect303(`/odeme/hata?order_id=${order.id}&reason=payment_failed`, req)
  }

  await supabase.from('orders').update({
    payment_status:                'paid',
    status:                        'pending',
    iyzico_payment_id:             result.paymentId,
    iyzico_payment_transaction_id: result.paymentTransactionId ?? null,
  }).eq('id', order.id)

  const { data: chefData } = await supabase
    .from('chef_profiles').select('user_id').eq('id', order.chef_id).single()

  if (chefData?.user_id) {
    await supabase.from('notifications').insert({
      user_id: chefData.user_id,
      type:    'new_order',
      title:   'Yeni Siparis! 🎉',
      message: `#${order.order_number} numarali yeni bir siparis geldi.`,
      data:    { order_id: order.id },
      is_read: false,
    })
  }

  return redirect303(`/siparis-basari?order_id=${order.id}`, req)
}

export async function POST(req: NextRequest) {
  const form  = await req.formData()
  const token = form.get('token')?.toString() ?? ''
  return handleCallback(token, req)
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  return handleCallback(token, req)
}