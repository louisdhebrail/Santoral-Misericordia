// sw.js

const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './detail.html',
    './manifest.json',
    './data/donnees.json',
    './fonts/nc-extrabold.woff2',
    './font/nc-medium.woff2',
    './css/style.css',
    './js/script.js',
    './js/detail.js',
    './media/icone.png',

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

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
