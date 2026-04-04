// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Tipler ───────────────────────────────────────────────────────────────────

export type PushPermission = 'default' | 'granted' | 'denied'

interface PWAState {
  isInstalled:    boolean
  isOnline:       boolean
  canInstall:     boolean
  swReady:        boolean
  pushPermission: PushPermission
}

interface PWAActions {
  promptInstall:         () => Promise<boolean>
  requestPushPermission: () => Promise<PushPermission>
  subscribePush:         () => Promise<boolean>
  unsubscribePush:       () => Promise<void>
}

// ─── usePWA ───────────────────────────────────────────────────────────────────

export function usePWA(): PWAState & PWAActions {
  const [isInstalled,    setIsInstalled]    = useState(false)
  const [isOnline,       setIsOnline]       = useState(true)
  const [canInstall,     setCanInstall]     = useState(false)
  const [swReady,        setSwReady]        = useState(false)
  const [pushPermission, setPushPermission] = useState<PushPermission>('default')

  const installPromptRef = useRef<any>(null)

  // ── Başlangıç tespitleri ──────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsInstalled(standalone)

    setIsOnline(navigator.onLine)
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    if ('Notification' in window) {
      setPushPermission(Notification.permission as PushPermission)
    }

    const handleInstall = (e: Event) => {
      e.preventDefault()
      installPromptRef.current = e
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setCanInstall(false)
      installPromptRef.current = null
    })

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstall)
    }
  }, [])

  // ── Service Worker kaydı (sadece sw.js — FCM SW ayrı) ────────────────────

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        setSwReady(true)
        console.log('[PWA] SW kayıtlı:', reg.scope)
        if ('periodicSync' in reg) {
          ;(reg as any).periodicSync.register('check-orders', { minInterval: 12 * 60 * 60 * 1000 })
            .catch(() => {})
        }
      })
      .catch(err => console.error('[PWA] SW hata:', err))
  }, [])

  // ── Ana ekrana ekleme ─────────────────────────────────────────────────────

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPromptRef.current) return false
    installPromptRef.current.prompt()
    const { outcome } = await installPromptRef.current.userChoice
    installPromptRef.current = null
    setCanInstall(false)
    return outcome === 'accepted'
  }, [])

  // ── Push izni ────────────────────────────────────────────────────────────

  const requestPushPermission = useCallback(async (): Promise<PushPermission> => {
    if (!('Notification' in window)) return 'denied'
    const result = await Notification.requestPermission() as PushPermission
    setPushPermission(result)
    return result
  }, [])

  // ── Push abone ol — Firebase FCM kullanır ────────────────────────────────

  const subscribePush = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await requestPushPermission()
      if (permission !== 'granted') return false

      const { initializeApp, getApps } = await import('firebase/app')
      const { getMessaging, getToken, isSupported } = await import('firebase/messaging')

      const supported = await isSupported()
      if (!supported) return false

      const firebaseConfig = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
      const messaging = getMessaging(app)

      // FCM SW'yi kaydet ve token al
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      })

      if (!token) {
        console.warn('[FCM] Token alınamadı')
        return false
      }

      // Token'ı Supabase'e kaydet
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').update({ fcm_token: token } as any).eq('id', user.id)
        console.log('[FCM] Token kaydedildi ✅')
      }

      setPushPermission('granted')
      return true
    } catch (err) {
      console.error('[FCM] Abonelik hatası:', err)
      return false
    }
  }, [requestPushPermission])

  // ── Push aboneliği iptal ──────────────────────────────────────────────────

  const unsubscribePush = useCallback(async (): Promise<void> => {
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').update({ fcm_token: null } as any).eq('id', user.id)
      }
      console.log('[FCM] Abonelik iptal edildi')
    } catch (err) {
      console.error('[FCM] Abonelik iptal hatası:', err)
    }
  }, [])

  return {
    isInstalled, isOnline, canInstall, swReady, pushPermission,
    promptInstall, requestPushPermission, subscribePush, unsubscribePush,
  }
}

// ─── usePushNotification — tekil kullanım için ────────────────────────────────

export function usePushNotification() {
  const { pushPermission, subscribePush, unsubscribePush } = usePWA()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    if (pushPermission === 'granted') {
      await unsubscribePush()
    } else {
      await subscribePush()
    }
    setLoading(false)
  }

  return { pushPermission, toggle, loading }
}