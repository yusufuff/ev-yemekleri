// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN || '',
  projectId:         self.FIREBASE_PROJECT_ID || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.FIREBASE_APP_ID || '',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload)
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'EV YEMEKLERİ', {
    body: body ?? 'Yeni bildiriminiz var.',
    icon: icon ?? '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: payload.data,
  })
})