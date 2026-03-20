// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function BildirimlerPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { setLoading(false); return }

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(notifs ?? [])

      // Hepsini okundu yap
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', data.user.id)
        .eq('is_read', false)

      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>
          Bildirimler
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#8A7B6B', padding: 40 }}>Yukleniyor...</div>
        ) : notifications.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 700, color: '#4A2C0E', marginBottom: 6 }}>Hic bildirim yok</div>
            <div style={{ fontSize: 13, color: '#8A7B6B' }}>Yeni bildirimler burada gorunecek.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((notif: any) => (
              <div key={notif.id} style={{
                background: notif.is_read ? 'white' : '#FEF3EC',
                borderRadius: 12, padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(74,44,14,0.06)',
                border: notif.is_read ? '1px solid #E8E0D4' : '1px solid #E8622A',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>
                  {notif.type === 'order_confirmed' ? '✅' :
                   notif.type === 'order_preparing' ? '🍳' :
                   notif.type === 'order_on_way' ? '🛵' :
                   notif.type === 'order_delivered' ? '🎉' :
                   notif.type === 'new_order' ? '🛒' : '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 3 }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#8A7B6B', lineHeight: 1.5 }}>
                    {notif.body}
                  </div>
                  <div style={{ fontSize: 11, color: '#B0A090', marginTop: 6 }}>
                    {new Date(notif.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!notif.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8622A', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 13, color: '#E8622A', textDecoration: 'none', fontWeight: 600 }}>
            Ana Sayfaya Don
          </Link>
        </div>
      </div>
    </div>
  )
}