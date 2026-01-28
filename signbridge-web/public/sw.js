
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // Bypass service worker for large installer files
    if (e.request.url.endsWith('.dmg')) {
        return;
    }

    e.respondWith(
        fetch(e.request).catch(() => {
            return new Response("Offline mode not implemented yet, but we're working on it!");
        })
    );
});
