// sw.js

const CACHE_NAME = 'pwa-cache-v4'; // ← Change la version à chaque update du SW
const urlsToCache = [
    "./index.html",
    "./detail.html",
    "./manifest.json",
    "./data/donnees.json",
    "./fonts/nc-extrabold.woff2",
    "./fonts/nc-medium.woff2",
    "./css/style.css",
    "./js/script.js",
    "./js/detail.js",
    "./media/screenshot-narrow.png",
    "./media/screenshot-wide.png",
    "./media/web-app-manifest-192x192.png",
    "./media/web-app-manifest-512x512.png",
    "./media/logomisericordia.png",
    "./favicon.ico",
    "https://fonts.googleapis.com/css2?family=Lekton&display=swap"
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Mise en cache initiale...');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    // 🔥 Nettoyer les anciens caches
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
        ).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 🧠 Normalisation : ignorer les paramètres pour certaines ressources
    if (url.pathname.endsWith('/data/donnees.json')) {
        // Crée une requête sans ?v=... pour chercher dans le cache
        const cleanRequest = new Request('./data/donnees.json');

        event.respondWith(
            caches.match(cleanRequest).then((cachedResponse) => {
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse.ok) {
                            // 🔄 Mettre à jour le cache avec la nouvelle version
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(cleanRequest, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse); // Si offline → renvoyer la version cache

                // 🪄 Si on a un cache, on le renvoie immédiatement
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 🔁 Pour les pages HTML, ignorer les paramètres aussi
    if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/detail.html')) {
        event.respondWith(caches.match(`.${url.pathname}`));
        return;
    }

    // 🧱 Comportement par défaut : cache-first
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
