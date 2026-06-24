// Service Worker super leve apenas para satisfazer o requisito de instalação PWA.
// Não faz cache offline agressivo para não quebrar a lógica de tempo real do bolão.

const CACHE_NAME = 'bolao-gb-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cacheia apenas o básico (a tela de offline se tivéssemos, ícones, etc)
      // Como o Next.js já lida com muito disso, deixamos simples.
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estratégia Network First, fallback to Cache
  // Queremos os placares sempre atualizados, não queremos servir versão velha
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
