// FuelLog v2.4 — Service Worker (Offline Support)
const CACHE = 'fuellog-v2.4';

// Κατά την εγκατάσταση: cache την αρχική σελίδα
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./','./index.html']))
  );
  self.skipWaiting();
});

// Κατά την ενεργοποίηση: διαγραφή παλιών caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Κατά κάθε request: cache-first με network fallback
self.addEventListener('fetch', e => {
  // Μόνο GET requests
  if (e.request.method !== 'GET') return;
  // Αγνόησε chrome-extension κλπ
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Πάντα κάνε network request για να ανανεώσεις το cache
      const networkReq = fetch(e.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => cached); // Αν δεν υπάρχει internet → επέστρεψε cache

      // Επέστρεψε cache αμέσως αν υπάρχει, αλλιώς περίμενε το network
      return cached || networkReq;
    })
  );
});
