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

messaging.onBackgroundMessage((_payload) => {
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow('/'));
  });
});
