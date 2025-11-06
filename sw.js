// ✅ Service Worker — version pour Netlify Blobs
const CACHE_NAME = "pwa-cache-v12"; // incrémente à chaque nouvelle version
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
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
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

    // get-json : cache-first + vérification en arrière-plan de la "version" JSON
    if (url.pathname.endsWith("/.netlify/functions/get-json")) {
        event.respondWith((async () => {
            const cache = await caches.open(DATA_CACHE);
            const cached = await cache.match(DATA_URL);

            if (cached) {
                // vérification réseau en arrière-plan : mise à jour du cache seulement si version différente
                const checkAndUpdate = (async () => {
                    try {
                        const netResp = await fetch(event.request, { cache: "no-store" });
                        if (!netResp || !netResp.ok) return;

                        // lire la version côté réseau (si présente)
                        let netVersion;
                        try {
                            const netJson = await netResp.clone().json();
                            if (netJson && typeof netJson.version !== "undefined") netVersion = netJson.version;
                        } catch (err) {
                            netVersion = undefined;
                        }

                        if (typeof netVersion !== "undefined") {
                            // lire la version côté cache (si possible)
                            let cachedVersion;
                            try {
                                const cachedJson = await cached.clone().json();
                                if (cachedJson && typeof cachedJson.version !== "undefined") cachedVersion = cachedJson.version;
                            } catch (err) {
                                cachedVersion = undefined;
                            }

                            // si versions différentes -> mettre à jour le cache
                            if (cachedVersion !== netVersion) {
                                await cache.put(DATA_URL, netResp.clone());
                            }
                            return;
                        }

                        // fallback : si pas de champ "version", comparer ETag si disponible
                        const netEtag = netResp.headers.get("ETag") || netResp.headers.get("etag");
                        const cachedEtag = cached.headers.get("ETag") || cached.headers.get("etag");
                        if (netEtag && cachedEtag && netEtag !== cachedEtag) {
                            await cache.put(DATA_URL, netResp.clone());
                        }
                        // sinon : ne rien faire (évite opérations coûteuses)
                    } catch (err) {
                        console.warn("SW: background version check failed", err);
                    }
                })();

                event.waitUntil(checkAndUpdate());
                return cached;
            }

            // Pas de cache : récupérer réseau et mettre en cache si OK
            try {
                const resp = await fetch(event.request);
                if (resp && resp.ok) {
                    const cache = await caches.open(DATA_CACHE);
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