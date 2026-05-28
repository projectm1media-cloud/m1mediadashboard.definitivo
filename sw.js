const CACHE = 'm1media-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación: guarda los archivos clave en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: borra cachés antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para la app, cache-first para assets estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase y peticiones externas: siempre red (no cachear)
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis')) {
    return;
  }

  // App shell: network-first con fallback a caché
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Resto de assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
