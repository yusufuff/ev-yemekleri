import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient, getCurrentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function adminGuard() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

// ── GET — aşçı listesi (filtreli) ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp     = req.nextUrl.searchParams
  const page   = parseInt(sp.get('page')   ?? '1')
  const limit  = parseInt(sp.get('limit')  ?? '20')
  const status = sp.get('status') ?? 'pending'  // pending | approved | rejected
  const search = sp.get('q')?.trim()
  const from   = (page - 1) * limit

  const supabase = await getSupabaseServerClient()
  let query = supabase
    .from('chef_profiles')
    .select(`
      id, bio, kitchen_types, delivery_types, delivery_radius_km,
      average_rating, total_orders, total_revenue, verification_status,
      is_active, created_at,
      user:users ( id, full_name, phone, avatar_url, created_at ),
      chef_documents ( id, doc_type, file_url, created_at )
    `, { count: 'exact' })
    .eq('verification_status', status)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (search) {
    // users tablosundan arama yapamayız doğrudan join ile; RPC kullanın üretimde
    // Şimdilik kısıtlı çalışır
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chefs: data, total: count, page, limit })
}

// ── PATCH — onayla / reddet / askıya al ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: {
    chef_id: string
    action: 'approve' | 'reject' | 'suspend' | 'unsuspend'
    reason?: string
  } = await req.json()

  const { chef_id, action, reason } = body
  if (!chef_id || !action) return NextResponse.json({ error: 'chef_id and action required' }, { status: 400 })

  const supabase = await getSupabaseServerClient()

  const updateMap: Record<string, object> = {
    approve:   { verification_status: 'approved', is_active: true },
    reject:    { verification_status: 'rejected', is_active: false },
    suspend:   { is_active: false },
    unsuspend: { is_active: true },
  }

  const update = updateMap[action]
  if (!update) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const { error } = await supabase.from('chef_profiles').update(update).eq('id', chef_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aşçıya bildirim gönder
  const { data: chef } = await supabase
    .from('chef_profiles')
    .select('user_id')
    .eq('id', chef_id)
    .single()

  if (chef) {
    const messages: Record<string, string> = {
      approve:   '🎉 Başvurunuz onaylandı! Artık sipariş almaya başlayabilirsiniz.',
      reject:    `Başvurunuz incelendi ve onaylanmadı. ${reason ? `Sebep: ${reason}` : ''}`,
      suspend:   'Hesabınız geçici olarak askıya alındı. Destek için iletişime geçin.',
      unsuspend: 'Hesabınız yeniden aktifleştirildi.',
    }

    // Notifications tablosuna INSERT için service_role gerekiyor (RLS)
    const adminSupabase = await getSupabaseAdminClient()
    await adminSupabase.from('notifications').insert({
      user_id: chef.user_id,
      type:    'chef_' + action,
      title:   action === 'approve' ? 'Başvurunuz Onaylandı!' : 'Hesap Güncelleme',
      body:    messages[action],
      data:    { chef_id, reason },
    }).then(() => {})
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id:    admin.id,
    action:      `admin_chef_${action}`,
    target_id:   chef_id,
    target_type: 'chef_profile',
    metadata:    { reason },
  }).then(() => {})

  const labels: Record<string, string> = {
    approve:   'Aşçı onaylandı',
    reject:    'Başvuru reddedildi',
    suspend:   'Hesap askıya alındı',
    unsuspend: 'Hesap aktifleştirildi',
  }

  return NextResponse.json({ ok: true, message: labels[action] })
}
