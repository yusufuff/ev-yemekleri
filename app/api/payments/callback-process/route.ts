// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { retrieveCheckoutForm } from '@/lib/iyzico'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token gerekli', reason: 'no_token' }, { status: 400 })

    const result = await retrieveCheckoutForm(token)

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, buyer_id, chef_id, total_amount')
      .eq('iyzico_token', token)
      .single()

    if (!order) return NextResponse.json({ error: 'Siparis bulunamadi', reason: 'order_not_found' }, { status: 404 })

    if (!result.success) {
      await supabase.from('orders').update({
        payment_status:      'pending',
        status:              'cancelled',
        cancelled_at:        new Date().toISOString(),
        cancellation_reason: `iyzico: ${result.error ?? 'Odeme reddedildi'}`,
      }).eq('id', order.id)
      return NextResponse.json({ error: result.error, reason: 'payment_failed', order_id: order.id }, { status: 400 })
    }

    await supabase.from('orders').update({
      payment_status:                'paid',
      status:                        'pending',
      iyzico_payment_id:             result.paymentId,
      iyzico_payment_transaction_id: result.paymentTransactionId,
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

    return NextResponse.json({ success: true, order_id: order.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, reason: 'server_error' }, { status: 500 })
  }
}