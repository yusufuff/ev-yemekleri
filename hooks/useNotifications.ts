'use client'
import { useEffect, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/client'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [fcmToken, setFcmToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    const token = await requestNotificationPermission()
    if (token) {
      setFcmToken(token)
      setPermission('granted')
      // Token'ı Supabase'e kaydet
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // @ts-ignore
        await supabase.from('users').update({ fcm_token: token } as any).eq('id', user.id)
      }
    }
  }

  // Foreground mesaj dinle
  useEffect(() => {
    if (permission !== 'granted') return
    onForegroundMessage((payload) => {
      console.log('[FCM] Foreground message:', payload)
      // Toast göster
      const event = new CustomEvent('fcm-message', { detail: payload })
      window.dispatchEvent(event)
    })
  }, [permission])

  return { permission, fcmToken, requestPermission }
}