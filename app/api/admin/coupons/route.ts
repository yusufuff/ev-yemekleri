// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ coupons: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ coupons: [], error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code:             body.code,
        description:      body.description || null,
        discount_type:    body.discount_type,
        discount_value:   body.discount_value,
        max_discount:     body.max_discount || null,
        min_order_amount: body.min_order_amount || null,
        max_uses:         body.max_uses || null,
        per_user_limit:   body.per_user_limit || 1,
        expires_at:       body.expires_at || null,
        first_order_only: body.first_order_only ?? false,
        is_active:        body.is_active ?? true,
        used_count:       0,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ coupon: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    const { error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}