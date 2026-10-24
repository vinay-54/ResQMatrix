// Firebase Cloud Messaging Service Worker
// Handles push notifications when app/browser tab is closed
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY             || 'YOUR_API_KEY',
  authDomain:        self.FIREBASE_AUTH_DOMAIN         || 'YOUR_AUTH_DOMAIN',
  projectId:         self.FIREBASE_PROJECT_ID          || 'YOUR_PROJECT_ID',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET      || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId:             self.FIREBASE_APP_ID              || 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  const notificationTitle = title || 'ResQMatrix Alert';
  const notificationOptions = {
    body:    body || 'Flood monitoring update',
    icon:    icon || '/icons/icon-192x192.png',
    badge:   '/icons/badge-72x72.png',
    vibrate: data.level === 'CRITICAL' || data.level === 'DANGER'
             ? [200, 100, 200, 100, 200, 100, 200]
             : [200, 100, 200],
    data:    payload.data,
    actions: [
      { action: 'view',    title: 'View Alert' },
      { action: 'dismiss', title: 'Dismiss'    },
    ],
    requireInteraction: ['CRITICAL', 'DANGER', 'SOS'].includes(data.level),
    tag: `resqmatrix-${data.level}-${Date.now()}`,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data      = event.notification.data || {};
  const urlToOpen = data.url || '/user/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
