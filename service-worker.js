importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_NAME = 'dicoding-cerita-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/3119338.png',
  '/icons/pwa-app-icon.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
];

// Install event: caching manual app shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.error('Cache addAll gagal:', err))
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      )
    )
  );
});

workbox.routing.registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
  })
);

workbox.routing.registerRoute(
  ({ request }) => ['script', 'style', 'image'].includes(request.destination),
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
  })
);

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  console.log('[Service Worker] Push received:', data);

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.message || 'Ada pesan baru.',
    icon: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          if (client.focused || client.visibilityState === 'visible') {
            client.postMessage({
              type: 'PUSH_RECEIVED',
              data: data,
            });
          }
        });
      }),
    ])
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
