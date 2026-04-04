// @ts-nocheck
'use client'
import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

const TYPE_META: Record<string, { icon: string; label: string }> = {
  order_confirmed:     { icon: '✅', label: 'Sipariş Onaylandı'   },
  order_preparing:     { icon: '🍳', label: 'Hazırlanıyor'        },
  order_on_way:        { icon: '🛵', label: 'Yolda'               },
  order_delivered:     { icon: '🎉', label: 'Teslim Edildi'       },
  order_delivered_pending: { icon: '📬', label: 'Teslimat Bekliyor' },
  order_cancelled:     { icon: '❌', label: 'İptal Edildi'        },
  new_order:           { icon: '🛒', label: 'Yeni Sipariş'        },
  new_review:          { icon: '⭐', label: 'Yeni Yorum'          },
  system:              { icon: '📢', label: 'Sistem'              },
}

export default function BildirimlerPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const channelRef = useRef(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { setLoading(false); return }

      const uid = data.user.id
      setUserId(uid)

      // Bildirimleri çek
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(notifs ?? [])
      setLoading(false)

      // Hepsini okundu yap
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', uid)
        .eq('is_read', false)

      // Realtime — yeni bildirim gelince listenin başına ekle
      if (channelRef.current) supabase.removeChannel(channelRef.current)

      channelRef.current = supabase
        .channel(`bildirimler-${uid}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'notifications',
            filter: `user_id=eq.${uid}`,
          },
          async (payload) => {
            const yeni = { ...payload.new, is_read: true }
            setNotifications(prev => [yeni, ...prev])
            // Yeni geleni de okundu yap
            await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('id', yeni.id)
          }
        )
        .subscribe()
    })

    return () => {
      if (channelRef.current) {
        getSupabaseBrowserClient().removeChannel(channelRef.current)
      }
    }
  }, [])

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1)   return 'Az önce'
    if (diffMin < 60)  return `${diffMin} dakika önce`
    if (diffHour < 24) return `${diffHour} saat önce`
    if (diffDay < 7)   return `${diffDay} gün önce`
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>
            🔔 Bildirimler
          </h1>
          {notifications.length > 0 && (
            <span style={{ fontSize: 12, color: '#8A7B6B' }}>
              {notifications.length} bildirim
            </span>
          )}
        </div>

        {/* Realtime aktif göstergesi */}
        {userId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 11, color: '#10B981' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            Canlı bildirimler aktif
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 80, background: 'linear-gradient(90deg,#F5EDD8 25%,#FAF6EF 50%,#F5EDD8 75%)', backgroundSize: '200% 100%', borderRadius: 12, animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 700, color: '#4A2C0E', fontSize: 16, marginBottom: 6 }}>Henüz bildirim yok</div>
            <div style={{ fontSize: 13, color: '#8A7B6B' }}>Sipariş verdiğinde veya güncellemeler olduğunda burada görünecek.</div>
            <Link href="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', background: '#E8622A', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Yemek Sipariş Et
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((notif: any) => {
              const meta = TYPE_META[notif.type] ?? { icon: '🔔', label: 'Bildirim' }
              const href = notif.data?.order_id
                ? `/siparislerim`
                : notif.data?.url ?? null

              const content = (
                <div style={{
                  background: notif.is_read ? 'white' : '#FEF3EC',
                  borderRadius: 12, padding: '14px 16px',
                  boxShadow: '0 2px 8px rgba(74,44,14,0.06)',
                  border: notif.is_read ? '1px solid #E8E0D4' : '1px solid #E8622A',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  cursor: href ? 'pointer' : 'default',
                }}>
                  <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 3 }}>
                      {notif.title || meta.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#8A7B6B', lineHeight: 1.5 }}>
                      {notif.body}
                    </div>
                    <div style={{ fontSize: 11, color: '#B0A090', marginTop: 6 }}>
                      {formatDate(notif.created_at)}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8622A', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              )

              return href ? (
                <Link key={notif.id} href={href} style={{ textDecoration: 'none' }}>
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}