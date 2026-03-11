/**
 * GET /api/notifications/pending
 * Service Worker background sync tarafÄ±ndan Ã§aÄŸrÄ±lÄ±r.
 * KullanÄ±cÄ±nÄ±n okunmamÄ±ÅŸ bildirimlerini dÃ¶ner ve okundu olarak iÅŸaretler.
 */
import { NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ notifications: [] })

  const supabase = await getSupabaseServerClient()

  // OkunmamÄ±ÅŸ bildirimleri Ã§ek
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

  // Okundu olarak iÅŸaretle
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ notifications })
}


