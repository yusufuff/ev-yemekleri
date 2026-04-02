/**
 * Ev Yemekleri Service Worker
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

const CACHE_VERSION = 'ev-yemekleri-v2'
const STATIC_CACHE  = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE     = `${CACHE_VERSION}-api`

const STATIC_ASSETS = ['/', '/offline', '/manifest.json']
const CACHEABLE_APIS = ['/api/discover']

// ─── Firebase ────────────────────────────────────────────────────────────────

firebase.initializeApp({
  apiKey:            "AIzaSyAx6ILhA87jRATISca0qHk8V8xME9tSxM4",
  authDomain:        "ev-yemekleri-335bb.firebaseapp.com",
  projectId:         "ev-yemekleri-335bb",
  storageBucket:     "ev-yemekleri-335bb.firebasestorage.app",
  messagingSenderId: "944773361728",
  appId:             "1:944773361728:web:8de8aa8d5b22507023efa5",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'Ev Yemekleri', {
    body:    body ?? '',
    icon:    icon ?? '/icons/icon-192.png',
    badge:   '/icons/icon-72.png',
    data:    payload.data ?? {},
    tag:     payload.data?.type ?? 'default',
    requireInteraction: payload.data?.type === 'order_pending',
    vibrate: payload.data?.type === 'order_pending' ? [200, 100, 200] : [100],
  })
})

// ─── Kurulum ─────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Aktivasyon ──────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('ev-yemekleri-') && ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.match(/\.(png|jpg|svg|woff2|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (CACHEABLE_APIS.some(p => url.pathname.startsWith(p))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }

  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ─── Stratejiler ─────────────────────────────────────────────────────────────

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
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => cached)
  return cached ?? fetchPromise
}

// ─── Bildirim tıklama ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const { data, action } = event

  const urlMap = {
    order_pending:    '/dashboard',
    order_confirmed:  '/siparislerim',
    order_preparing:  '/siparislerim',
    order_on_way:     '/siparislerim',
    order_delivered:  '/siparislerim',
    new_message:      `/mesajlar?order=${data?.order_id ?? ''}`,
  }

  let targetUrl = urlMap[data?.type] ?? '/'
  if (action === 'approve' && data?.order_id) targetUrl = `/dashboard?approve=${data.order_id}`
  else if (action === 'reject' && data?.order_id) targetUrl = `/dashboard?reject=${data.order_id}`

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})

// ─── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener('sync', event => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncPendingNotifications())
  }
})

async function syncPendingNotifications() {
  try {
    const response = await fetch('/api/notifications/pending', { credentials: 'include' })
    if (response.ok) {
      const { notifications } = await response.json()
      for (const notif of notifications ?? []) {
        await self.registration.showNotification(notif.title, {
          body: notif.body, icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png', data: notif.data, tag: notif.type,
        })
      }
    }
  } catch (err) {
    console.error('[SW] sync failed:', err)
  }
}