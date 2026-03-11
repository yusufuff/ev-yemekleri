// @ts-nocheck
/**
 * GET /api/orders/[id]
 * Tek bir sipariÅŸin tÃ¼m detaylarÄ±nÄ± dÃ¶ndÃ¼rÃ¼r.
 * RLS: buyer kendi sipariÅŸini, chef kendi restoranÄ±nÄ±n sipariÅŸini gÃ¶rÃ¼r.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      delivery_type,
      subtotal,
      delivery_fee,
      discount_amount,
      credit_used,
      total_amount,
      payment_status,
      notes,
      coupon_code,
      delivery_address,
      created_at,
      confirmed_at,
      preparing_at,
      ready_at,
      on_way_at,
      delivered_at,
      order_items (
        id,
        item_name,
        item_price,
        quantity,
        line_total,
        notes
      ),
      chef_profiles!inner (
        id,
        location_approx,
        avg_rating,
        working_hours,
        users!inner (
          full_name,
          avatar_url,
          phone
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'SipariÅŸ bulunamadÄ±.' }, { status: 404 })
  }

  // Tahmini sÃ¼re (dakika) â€” delivery_type'a ve hazÄ±rlÄ±k sÃ¼resine gÃ¶re
  const estimatedMin = order.delivery_type === 'delivery' ? 30 : 20
  const estimatedMax = order.delivery_type === 'delivery' ? 45 : 30

  return NextResponse.json({
    order,
    estimated_min: estimatedMin,
    estimated_max: estimatedMax,
  })
}



