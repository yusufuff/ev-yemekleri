import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient, getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function adminGuard() {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'admin') return null
  return user
}

// â”€â”€ GET â€” Ã¶deme talepleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(req: NextRequest) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp     = req.nextUrl.searchParams
  const status = sp.get('status') ?? 'pending'
  const page   = parseInt(sp.get('page') ?? '1')
  const limit  = 20
  const from   = (page - 1) * limit

  const supabase = await getSupabaseServerClient()
  const { data, count, error } = await supabase
    .from('payouts')
    .select(`
      id, chef_id, amount, status, iban_snapshot,
      created_at, processed_at,
      chef:chef_profiles (
        user:users ( full_name, phone )
      )
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payouts: data, total: count, page, limit })
}

// â”€â”€ PATCH â€” onayla / reddet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function PATCH(req: NextRequest) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { payout_id, action }: { payout_id: string; action: 'approve' | 'reject' } = await req.json()
  if (!payout_id || !action) return NextResponse.json({ error: 'payout_id and action required' }, { status: 400 })

  const supabase = await getSupabaseServerClient()

  if (action === 'approve') {
    // GerÃ§ek Ä°yzico payout API'si burada Ã§aÄŸrÄ±lÄ±r
    // Åimdilik durumu gÃ¼ncelle
    const { error } = await supabase
      .from('payouts')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', payout_id)
      .eq('status', 'pending')  // sadece bekleyenleri

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // AÅŸÃ§Ä±ya bildirim
    const { data: payout } = await supabase
      .from('payouts')
      .select('chef_id, amount, chef_profiles(user_id)')
      .eq('id', payout_id)
      .single()

    if (payout) {
      const userId = (payout as any).chef_profiles?.user_id
      if (userId) {
        // Notifications INSERT iÃ§in service_role gerekiyor (RLS)
        const adminSupabase = await getSupabaseAdminClient()
        await (adminSupabase as any).from('notifications').insert({
          user_id: userId,
          type:    'payout_processing',
          title:   'Ã–deme Ä°ÅŸleme AlÄ±ndÄ±',
          body:    `â‚º${payout.amount.toLocaleString('tr-TR')} tutarÄ±ndaki Ã¶deme talebiniz onaylandÄ± ve iÅŸleme alÄ±ndÄ±.`,
          data:    { payout_id },
        }).then(() => {})
      }
    }

    await (supabase as any).from('audit_logs').insert({
      actor_id: admin.id, action: 'admin_approve_payout',
      target_id: payout_id, target_type: 'payout',
    }).then(() => {})

    return NextResponse.json({ ok: true, message: 'Ã–deme iÅŸleme alÄ±ndÄ±' })
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('payouts')
      .update({ status: 'failed' })
      .eq('id', payout_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Bakiyeyi geri yÃ¼kle
    const { data: payout } = await supabase
      .from('payouts')
      .select('chef_id, amount')
      .eq('id', payout_id)
      .single()

    if (payout) {
      // chef_profiles.pending_payout_amount azalt, bakiyeye geri ekle
      // Bu iÅŸlem production'da transaction ile yapÄ±lmalÄ±
    }

    await (supabase as any).from('audit_logs').insert({
      actor_id: admin.id, action: 'admin_reject_payout',
      target_id: payout_id, target_type: 'payout',
    }).then(() => {})

    return NextResponse.json({ ok: true, message: 'Ã–deme talebi reddedildi' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}


