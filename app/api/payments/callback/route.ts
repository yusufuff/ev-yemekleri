// @ts-nocheck
/**
 * POST /api/payments/callback
 * İyzico ödeme sonrası bu URL'e POST eder (form redirect).
 * token parametresiyle gelir.
 *
 * Akış:
 * 1. İyzico'dan token ile sonucu doğrula
 * 2. Siparişi güncelle (payment_status: paid / failed)
 * 3. Başarı/hata sayfasına yönlendir
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { retrieveCheckoutForm } from '@/lib/iyzico'

export async function POST(req: NextRequest) {
  const form  = await req.formData()
  const token = form.get('token')?.toString()

  if (!token) {
    return NextResponse.redirect(
      new URL('/odeme/hata?reason=no_token', req.url)
    )
  }

  const supabase = await getSupabaseServerClient()

  // İyzico'da doğrula
  const result = await retrieveCheckoutForm(token)

  // Siparişi token'dan bul
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, buyer_id, chef_id, total_amount')
    .eq('iyzico_token', token)
    .single()

  if (!order) {
    return NextResponse.redirect(
      new URL('/odeme/hata?reason=order_not_found', req.url)
    )
  }

  if (!result.success) {
    // Ödeme başarısız â†’ siparişi güncelle
    await supabase
      .from('orders')
      .update({
        payment_status: 'pending',
        status:         'cancelled',
        cancelled_at:   new Date().toISOString(),
        cancellation_reason: `İyzico: ${result.error ?? 'Ödeme reddedildi'}`,
      })
      .eq('id', order.id)

    return NextResponse.redirect(
      new URL(`/odeme/hata?order_id=${order.id}&reason=payment_failed`, req.url)
    )
  }

  // Başarılı ödeme
  await supabase
    .from('orders')
    .update({
      payment_status:    'paid',
      status:            'pending',          // Aşçı onayı bekliyor
      iyzico_payment_id: result.paymentId,
    })
    .eq('id', order.id)

  // Alıcıya platform kredisi işle (referral bonus vb.) "” ileride eklenebilir

  // Başarı sayfasına yönlendir
  return NextResponse.redirect(
    new URL(`/siparis-basari?order_id=${order.id}`, req.url)
  )
}

/**
 * GET /api/payments/callback
 * Bazı konfigürasyonlarda İyzico GET ile de dönebilir.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/odeme/hata', req.url))
  }

  // POST handler'ı simüle et
  const mockForm = new FormData()
  mockForm.set('token', token)
  const mockReq = new NextRequest(req.url, {
    method: 'POST',
    body: mockForm,
  })
  return POST(mockReq)
}


