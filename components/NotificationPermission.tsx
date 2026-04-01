// components/NotificationPermission.tsx
'use client'
// @ts-nocheck
import { useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/client'

export default function NotificationPermission() {
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // FCM token al
        const token = await requestNotificationPermission()
        if (!token) return

        // Token'ı Supabase'e kaydet
        await supabase
          .from('users')
          .update({ fcm_token: token } as any)
          .eq('id', user.id)

        // Uygulama açıkken gelen bildirimleri göster
        onForegroundMessage(payload => {
          const { title, body } = payload.notification ?? {}
          if (!title) return
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
              body: body ?? '',
              icon: '/icons/icon-192.png',
            })
          }
        })
      } catch (err) {
        console.error('Bildirim izni hatası:', err)
      }
    }

    // Sayfa yüklendikten 3 saniye sonra izin iste
    const timer = setTimeout(init, 3000)
    return () => clearTimeout(timer)
  }, [])

  return null
}