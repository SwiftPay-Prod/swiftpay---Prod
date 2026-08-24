importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAsu8suCX_tCN5CB_DgtyPDjz6jIX7q1x0',
  authDomain: 'swiftpaya405c.firebaseapp.com',
  projectId: 'swiftpaya405c',
  storageBucket: 'swiftpaya405c.firebasestorage.app',
  messagingSenderId: '741958846185',
  appId: '1:741958846185:web:8348a6128a085dc29a9278',
});

const messaging = firebase.messaging();

// ── Base PWA install/offline shell ─────────────────────────────
const SW_VERSION = 'swiftpay-pwa-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SW_VERSION).then((cache) => cache.addAll([OFFLINE_URL, '/manifest.json', '/logos/pwa-icon-192.png', '/logos/pwa-icon-512.png']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Navigation fallback to offline shell when network fails
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});

// ── Push (background) — full data routing lands in T2 ──────────
messaging.onBackgroundMessage((payload) => {
  const data = payload.data ?? {};
  const title = payload.notification?.title ?? data.title ?? 'SwiftPay';
  const body = payload.notification?.body ?? data.body ?? '';
  const actionUrl = data.actionUrl || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/logos/pwa-icon-192.png',
    badge: '/logos/notification-small.png',
    tag: data.tag || 'swiftpay',
    data: { url: actionUrl },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
