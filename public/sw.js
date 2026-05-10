// Service Worker for PC Studio PWA
// Handles caching, offline support, and app installation

const CACHE_NAME = 'pcs-v2';
const RUNTIME_CACHE = 'pcs-runtime-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/offline.html',
  '/globals.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Error caching some assets:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  // Force activation of new SW
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different request methods
  if (request.method !== 'GET') {
    return;
  }

  // Determine caching strategy based on asset type
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('_next/data')
  ) {
    // Network-first for API calls
    event.respondWith(networkFirst(request));
  } else if (
    url.pathname.includes('icon-') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.svg')
  ) {
    // Cache-first for images and icons
    event.respondWith(cacheFirst(request));
  } else if (
    url.pathname.includes('_next/static') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else {
    // Stale-while-revalidate for HTML and other content
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      // Check if cached response is valid (not a 404 or error)
      if (cached.status === 200) {
        console.log('[Service Worker] Cache hit:', request.url);
        return cached;
      } else {
        // Remove invalid cached response
        console.log('[Service Worker] Removing invalid cached response:', request.url, cached.status);
        await cache.delete(request);
      }
    }

    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache-first error:', error);
    // Return offline page if available
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Network error, trying cache:', error);
    const cached = await caches.match(request);
    
    if (cached) {
      console.log('[Service Worker] Serving from cache (network failed):', request.url);
      return cached;
    }
    
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Always try to fetch fresh content in background
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  }).catch((error) => {
    if (error instanceof TypeError) {
      console.debug('[Service Worker] Background fetch network error:', error);
    } else {
      console.warn('[Service Worker] Background fetch failed:', error);
    }
    return null; // Return null on fetch failure
  });

  // Return cached version immediately if available, otherwise wait for fetch
  if (cached) {
    console.log('[Service Worker] Serving stale content while revalidating:', request.url);
    // Start background revalidation but don't wait for it
    fetchPromise.then(() => {
      console.log('[Service Worker] Background revalidation completed for:', request.url);
    });
    return cached;
  }

  // No cache available, wait for fetch
  try {
    const response = await fetchPromise;
    if (response) {
      return response;
    }
  } catch (error) {
    console.error('[Service Worker] Stale-while-revalidate fetch error:', error);
  }

  // If everything fails, try to serve from cache one more time
  const fallbackCached = await cache.match(request);
  if (fallbackCached) {
    return fallbackCached;
  }

  // Last resort: serve offline page
  const offlineResponse = await caches.match('/offline.html');
  return offlineResponse || new Response('Offline', { status: 503 });
}

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    // Sync pending orders with server
    console.log('[Service Worker] Syncing orders...');
    // Add your sync logic here
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete('pcs-v1'),
        caches.delete('pcs-runtime-v1'),
        caches.delete(CACHE_NAME),
        caches.delete(RUNTIME_CACHE)
      ]).then(() => {
        console.log('[Service Worker] All caches cleared');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});

console.log('[Service Worker] Loaded and ready');
