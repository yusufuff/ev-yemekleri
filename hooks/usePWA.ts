// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Tipler ───────────────────────────────────────────────────────────────────

export type PushPermission = 'default' | 'granted' | 'denied'

interface PWAState {
  isInstalled:    boolean   // Standalone modda mı?
  isOnline:       boolean   // Ağ bağlantısı var mı?
  canInstall:     boolean   // Install prompt mevcut mu?
  swReady:        boolean   // Service Worker aktif mi?
  pushPermission: PushPermission
}

interface PWAActions {
  promptInstall:      () => Promise<boolean>
  requestPushPermission: () => Promise<PushPermission>
  subscribePush:      () => Promise<boolean>
  unsubscribePush:    () => Promise<void>
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding    = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64     = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData    = atob(base64)
  return Uint8Array.from(rawData, c => c.charCodeAt(0))
}

// ─── usePWA ──────────────────────────────────────────────────────────────────

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

    // Standalone (kurulu) mod tespiti
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsInstalled(standalone)

    // Ağ durumu
    setIsOnline(navigator.onLine)
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Push izin durumu
    if ('Notification' in window) {
      setPushPermission(Notification.permission as PushPermission)
    }

    // Install prompt yakala
    const handleInstall = (e: Event) => {
      e.preventDefault()
      installPromptRef.current = e
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)

    // Kurulum tamamlandı
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

  // ── Service Worker kaydı ─────────────────────────────────────────────────

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        setSwReady(true)
        console.log('[PWA] SW kayıtlı:', reg.scope)

        // Periyodik sync (destekleniyorsa) — her 12 saatte bir
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

  // ── Push abone ol ─────────────────────────────────────────────────────────

  const subscribePush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    try {
      const permission = await requestPushPermission()
      if (permission !== 'granted') return false

      const reg = await navigator.serviceWorker.ready

      // Mevcut aboneliği kontrol et
      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        if (!vapidKey) {
          console.warn('[PWA] VAPID key eksik')
          return false
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }

      // Sunucuya kaydet
      const res = await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          endpoint: sub.endpoint,
          p256dh:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
          auth:     btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
        }),
      })

      return res.ok
    } catch (err) {
      console.error('[PWA] Push abonelik hatası:', err)
      return false
    }
  }, [requestPushPermission])

  // ── Push aboneliği iptal ──────────────────────────────────────────────────

  const unsubscribePush = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await fetch('/api/push/subscribe', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      })
    }
  }, [])

  return {
    isInstalled, isOnline, canInstall, swReady, pushPermission,
    promptInstall, requestPushPermission, subscribePush, unsubscribePush,
  }
}

// ─── usePushNotification — tekil kullanım için ───────────────────────────────

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
