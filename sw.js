// ✅ Service Worker — version pour Netlify Blobs
const CACHE_NAME = "pwa-cache-v11"; // incrémente à chaque nouvelle version
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

    // get-json : cache-first mais vérifie en arrière-plan si la version a changé
    if (url.pathname.endsWith(DATA_URL)) {
        event.respondWith((async () => {
            const cache = await caches.open(DATA_CACHE);
            const cached = await cache.match(DATA_URL);

            if (cached) {
                // Vérification réseau en arrière-plan : compare ETag / version / texte
                const checkAndUpdate = (async () => {
                    try {
                        const netResp = await fetch(event.request, { cache: "no-store" });
                        if (!netResp || !netResp.ok) return;

                        // Comparaison via champ "version" dans le JSON
                        let needUpdate = true;
                        try {
                            const [netJson, cachedJson] = await Promise.all([netResp.clone().json(), cached.clone().json()]);
                            if (netJson && cachedJson && netJson.version && cachedJson.version && netJson.version === cachedJson.version) {
                                needUpdate = false;
                            }
                        } catch (err) {
                            // Fallback : comparaison texte brute
                            try {
                                const [netText, cachedText] = await Promise.all([netResp.clone().text(), cached.clone().text()]);
                                if (netText === cachedText) needUpdate = false;
                            } catch (err2) {
                                // si tout échoue, on considère qu'il y a eu un changement
                            }
                        }

                        if (needUpdate) {
                            await cache.put(DATA_URL, netResp.clone());
                        }
                    } catch (err) {
                        // fail silently, on garde le cache existant
                        console.warn("SW: background check failed", err);
                    }
                })();

                // garder le SW vivant pendant la vérif
                event.waitUntil(checkAndUpdate());
                return cached;
            }

            // pas de cache : tenter le réseau et mettre en cache si ok
            try {
                const resp = await fetch(event.request);
                if (resp && resp.ok) {
                    await cache.put(DATA_URL, resp.clone());
                    return resp;
                }
            } catch (e) {
                // offline ou erreur -> fallback
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