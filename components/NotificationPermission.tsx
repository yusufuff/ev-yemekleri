// components/NotificationPermission.tsx
'use client'
// @ts-nocheck
import { useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export default function NotificationPermission() {
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return

        const supabase = getSupabaseBrowserClient() as any
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const supported = await isSupported()
        if (!supported) return

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
        const messaging = getMessaging(app)

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        })

        if (!token) { console.warn('[FCM] Token alınamadı'); return }

        await supabase
          .from('users')
          .update({ fcm_token: token } as any)
          .eq('id', user.id)

        console.log('[FCM] Token kaydedildi ✅')

        onMessage(messaging, payload => {
          const { title, body } = payload.notification ?? {}
          if (!title) return
          new Notification(title, {
            body: body ?? '',
            icon: '/icons/icon-192.png',
          })
        })

      } catch (err) {
        console.error('[FCM] Bildirim hatası:', err)
      }
    }

    const timer = setTimeout(init, 3000)
    return () => clearTimeout(timer)
  }, [])

  return null
}