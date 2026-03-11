/**
 * GET /api/conversations
 * GiriÅŸ yapmÄ±ÅŸ kullanÄ±cÄ±nÄ±n konuÅŸma listesini dÃ¶ndÃ¼rÃ¼r.
 * Her konuÅŸma bir order_id'ye baÄŸlÄ±dÄ±r; alÄ±cÄ± â†” aÅŸÃ§Ä± arasÄ±nda.
 * Son mesaj + okunmamÄ±ÅŸ sayÄ±sÄ± hesaplanÄ±r.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })

  const supabase = await getSupabaseServerClient()

  /**
   * MesajlaÅŸÄ±lan sipariÅŸ listesi:
   * KullanÄ±cÄ± ya buyer_id ya chef â†’ chef_profiles.user_id olarak yer alÄ±yor.
   * Her order iÃ§in son mesaj ve okunmamÄ±ÅŸ sayÄ±.
   */
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      created_at,
      buyer_id,
      chef_profiles!inner (
        id,
        users!inner ( id, full_name, avatar_url )
      ),
      users!buyer_id (
        id, full_name, avatar_url
      )
    `)
    .or(`buyer_id.eq.${user.id},chef_profiles.user_id.eq.${user.id}`)
    .not('status', 'eq', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!orders) return NextResponse.json([])

  // Her sipariÅŸ iÃ§in mesaj Ã¶zeti
  const conversations = await Promise.all(
    orders.map(async (order: any) => {
      // Son mesaj
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // OkunmamÄ±ÅŸ sayÄ± (karÅŸÄ± taraftan gelen)
      const { count: unread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      // DiÄŸer tarafÄ± belirle
      const isChef   = order.chef_profiles?.users?.id === user.id
      const otherUser = isChef
        ? order.users                           // AlÄ±cÄ±
        : order.chef_profiles?.users            // AÅŸÃ§Ä±

      return {
        order_id:     order.id,
        order_number: order.order_number,
        order_status: order.status,
        other_user:   otherUser,
        chef_id:      order.chef_profiles?.id,
        is_chef:      isChef,
        last_message: lastMsg ?? null,
        unread_count: unread ?? 0,
      }
    })
  )

  // Mesaj olmayan konuÅŸmalarÄ± filtrele (isteÄŸe baÄŸlÄ±)
  // const withMessages = conversations.filter(c => c.last_message)

  return NextResponse.json(conversations)
}

