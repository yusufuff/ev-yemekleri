/**
 * POST /api/payments/callback
 * Ä°yzico Ã¶deme sonrasÄ± bu URL'e POST eder (form redirect).
 * token parametresiyle gelir.
 *
 * AkÄ±ÅŸ:
 * 1. Ä°yzico'dan token ile sonucu doÄŸrula
 * 2. SipariÅŸi gÃ¼ncelle (payment_status: paid / failed)
 * 3. BaÅŸarÄ±/hata sayfasÄ±na yÃ¶nlendir
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

  // Ä°yzico'da doÄŸrula
  const result = await retrieveCheckoutForm(token)

  // SipariÅŸi token'dan bul
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
    // Ã–deme baÅŸarÄ±sÄ±z â†’ sipariÅŸi gÃ¼ncelle
    await supabase
      .from('orders')
      .update({
        payment_status: 'pending',
        status:         'cancelled',
        cancelled_at:   new Date().toISOString(),
        cancellation_reason: `Ä°yzico: ${result.error ?? 'Ã–deme reddedildi'}`,
      })
      .eq('id', order.id)

    return NextResponse.redirect(
      new URL(`/odeme/hata?order_id=${order.id}&reason=payment_failed`, req.url)
    )
  }

  // BaÅŸarÄ±lÄ± Ã¶deme
  await supabase
    .from('orders')
    .update({
      payment_status:    'paid',
      status:            'pending',          // AÅŸÃ§Ä± onayÄ± bekliyor
      iyzico_payment_id: result.paymentId,
    })
    .eq('id', order.id)

  // AlÄ±cÄ±ya platform kredisi iÅŸle (referral bonus vb.) â€” ileride eklenebilir

  // BaÅŸarÄ± sayfasÄ±na yÃ¶nlendir
  return NextResponse.redirect(
    new URL(`/siparis-basari?order_id=${order.id}`, req.url)
  )
}

/**
 * GET /api/payments/callback
 * BazÄ± konfigÃ¼rasyonlarda Ä°yzico GET ile de dÃ¶nebilir.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/odeme/hata', req.url))
  }

  // POST handler'Ä± simÃ¼le et
  const mockForm = new FormData()
  mockForm.set('token', token)
  const mockReq = new NextRequest(req.url, {
    method: 'POST',
    body: mockForm,
  })
  return POST(mockReq)
}

