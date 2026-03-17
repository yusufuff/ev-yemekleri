/**
 * Ev Yemekleri Service Worker
 *
 * Stratejiler:
 *  - Shell (/_next/static, /icons, /fonts) → Cache First
 *  - API istekleri → Network First (offline'da cache fallback)
 *  - Sayfa navigasyonları → Network First (offline'da shell)
 *  - Push bildirimleri → FCM payload ile zengin bildirim
 *  - Background Sync → gönderilemeyen bildirimleri kuyruğa al
 */

const CACHE_VERSION   = 'ev-yemekleri-v1'
const STATIC_CACHE    = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE   = `${CACHE_VERSION}-dynamic`
const API_CACHE       = `${CACHE_VERSION}-api`

// Uygulama kabuğu — her zaman önbelleğe alınan kaynaklar
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',

]

// API endpoint'leri offline cache'e alınır
const CACHEABLE_APIS = [
  '/api/discover',
  '/api/chefs',
]

// ─── Kurulum ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Aktivasyon — eski cache'leri temizle ─────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('ev-yemekleri-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch interceptor ───────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Chrome extension ve non-GET istekleri atla
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // Statik asset'ler → Cache First
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.match(/\.(png|jpg|svg|woff2|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Cacheable API'ler → Stale While Revalidate
  if (CACHEABLE_APIS.some(p => url.pathname.startsWith(p))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }

  // Diğer API istekleri → Network Only (POST, ödeme vb.)
  if (url.pathname.startsWith('/api/')) return

  // Sayfa navigasyonları → Network First (offline'da /offline)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Diğer her şey → Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ─── Strateji fonksiyonları ───────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached ?? new Response('Çevrimdışı', { status: 503 })
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    return await fetch(request)
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return caches.match('/offline')
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache    = await caches.open(cacheName)
  const cached   = await cache.match(request)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => cached)
  return cached ?? fetchPromise
}

// ─── Push Bildirimleri ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Ev Yemekleri', body: event.data.text() }
  }

  const {
    title = 'Ev Yemekleri',
    body  = '',
    icon  =
    badge =
    image,
    data  = {},
    tag,
    actions = [],
  } = payload

  // Bildirim tiplerine göre aksiyon butonları
  const defaultActions = getActionsForType(data.type, data)

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      image,
      data,
      tag:          tag ?? data.type ?? 'default',
      renotify:     true,
      requireInteraction: data.type === 'order_pending',  // Yeni sipariş — interaksiyon gerektirir
      vibrate:      data.type === 'order_pending' ? [200, 100, 200] : [100],
      actions:      actions.length ? actions : defaultActions,
    })
  )
})

function getActionsForType(type, data) {
  switch (type) {
    case 'order_pending':
      return [
        { action: 'approve', title: '✅ Onayla' },
        { action: 'reject',  title: '❌ Reddet' },
      ]
    case 'order_preparing':
    case 'order_on_the_way':
      return [
        { action: 'track', title: '📍 Takip Et' },
      ]
    case 'new_message':
      return [
        { action: 'reply', title: '💬 Yanıtla' },
      ]
    default:
      return []
  }
}

// ─── Bildirim tıklama ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { data, action } = event
  const urlMap = {
    order_pending:    `/dashboard`,
    order_confirmed:  `/siparislerim`,
    order_preparing:  `/siparislerim`,
    order_on_the_way: `/siparislerim`,
    order_delivered:  `/siparislerim`,
    new_message:      `/mesajlar?order=${data?.order_id ?? ''}`,
    chef_approved:    `/dashboard`,
    payout_processing:`/kazanc`,
  }

  let targetUrl = '/'
  if (action === 'approve' && data?.order_id) targetUrl = `/dashboard?approve=${data.order_id}`
  else if (action === 'reject' && data?.order_id) targetUrl = `/dashboard?reject=${data.order_id}`
  else if (action === 'track' && data?.order_id) targetUrl = `/siparislerim`
  else if (action === 'reply' && data?.order_id) targetUrl = `/mesajlar?order=${data.order_id}`
  else targetUrl = urlMap[data?.type] ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Zaten açık pencere varsa odaklan
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Yoksa yeni sekme aç
      return clients.openWindow(targetUrl)
    })
  )
})

// ─── Background Sync — offline sipariş bildirimleri ──────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncPendingNotifications())
  }
})

async function syncPendingNotifications() {
  // IndexedDB'den bekleyen bildirimleri çek ve gönder
  // Gerçek implementasyonda idb kütüphanesi kullanılır
  try {
    const response = await fetch('/api/notifications/pending', {
      credentials: 'include',
    })
    if (response.ok) {
      const { notifications } = await response.json()
      for (const notif of notifications ?? []) {
        await self.registration.showNotification(notif.title, {
          body:  notif.body,
          icon:
          badge:
          data:  notif.data,
          tag:   notif.type,
        })
      }
    }
  } catch (err) {
    console.error('[SW] sync failed:', err)
  }
}

// ─── Periyodik Background Sync (tarayıcı destekliyorsa) ──────────────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-orders') {
    event.waitUntil(syncPendingNotifications())
  }
})

// ─── Firebase Cloud Messaging ─────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

try {
  firebase.initializeApp({
    apiKey:            'AIzaSyAx6ILhA87jRATISca0qHk8V8xME9tSxM4',
    projectId:         'ev-yemekleri-335bb',
    messagingSenderId: '944773361728',
    appId:             '1:944773361728:web:8de8aa8d5b22507023efa5',
  })

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {}
    self.registration.showNotification(title ?? 'EV YEMEKLERİ', {
      body: body ?? 'Yeni bildiriminiz var.',
      icon:
      badge:
      data: payload.data,
    })
  })
} catch (e) {
  console.log('[SW] Firebase init skipped:', e.message)
}