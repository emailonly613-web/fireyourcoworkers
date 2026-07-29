/* Fire Your Coworkers — service worker v2.
   LESSON BAKED IN: v1 was cache-first on the app shell, which pinned returning visitors
   to whatever build they first saw. Navigations are now NETWORK-FIRST (cache only as an
   offline fallback); static assets stay cache-first for speed. */
const CACHE = "fyc-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isNav = e.request.mode === "navigate" ||
    (e.request.destination === "document") ||
    /\/(index\.html)?(\?|$)/.test(new URL(e.request.url).pathname + "?");
  if (isNav) {
    // Fresh build always wins; cache is only for offline.
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })));
});
