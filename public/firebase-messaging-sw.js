importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAx6ILhA87jRATISca0qHk8V8xME9tSxM4',
  authDomain: 'ev-yemekleri-335bb.firebaseapp.com',
  projectId: 'ev-yemekleri-335bb',
  messagingSenderId: '944773361728',
  appId: '1:944773361728:web:8de8aa8d5b22507023efa5'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification || {};
  if (!title) return;
  self.registration.showNotification(title, {
    body: body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: payload.data || {}
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.openWindow(url));
});