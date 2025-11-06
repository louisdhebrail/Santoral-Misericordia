// Service Worker minimal et fonctionnel
// - pré-cache de l'app-shell
// - cache-first pour /.netlify/functions/get-json
// - vérification en arrière-plan: compare uniquement le champ "version" du JSON (si présent)
// - n'interfère pas avec les ressources cross-origin, le manifest, ni les autres Netlify functions

const CACHE_NAME = "pwa-cache-v4";
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
    "/favicon.ico",
    "/media/edit.png"
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
                // renvoyer la réponse cache au client (clone pour le client)
                const responseForClient = cached.clone();

                // vérification en arrière-plan : relire le cache via cache.match() pour éviter d'utiliser un Response consommé
                async function checkAndUpdate() {
                    try {
                        const netResp = await fetch(event.request, { cache: "no-store" });
                        if (!netResp || !netResp.ok) return;

                        // préparer clones du réseau : un pour parsing, un pour la mise en cache
                        const netForJson = netResp.clone();
                        const netForCache = netResp.clone();

                        // lire la version côté réseau (si présente)
                        let netVersion;
                        try {
                            const netJson = await netForJson.json();
                            if (netJson && typeof netJson.version !== "undefined") netVersion = netJson.version;
                        } catch (err) {
                            netVersion = undefined;
                        }

                        if (typeof netVersion !== "undefined") {
                            // relire le cache pour obtenir une Response "fraîche" et lire sa version
                            const cachedFresh = await cache.match(DATA_URL);
                            let cachedVersion;
                            if (cachedFresh) {
                                try {
                                    const cachedJson = await cachedFresh.json();
                                    if (cachedJson && typeof cachedJson.version !== "undefined") cachedVersion = cachedJson.version;
                                } catch (err) {
                                    cachedVersion = undefined;
                                }
                            }

                            if (cachedVersion !== netVersion) {
                                await cache.put(DATA_URL, netForCache);
                            }
                            return;
                        }


                    } catch (err) {
                        console.warn("SW: background version check failed", err);
                    }
                }

                event.waitUntil(checkAndUpdate());
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
                    caches.open(CACHE_NAME).then(cache => cache.put(cleanRequest(event.request), networkResp));
                }
                return networkResp;
            }).catch(() => resp);
        })
    );
});