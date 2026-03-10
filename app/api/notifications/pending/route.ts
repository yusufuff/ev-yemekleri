/**
 * GET /api/notifications/pending
 * Service Worker background sync tarafından çağrılır.
 * Kullanıcının okunmamış bildirimlerini döner ve okundu olarak işaretler.
 */
import { NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ notifications: [] })

  const supabase = await getSupabaseServerClient()

  // Okunmamış bildirimleri çek
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, data, created_at')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !notifications?.length) {
    return NextResponse.json({ notifications: [] })
  }

  // Okundu olarak işaretle
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ notifications })
}
