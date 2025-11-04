// ✅ Service Worker — version améliorée
const CACHE_NAME = "pwa-cache-v6"; // incrémente cette version quand tu modifies ton site
const DATA_CACHE = "data-cache-v1";
const DATA_URL = "/data/donnees.json";

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

// 🪄 Helper : supprimer les paramètres d’URL
function cleanRequest(request) {
    const url = new URL(request.url);
    url.search = ""; // enlève tout ce qui est après le "?"
    return new Request(url.toString(), { method: request.method, headers: request.headers });
}

// 🏗️ Installation : précache de base
self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("📦 Mise en cache initiale...");
            return cache.addAll(urlsToCache);
        })
    );
});

// 🚀 Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// 📡 Gestion des requêtes
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // 🔹 Cas 1 : données dynamiques (donnees.json)
    if (url.pathname.endsWith("/data/donnees.json")) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(DATA_CACHE);
                const cachedResponse = await cache.match(DATA_URL);

                try {
                    const networkResponse = await fetch(event.request);
                    const freshData = await networkResponse.clone().json();

                    if (cachedResponse) {
                        const oldData = await cachedResponse.clone().json();

                        if (oldData.version !== freshData.version) {
                            console.log("🔄 Nouvelle version détectée :", freshData.version);
                            await cache.put(DATA_URL, networkResponse.clone());

                            // ✅ Notifie toutes les pages ouvertes
                            const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
                            clientsList.forEach((client) => {
                                client.postMessage({ type: "UPDATE_AVAILABLE" });
                            });
                        } else {
                            console.log("✅ Version inchangée :", oldData.version);
                        }
                    } else {
                        console.log("🆕 Première mise en cache des données");
                        await cache.put(DATA_URL, networkResponse.clone());
                    }

                    return networkResponse;
                } catch (err) {
                    console.warn("⚠️ Offline — données depuis le cache");
                    return cachedResponse;
                }
            })()
        );
        return;
    }


    // 🔹 Cas 2 : fichiers statiques (ignore les paramètres d’URL)
    if (
        url.origin === location.origin &&
        (url.pathname.endsWith(".html") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".woff2") ||
            url.pathname.endsWith(".ico"))
    ) {
        const clean = cleanRequest(event.request);
        event.respondWith(
            caches.match(clean).then((response) => response || fetch(event.request))
        );
        return;
    }

    // 🔹 Cas 3 : comportement par défaut
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
