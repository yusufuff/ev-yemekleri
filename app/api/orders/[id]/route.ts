import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Gerçek Supabase güncelleme
  if (user) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, buyer_id')
      .eq('id', params.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
    if (order.buyer_id !== user.id) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })
    if (['delivered', 'cancelled', 'on_way'].includes(order.status)) {
      return NextResponse.json({ error: 'Bu sipariş iptal edilemez.' }, { status: 400 })
    }

    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', params.id)
  }

  return NextResponse.json({ success: true })
}