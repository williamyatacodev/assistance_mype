// Service Worker para Asistencia Perú - PWA Offline-First
// Cachea assets estáticos y permite marcación offline con sincronización posterior

const CACHE_NAME = 'asistencia-peru-v1';
const STATIC_ASSETS = [
  '/',
  '/worker/punch',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const API_CACHE_NAME = 'asistencia-api-v1';
const OFFLINE_PUNCH_STORE = 'offline-punches';

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: estrategia Cache First para assets, Network First para API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // API routes: Network First con fallback a cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  // Assets estáticos: Cache First
  if (request.method === 'GET') {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  // POST/PUT/DELETE: intentar red, guardar para sincronización si falla
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
});

// Estrategia Cache First para assets
async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fallback para páginas HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}

// Estrategia Network First para API
async function networkFirstThenCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Network First con guardado offline para mutaciones
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Guardar request para sincronización posterior
    if (request.method === 'POST' && request.url.includes('/api/attendance/punch')) {
      await saveOfflinePunch(request);
      return new Response(JSON.stringify({ 
        success: true, 
        offline: true, 
        message: 'Marcación guardada offline. Se sincronizará al recuperar conexión.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
}

// Guardar punch offline en IndexedDB (simulado con cache por simplicidad)
async function saveOfflinePunch(request) {
  try {
    const body = await request.clone().text();
    const punchData = {
      body,
      timestamp: Date.now(),
      url: request.url,
    };
    
    const cache = await caches.open(API_CACHE_NAME);
    const key = `offline-punch-${Date.now()}`;
    await cache.put(key, new Response(JSON.stringify(punchData)));
    console.log('[SW] Punch guardado offline:', key);
  } catch (error) {
    console.error('[SW] Error guardando punch offline:', error);
  }
}

// Sincronización periódica (background sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-punches') {
    event.waitUntil(syncOfflinePunches());
  }
});

async function syncOfflinePunches() {
  const cache = await caches.open(API_CACHE_NAME);
  const keys = await cache.keys();
  const offlinePunches = keys.filter((req) => req.url.includes('offline-punch-'));

  for (const key of offlinePunches) {
    try {
      const response = await cache.match(key);
      const data = await response.json();
      
      const syncResponse = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data.body,
      });

      if (syncResponse.ok) {
        await cache.delete(key);
        console.log('[SW] Punch sincronizado:', key);
      }
    } catch (error) {
      console.error('[SW] Error sincronizando punch:', error);
    }
  }
}

// Notificar a clientes cuando hay conexión
self.addEventListener('online', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'ONLINE' });
    });
  });
  // Intentar sincronizar
  syncOfflinePunches();
});