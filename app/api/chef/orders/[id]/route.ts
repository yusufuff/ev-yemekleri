// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['on_way', 'cancelled'],
  on_way:     ['delivered'],
  delivered:  [],
  cancelled:  [],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  // Kullanici girisi zorunlu
  if (!user) {
    return NextResponse.json({ error: 'Giris yapmaniz gerekiyor.' }, { status: 401 })
  }

  const { status } = await req.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Siparisi bul
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status, chef_id')
    .eq('id', params.id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Siparis bulunamadi.' }, { status: 404 })
  }

  // Bu asci bu siparise sahip mi kontrol et
  const { data: chefProfile } = await supabaseAdmin
    .from('chef_profiles')
    .select('id')
    .eq('id', order.chef_id)
    .eq('user_id', user.id)
    .single()

  if (!chefProfile) {
    return NextResponse.json({ error: 'Bu islemi yapma yetkiniz yok.' }, { status: 403 })
  }

  // Gecis gecerli mi kontrol et
  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `${order.status} → ${status} gecisi yapilamaz.` }, { status: 400 })
  }

  // Guncelle
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, status })
}