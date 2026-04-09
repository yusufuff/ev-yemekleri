// @ts-nocheck
/**
 * POST /api/payments/approve
 * Alıcı "Teslim Aldım" bastığında çağrılır.
 * İyzico escrow'daki parayı aşçının sub-merchant hesabına aktarır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { approvePayment } from '@/lib/iyzico'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json()
    if (!order_id) {
      return NextResponse.json({ error: 'order_id gerekli' }, { status: 400 })
    }

    // Siparişi çek
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, payment_status, iyzico_payment_transaction_id, iyzico_payment_id')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
    }

    // Zaten onaylandıysa tekrar yapma
    if (order.payment_status === 'transferred') {
      return NextResponse.json({ success: true, message: 'Zaten aktarıldı' })
    }

    // iyzico_payment_transaction_id yoksa (Marketplace aktif değilse) sadece durumu güncelle
    if (!order.iyzico_payment_transaction_id) {
      await supabase
        .from('orders')
        .update({
          status:         'delivered',
          payment_status: 'transferred',
          delivered_at:   new Date().toISOString(),
        })
        .eq('id', order_id)

      return NextResponse.json({ success: true, message: 'Durum güncellendi (Marketplace aktif değil)' })
    }

    // İyzico Marketplace onayı — escrow → aşçı hesabı
    const approveResult = await approvePayment(order.iyzico_payment_transaction_id)

    if (!approveResult.success) {
      console.error('Approve hatası:', approveResult.error)
      // Approve başarısız olsa bile durumu güncelle (manuel işlem gerekebilir)
      await supabase
        .from('orders')
        .update({
          status:         'delivered',
          payment_status: 'approve_failed',
          delivered_at:   new Date().toISOString(),
        })
        .eq('id', order_id)

      return NextResponse.json({
        success: false,
        error:   approveResult.error,
        message: 'Ödeme transferi başarısız, manuel inceleme gerekiyor'
      }, { status: 502 })
    }

    // Başarılı — siparişi güncelle
    await supabase
      .from('orders')
      .update({
        status:         'delivered',
        payment_status: 'transferred',
        delivered_at:   new Date().toISOString(),
      })
      .eq('id', order_id)

    // Aşçıya bildirim gönder
    const { data: chefData } = await supabase
      .from('orders')
      .select('chef_id, total_amount, order_number, chef_profiles(user_id)')
      .eq('id', order_id)
      .single()

    if (chefData?.chef_profiles?.user_id) {
      await supabase.from('notifications').insert({
        user_id: chefData.chef_profiles.user_id,
        type:    'payout_completed',
        title:   'Ödeme Hesabınıza Aktarıldı! 🎉',
        message: `#${chefData.order_number} siparişin ödemesi iyzico hesabınıza aktarıldı.`,
        data:    { order_id },
        is_read: false,
      })
    }

    return NextResponse.json({ success: true, message: 'Ödeme aşçıya aktarıldı' })

  } catch (e: any) {
    console.error('Approve route hatası:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}