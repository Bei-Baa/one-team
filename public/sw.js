// ONE TEAM — Service Worker with Secure Caching
// CACHE VERSION (Bumped to v3 for favicon & brand icons update)
const CACHE_NAME = 'oneteam-shell-v3';

// Static assets whitelist (public shell only - no user or API data)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];

// Strictly forbidden patterns (never cache private or dynamic data)
const FORBIDDEN_PATTERNS = [
  /\/auth\/v1\//,       // Supabase Auth endpoints & tokens
  /\/rest\/v1\//,       // Supabase REST database queries
  /\/rpc\//,            // Supabase RPC functions
  /supabase\.co/,       // Any Supabase cloud origin
  /\/api\//,            // Internal API routes
];

// Check if request is safe to cache
function isCacheable(request) {
  // Only GET requests
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);

  // Check forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(url.href) || pattern.test(url.pathname)) {
      return false;
    }
  }

  // Reject chrome-extension or other non-http schemas
  if (!url.protocol.startsWith('http')) {
    return false;
  }

  return true;
}

// 1. Install event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up old shell caches (preserves IndexedDB / user storage completely)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Message handler: Allow app to trigger skipWaiting or cache eviction on logout
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'LOGOUT_PURGE') {
    // On user sign-out, purge all caches to prevent cross-session leaks
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
});

// 4. Fetch event: Stale-While-Revalidate for static shell assets, Network-Only for dynamic data
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // If request contains private API, Auth, Supabase, or POST/PUT/DELETE, pass directly to network
  if (!isCacheable(request)) {
    return;
  }

  // Navigation requests: Network-first with fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Static assets (scripts, stylesheets, fonts, icons)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
