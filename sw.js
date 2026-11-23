// Keeps a copy of the app's own files on the device, so it opens without a
// connection. Your data isn't stored here: it stays in localStorage.
//
// Network first: when online, every file comes fresh from the site and the
// saved copy is updated, so new versions show up on the next open with no
// version number to bump. With no connection (or a very slow one), the saved
// copy is used instead.

const CACHE = 'prep-tracker-v1';
const NETWORK_TIMEOUT_MS = 3000;

const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'tiers.js',
  'hazards.js',
  'reference.js',
  'shelf-life.js',
  'units.js',
  'calories.js',
  'icons.js',
  'app.js',
  'barcode.js',
  'scan.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Resolves with the network response, or rejects if it fails or takes too long.
function fromNetwork(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS);
    fetch(request).then((response) => {
      clearTimeout(timer);
      resolve(response);
    }, (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const match = await cache.match(request, { ignoreSearch: true });
  if (match) return match;
  // A page load with no saved match (say, a link with a query string) gets the app itself.
  if (request.mode === 'navigate') return cache.match('index.html');
  return undefined;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fromNetwork(request);
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    } catch {
      const saved = await fromCache(request);
      return saved || Response.error();
    }
  })());
});
