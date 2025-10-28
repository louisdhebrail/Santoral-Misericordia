// sw.js

const CACHE_NAME = 'pwa-cache-v3';
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
                console.log('Fichiers mis en cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Si c'est detail.html, on ignore la query string et on sert la version cache
    if (url.pathname.endsWith('/detail.html')) {
        event.respondWith(
            caches.match('./detail.html')
        );
        return;
    }

    if (url.pathname.endsWith('/index.html')) {
        event.respondWith(
            caches.match('./index.html')
        );
        return;
    }

    // Pour tout le reste, cache-first classique
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

