/**
 * POST /api/push/subscribe  — push aboneliği kaydet / FCM token güncelle
 * DELETE /api/push/subscribe — aboneliği sil
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/server'

// Web Push için opsiyonel — firebase-admin kuruluysa aktif olur
// import { getMessaging } from 'firebase-admin/messaging'
// import { initFirebaseAdmin } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: {
    // Web Push (tarayıcı)
    endpoint?: string
    p256dh?:   string
    auth?:     string
    // FCM (React Native / Firebase)
    fcm_token?: string
  } = await req.json()

  const supabase = await getSupabaseServerClient()

  // FCM token güncelle (mobil / Firebase)
  if (body.fcm_token) {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: body.fcm_token })
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, type: 'fcm' })
  }

  // Web Push aboneliği kaydet
  if (body.endpoint) {
    // push_subscriptions tablosuna kaydet (migration'a eklenebilir)
    // Şimdilik users tablosundaki fcm_token alanına endpoint'i yazıyoruz
    // Production'da ayrı bir tablo önerilir
    const { error } = await supabase
      .from('users')
      .update({
        fcm_token: JSON.stringify({
          type:     'web-push',
          endpoint: body.endpoint,
          p256dh:   body.p256dh,
          auth:     body.auth,
        }),
      })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, type: 'web-push' })
  }

  return NextResponse.json({ error: 'endpoint veya fcm_token gerekli' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getSupabaseServerClient()
  await supabase.from('users').update({ fcm_token: null }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
