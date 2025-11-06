// ✅ Service Worker — version pour Netlify Blobs
const CACHE_NAME = "pwa-cache-v10"; // incrémente à chaque nouvelle version
const DATA_CACHE = "data-cache-v2";

// 🔗 URL de ton blob JSON (ton endpoint de lecture Netlify)
const DATA_URL = "/.netlify/functions/get-json";

const urlsToCache = [
    "./index.html",
    "./detail.html",
    "./manifest.json",
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
    "./media/edit.png",
    "./favicon.ico",
    "https://fonts.googleapis.com/css2?family=Lekton&display=swap"
];
// Service Worker minimal et sûr : cache-first pour tout, cache-first simple pour get-json.
// Ne pas interférer avec les ressources cross-origin ni le manifest ni autres functions.

function cleanRequest(request) {
    try {
        const url = new URL(request.url);
        url.search = "";
        return new Request(url.toString(), { method: request.method, headers: request.headers });
    } catch (e) {
        return request;
    }
}

self.addEventListener("install", (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME && k !== DATA_CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Laisser le navigateur gérer les ressources externes, le manifest,
    // et toutes les Netlify functions sauf get-json
    if (
        url.origin !== location.origin ||
        url.pathname.endsWith("/manifest.json") ||
        (url.pathname.startsWith("/.netlify/functions/") && !url.pathname.endsWith("/get-json"))
    ) {
        return;
    }

    // get-json : cache-first simple (retourne le cache si présent, sinon réseau et mise en cache)
    if (url.pathname.endsWith(DATA_URL)) {
        event.respondWith((async () => {
            const cache = await caches.open(DATA_CACHE);
            const cached = await cache.match(DATA_URL);
            if (cached) return cached;
            try {
                const resp = await fetch(event.request);
                if (resp && resp.ok) {
                    await cache.put(DATA_URL, resp.clone());
                    return resp;
                }
            } catch (e) {
                // offline or error -> fallthrough to cached (which is null here)
            }
            return cached || Response.error();
        })());
        return;
    }

    // Fichiers statiques : cache-first (stable et simple)
    event.respondWith(
        caches.match(cleanRequest(event.request)).then((resp) => {
            if (resp) return resp;
            return fetch(event.request).then((networkResp) => {
                // mettre en cache les réponses navigables/html/js/css/images pour offline
                if (networkResp && networkResp.ok) {
                    caches.open(CACHE_NAME).then(cache => cache.put(cleanRequest(event.request), networkResp.clone()));
                }
                return networkResp;
            }).catch(() => resp);
        })
    );
});