const VERSION = "0.2.0";
const CACHE_NAME = `color-mixing-${VERSION}`;
const APP_STATIC_RESOURCES = ["./","./index.html"];

self.addEventListener("install", (e) =>
{
    e.waitUntil((async () =>
    {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(APP_STATIC_RESOURCES);
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", (e) =>
{
    e.waitUntil((async () =>
    {
        const names = await caches.keys();
        await Promise.all(names.map((name) =>
        {
            if (name !== CACHE_NAME)
                return caches.delete(name);
            return;
        }));
        await clients.claim();
    })());
});

self.addEventListener("fetch", (e) =>
{
    if (e.request.mode === "navigate")
    {
        e.respondWith(caches.match("./"));
        return;
    }
    e.respondWith((async () =>
    {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(e.request);
        if (cachedResponse) {
            return cachedResponse;
        }
        const liveResponse = await fetch(e.request);
        if(liveResponse.status===200)
            await cache.put(e.request,liveResponse.clone());
        return liveResponse;
    })());
});
