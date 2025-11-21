const CACHE_NAME = 'oraculum-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // On essaie de mettre en cache, mais on ne bloque pas si ça échoue pour les fichiers dynamiques
        return cache.addAll(urlsToCache).catch(err => console.log('Cache error', err));
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Stratégie : Network First (car c'est une app d'IA, on veut du contenu frais), fallback to Cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});