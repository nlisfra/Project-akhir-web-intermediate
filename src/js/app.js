import { initRoutes } from "./routes.js";
import { openDatabase, getAllLocalStories } from "./model/indexedDB.js";
import storyView from "./view/storyView.js";


document.addEventListener("DOMContentLoaded", () => {
  initRoutes();

  window.addEventListener("hashchange", () => {
    initRoutes();
  });
});


// Konversi VAPID key base64 ke Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

function renderCerita(daftarCerita) {
  const container = document.getElementById('cerita-list');
  if (!container) return;
  container.innerHTML = '';

  if (!daftarCerita || daftarCerita.length === 0) {
    container.innerHTML = '<p>Tidak ada cerita.</p>';
    return;
  }

  daftarCerita.forEach(cerita => {
    const el = document.createElement('div');
    el.className = 'cerita-item';
    el.innerHTML = `
      <h3>${cerita.title}</h3>
      <p>${cerita.content}</p>
      <small>${cerita.date}</small>
    `;
    container.appendChild(el);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initRoutes();

  window.addEventListener("hashchange", () => {
    initRoutes();
  });

  await openDatabase();

  if ('serviceWorker' in navigator && 'PushManager' in window) {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker terdaftar:', registration);

    const swReady = await navigator.serviceWorker.ready;
    console.log('Service Worker siap:', swReady);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Izin notifikasi tidak diberikan.');
      return;
    }

    const vapidKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await swReady.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh')
          ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh'))))
          : null,
        auth: subscription.getKey('auth')
          ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          : null,
      },
    };

    const yourAccessToken = localStorage.getItem('token');

    await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${yourAccessToken}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    console.log('Subscription berhasil dikirim ke server Dicoding.');
  } catch (err) {
    console.error('Gagal mendaftar service worker atau push subscription:', err);
  }
}
});