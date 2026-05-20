// IMPORTANTE: O handler de notificationclick DEVE vir ANTES de importar o Firebase
// Caso contrário, o FCM substitui o comportamento personalizado
// Ref: https://firebase.google.com/docs/cloud-messaging/web/receive-messages?hl=pt-br

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl;
  const urlToOpen = actionUrl || '/panel/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (actionUrl) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Agora sim, importar o Firebase após registrar o handler personalizado
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAsu8suCX_tCN5CB_DgtyPDjz6jIX7q1x0",
  authDomain: "safefypay-a405c.firebaseapp.com",
  projectId: "safefypay-a405c",
  storageBucket: "safefypay-a405c.firebasestorage.app",
  messagingSenderId: "741958846185",
  appId: "1:741958846185:web:8348a6128a085dc29a9278"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // onBackgroundMessage só é chamado quando o app está em background/fechado
  // Payload agora vem via 'data' ao invés de 'notification' para evitar duplicação automática
  const notificationTitle = payload.data?.title || 'Safefy';

  const notificationOptions = {
    body: payload.data?.body || '',
    icon: '/logos/safefy-icon-logo.png',
    badge: '/logos/safefy-icon-logo.png',
    tag: payload.data?.notificationId || 'safefy-notification',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.priority === 'High' || payload.data?.priority === 'Urgent',
    actions: payload.data?.actionUrl ? [
      {
        action: 'open',
        title: payload.data?.actionLabel || 'Ver detalhes'
      }
    ] : []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
