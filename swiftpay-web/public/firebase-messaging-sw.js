importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAsu8suCX_tCN5CB_DgtyPDjz6jIX7q1x0",
  authDomain: "swiftpaya405c.firebaseapp.com",
  projectId: "swiftpaya405c",
  storageBucket: "swiftpaya405c.firebasestorage.app",
  messagingSenderId: "741958846185",
  appId: "1:741958846185:web:8348a6128a085dc29a9278"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var notificationTitle = payload.data && payload.data.title || 'SwiftPay';
  var notificationOptions = {
    body: payload.data && payload.data.body || 'Voc\u00ea tem uma nova notifica\u00e7\u00e3o',
    icon: '/logos/swiftpay-icon-logo.png',
    badge: '/logos/swiftpay-icon-logo.png',
    tag: payload.data && payload.data.notificationId || 'swiftpay-notification',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  var notification = event.notification;
  notification.close();

  var urlToOpen = notification.data && notification.data.actionUrl || '/panel/merchant/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});