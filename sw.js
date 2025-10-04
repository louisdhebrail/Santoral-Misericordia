// sw.js

const CACHE_NAME = 'pwa-cache-v2';
const urlsToCache = [
    "/Santoral-Misericordia/",
    "/Santoral-Misericordia/index.html",
    "/Santoral-Misericordia/detail.html",
    "/Santoral-Misericordia/manifest.json",
    "/Santoral-Misericordia/data/donnees.json",
    "/Santoral-Misericordia/fonts/nc-extrabold.woff2",
    "/Santoral-Misericordia/fonts/nc-medium.woff2",
    "/Santoral-Misericordia/css/style.css",
    "/Santoral-Misericordia/js/script.js",
    "/Santoral-Misericordia/js/detail.js",
    "/Santoral-Misericordia/media/screenshot-narrow.png",
    "/Santoral-Misericordia/media/screenshot-wide.png",
    "/Santoral-Misericordia/media/web-app-manifest-192x192.png",
    "/Santoral-Misericordia/media/web-app-manifest-512x512.png",
    "/Santoral-Misericordia/media/logomisericordia.png",
    "/Santoral-Misericordia/favicon.ico",
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
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
