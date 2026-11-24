// Keeps a copy of the app's own files on the device, so it opens without a
// connection. Your data isn't stored here: it stays in localStorage.
//
// Network first: when online, every file comes fresh from the site and the
// saved copy is updated, so new versions show up on the next open with no
// version number to bump. With no connection (or a very slow one), the saved
// copy is used instead.
//
// The page also asks for an update check each time the app is opened or
// brought back to the screen (see app/update.js). A home-screen app is often
// resumed rather than reloaded, so without this it could keep running an old
// version for days.

const CACHE = 'prep-tracker-v1';
const NETWORK_TIMEOUT_MS = 3000;

const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'tiers.js',
  'hazards.js',
  'go-bag.js',
  'reference.js',
  'shelf-life.js',
  'supply-match.js',
  'household.js',
  'units.js',
  'calories.js',
  'icons.js',
  'app/core.js',
  'app/motion.js',
  'app/hazard-info.js',
  'app/estimates.js',
  'app/nav.js',
  'app/overview.js',
  'app/category.js',
  'app/savings.js',
  'app/render.js',
  'app/low-power.js',
  'app/review.js',
  'app/quick-reference.js',
  'app/grab-list.js',
  'app/go-bag-page.js',
  'app/print.js',
  'app/settings.js',
  'app/item-form.js',
  'app/list-actions.js',
  'app/backup.js',
  'app/welcome.js',
  'app/tip.js',
  'app/update.js',
  'app/main.js',
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

// Copies being saved by the fetch handler. An update check waits for them,
// so a file that just came fresh from the site isn't mistaken for a change.
const saving = new Set();

function save(request, response) {
  const done = caches.open(CACHE)
    .then((cache) => cache.put(request, response))
    .catch(() => {})
    .finally(() => saving.delete(done));
  saving.add(done);
  return done;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      // 'no-cache' asks the site whether the browser's own copy is still
      // current (cheap when it is), so a launch never gets a stale file.
      const response = await fromNetwork(new Request(request, { cache: 'no-cache' }));
      if (response.ok) {
        event.waitUntil(save(request, response.clone()));
      }
      return response;
    } catch {
      const saved = await fromCache(request);
      return saved || Response.error();
    }
  })());
});

// ---------- Update check ----------
// Fetches every app file straight from the site (asking it to confirm, so an
// unchanged file costs very little) and compares each with the saved copy.
// Changed files are only saved once all of them have arrived, so the saved
// copy is never a mix of two versions. Answers { changed, offline }.

async function checkForUpdate() {
  await Promise.all([...saving]);
  let fresh;
  try {
    fresh = await Promise.all(FILES.map(async (file) => {
      const response = await fromNetwork(new Request(file, { cache: 'no-cache' }));
      if (!response.ok) throw new Error(`${file}: ${response.status}`);
      return { file, response, text: await response.clone().text() };
    }));
  } catch {
    return { changed: false, offline: true };
  }
  const cache = await caches.open(CACHE);
  let changed = false;
  for (const { file, response, text } of fresh) {
    const saved = await cache.match(file);
    if (saved && (await saved.text()) === text) continue;
    if (saved) changed = true;
    await cache.put(file, response);
  }
  return { changed, offline: false };
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'check-update' || !event.ports[0]) return;
  event.waitUntil(checkForUpdate()
    .catch(() => ({ changed: false, offline: true }))
    .then((result) => event.ports[0].postMessage(result)));
});
