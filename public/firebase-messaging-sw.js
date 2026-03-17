importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyAx6ILhA87jRATISca0qHk8V8xME9tSxM4",
  projectId: "ev-yemekleri-335bb",
  messagingSenderId: "944773361728",
  appId: "1:944773361728:web:8de8aa8d5b22507023efa5"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'EV YEMEKLERİ', {
    body: body ?? 'Yeni bildiriminiz var.',
    icon: icon ?? '/icons/icon-192.png',
  })
})