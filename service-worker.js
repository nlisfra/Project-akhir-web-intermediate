importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_NAME = 'dicoding-cerita-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json',
  '/icons/3119338.png',
  '/icons/pwa-app-icon.png',
  '/offline.html',
];

// Install - cache app shell
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .catch(err => console.error('[SW] Cache gagal:', err))
  );
});

// Activate - hapus cache lama
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Menghapus cache lama:', name);
            return caches.delete(name);
          }
          return null;
        })
      )
    )
  );
});

// Workbox routing & strategy
if (workbox) {
  console.log('[SW] Workbox berhasil dimuat.');

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // API - Network First
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://story-api.dicoding.dev',
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
    })
  );

  // Static assets - Cache First
  workbox.routing.registerRoute(
    ({ request }) => ['script', 'style', 'image'].includes(request.destination),
    new workbox.strategies.CacheFirst({
      cacheName: 'static-resources',
    })
  );
} else {
  console.warn('[SW] Workbox gagal dimuat.');
}

// Push Notification handler
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: event.data?.text() || 'Notifikasi Baru',
      message: '',
    };
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.message || 'Ada pesan baru.',
    icon: '/icons/pwa-app-icon.png',
    vibrate: [200, 100, 200],
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
            client.postMessage({ type: 'PUSH_RECEIVED', data });
          }
        });
      }),
    ])
  );
});

// Notification click - buka app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Fetch fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate' || 
            (event.request.destination === 'document' &&
            event.request.headers.get('accept')?.includes('text/html'))) {
          return caches.match('/offline.html');
        }

        if (event.request.url.endsWith('.json') || event.request.url.endsWith('manifest.json')) {
          return new Response('{}', {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response('', { status: 200, statusText: 'Offline fallback' });
      });
    })
  );
});