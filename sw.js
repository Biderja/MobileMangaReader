// Service Worker for Biderja Manga Reader PWA
const CACHE_NAME = 'biderja-v1.0.0';
const STATIC_CACHE = 'biderja-static-v1';
const DYNAMIC_CACHE = 'biderja-dynamic-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/library.html',
  '/settings.html',
  '/main.js',
  '/supabase-integration.js',
  '/resources/hero-manga.jpg',
  '/manifest.json',
  // External dependencies
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/typed.js/2.0.12/typed.min.js',
  'https://unpkg.com/splitting@1.0.6/dist/splitting.css',
  'https://unpkg.com/splitting@1.0.6/dist/splitting.min.js',
  'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js',
  'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same origin requests - use cache first strategy
    event.respondWith(cacheFirst(request));
  } else if (url.hostname.includes('kimi-web-img.moonshot.cn')) {
    // Manga images - cache with network fallback
    event.respondWith(networkFirst(request));
  } else if (url.hostname.includes('rosybrown-mouse-406916.hostingersite.com')) {
    // API requests from your main website - network first
    event.respondWith(networkFirst(request));
  } else {
    // External resources - try cache first, then network
    event.respondWith(cacheFirst(request));
  }
});

// Cache first strategy - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    
    // Return offline fallback for HTML pages
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    // Return offline image for image requests
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#999">غير متاح دون اتصال</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
  }
}

// Network first strategy - good for API calls and dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response(
      JSON.stringify({ error: 'غير متاح دون اتصال', offline: true }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 503 
      }
    );
  }
}

// Background sync for reading progress
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'reading-progress') {
    event.waitUntil(syncReadingProgress());
  }
});

async function syncReadingProgress() {
  try {
    // Get pending reading progress from IndexedDB or localStorage
    const pendingProgress = localStorage.getItem('pendingReadingProgress');
    
    if (pendingProgress) {
      const progressData = JSON.parse(pendingProgress);
      
      // Send to server when online
      const response = await fetch('https://rosybrown-mouse-406916.hostingersite.com/api/reading-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });
      
      if (response.ok) {
        // Clear pending data
        localStorage.removeItem('pendingReadingProgress');
        console.log('Reading progress synced successfully');
      }
    }
  } catch (error) {
    console.error('Failed to sync reading progress:', error);
  }
}

// Push notifications for new chapters
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'فصل جديد متاح الآن!',
    icon: '/resources/icon-192.png',
    badge: '/resources/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'اقرأ الآن',
        icon: '/resources/read-icon.png'
      },
      {
        action: 'close',
        title: 'أغلق',
        icon: '/resources/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Biderja - فصل جديد!', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle app updates
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync for updates
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContentUpdates());
  }
});

async function syncContentUpdates() {
  try {
    // Check for new manga chapters
    const response = await fetch('https://rosybrown-mouse-406916.hostingersite.com/api/updates');
    const updates = await response.json();
    
    if (updates.newChapters && updates.newChapters.length > 0) {
      // Show notification for new chapters
      await self.registration.showNotification('Biderja - تحديثات جديدة!', {
        body: `${updates.newChapters.length} فصول جديدة متاحة!`,
        icon: '/resources/icon-192.png',
        tag: 'new-chapters'
      });
    }
  } catch (error) {
    console.error('Failed to sync content updates:', error);
  }
}

console.log('Service Worker: Script loaded successfully');