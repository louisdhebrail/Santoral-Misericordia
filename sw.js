// Service Worker minimal et fonctionnel
// - pré-cache de l'app-shell
// - cache-first pour /.netlify/functions/get-json
// - vérification en arrière-plan: compare uniquement le champ "version" du JSON (si présent)
// - n'interfère pas avec les ressources cross-origin, le manifest, ni les autres Netlify functions

const CACHE_NAME = "pwa-cache-v1";
const DATA_CACHE = "data-cache-v1";
const DATA_URL = "/.netlify/functions/get-json";

const urlsToCache = [
    "/",
    "/index.html",
    "/detail.html",
    "/manifest.json",
    "/css/style.css",
    "/js/script.js",
    "/js/detail.js",
    "/fonts/nc-extrabold.woff2",
    "/fonts/nc-medium.woff2",
    "/media/web-app-manifest-192x192.png",
    "/media/web-app-manifest-512x512.png",
    "/media/logomisericordia.png",
    "/favicon.ico"
];

function cleanRequest(request) {
    try {
        const url = new URL(request.url);
        url.search = "";
        return new Request(url.toString(), { method: request.method, headers: request.headers });
    } catch (e) {
        return request;
    }
}

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME && k !== DATA_CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Laisser le navigateur gérer :
    // - ressources cross-origin (blobs, CDN...)
    // - manifest
    // - toutes les Netlify functions sauf get-json
    if (
        url.origin !== location.origin ||
        url.pathname.endsWith("/manifest.json") ||
        (url.pathname.startsWith("/.netlify/functions/") && url.pathname !== DATA_URL)
    ) {
        return;
    }

    // Gestion de get-json : cache-first + vérification en arrière-plan via champ "version"
    if (url.pathname === DATA_URL) {
        event.respondWith((async () => {
            const cache = await caches.open(DATA_CACHE);
            const cached = await cache.match(DATA_URL);

            if (cached) {
                // CLONES : une pour le client, une pour les vérifications
                const responseForClient = cached.clone();
                const responseForCheck = cached.clone();

                // vérification en arrière-plan (utilise responseForCheck)
                async function checkAndUpdate(cachedResp) {
                    try {
                        const netResp = await fetch(event.request, { cache: "no-store" });
                        if (!netResp || !netResp.ok) return;

                        // Lire la version côté réseau (si présente)
                        let netVersion;
                        try {
                            const netJson = await netResp.clone().json();
                            if (netJson && typeof netJson.version !== "undefined") netVersion = netJson.version;
                        } catch (err) {
                            netVersion = undefined;
                        }

                        if (typeof netVersion !== "undefined") {
                            // lire la version côté cache à partir du clone fourni
                            let cachedVersion;
                            try {
                                const cachedJson = await cachedResp.json();
                                if (cachedJson && typeof cachedJson.version !== "undefined") cachedVersion = cachedJson.version;
                            } catch (err) {
                                cachedVersion = undefined;
                            }

                            if (cachedVersion !== netVersion) {
                                await cache.put(DATA_URL, netResp.clone());
                            }
                            return;
                        }

                        // fallback léger : comparer ETag si présent
                        const netEtag = netResp.headers.get("ETag") || netResp.headers.get("etag");
                        const cachedEtag = cachedResp.headers.get("ETag") || cachedResp.headers.get("etag");
                        if (netEtag && cachedEtag && netEtag !== cachedEtag) {
                            await cache.put(DATA_URL, netResp.clone());
                        }
                        // sinon : on ne met pas à jour automatiquement
                    } catch (err) {
                        // silent fail - on garde le cache
                        console.warn("SW: background version check failed", err);
                    }
                }

                // keep SW alive while check runs
                event.waitUntil(checkAndUpdate(responseForCheck));
                return responseForClient;
            }

            // Pas de cache : essayer réseau, mettre en cache si OK
            try {
                const resp = await fetch(event.request);
                if (resp && resp.ok) {
                    const cache = await caches.open(DATA_CACHE);
                    await cache.put(DATA_URL, resp.clone());
                    return resp;
                }
            } catch (e) {
                // offline ou erreur réseau
            }
            return cached || Response.error();
        })());
        return;
    }

    // Fichiers statiques : cache-first simple
    event.respondWith(
        caches.match(cleanRequest(event.request)).then(resp => {
            if (resp) return resp;
            return fetch(event.request).then(networkResp => {
                if (networkResp && networkResp.ok) {
                    caches.open(CACHE_NAME).then(cache => cache.put(cleanRequest(event.request), networkResp.clone()));
                }
                return networkResp;
            }).catch(() => resp);
        })
    );
});