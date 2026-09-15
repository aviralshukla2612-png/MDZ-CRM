/* eslint-disable no-undef */
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Parse configuration from URL query params passed during registration
const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey: urlParams.get("apiKey") || "AIzaSyCjomUMPJkpsUTPS-EaettaqA5R5SPwA64",
  authDomain: urlParams.get("authDomain") || "mdz-crm-d22ee.firebaseapp.com",
  projectId: urlParams.get("projectId") || "mdz-crm-d22ee",
  storageBucket: urlParams.get("storageBucket") || "mdz-crm-d22ee.firebasestorage.app",
  messagingSenderId: urlParams.get("messagingSenderId") || "52311674452",
  appId: urlParams.get("appId") || "1:52311674452:web:1dc1124c06a93912ede7c1",
  measurementId: urlParams.get("measurementId") || "G-1VYH0KMWKR"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'MDZ CRM Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'You have a new update.',
    icon: '/mdz-crm/mdz-logo.jpg',
    badge: '/mdz-crm/mdz-logo.jpg',
    data: {
      url: payload.data?.linkUrl || '/mdz-crm',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/mdz-crm';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL and focus it
      for (const client of windowClients) {
        if (client.url.includes('/mdz-crm') && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
