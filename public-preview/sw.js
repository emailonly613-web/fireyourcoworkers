/* Fire Your Coworkers PWA shell.
 *
 * Navigations are always network-first so an installed copy does not pin an old HTML
 * build. Same-origin build assets are cached after a successful response. An update
 * may activate immediately when the client sends SKIP_WAITING; install itself does
 * not force activation over a page that is still using the previous worker.
 */

const CACHE_NAMESPACE = "fire-your-coworkers";
const CACHE_VERSION = "shell-v1";
const SHELL_CACHE = `${CACHE_NAMESPACE}-${CACHE_VERSION}`;
const OPTIONAL_SHELL_URLS = [
  "/manifest.webmanifest",
  "/art/elevator-atrium-v1.png",
];
const STATIC_DESTINATIONS = new Set([
  "audio",
  "font",
  "image",
  "script",
  "style",
  "video",
  "worker",
]);

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isCacheable(response) {
  return Boolean(response && response.ok && response.type !== "opaque");
}

function buildAssetUrls(html) {
  const urls = new Set();
  const attributePattern = /(?:src|href)=["']([^"']+)["']/g;
  let match;

  while ((match = attributePattern.exec(html)) !== null) {
    try {
      const url = new URL(match[1], self.location.origin);
      if (isSameOrigin(url) && url.pathname.startsWith("/_next/static/")) {
        urls.add(url.pathname + url.search);
      }
    } catch {
      // A malformed optional asset must not block the known-good shell.
    }
  }

  return [...urls];
}

async function fetchIntoCache(cache, url) {
  try {
    const response = await fetch(new Request(url, { cache: "reload" }));
    if (isCacheable(response)) await cache.put(url, response.clone());
  } catch {
    // Optional resources can be filled by runtime caching on the next online visit.
  }
}

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  const rootResponse = await fetch(new Request("/", { cache: "reload" }));

  if (!isCacheable(rootResponse)) {
    throw new Error("The application shell was unavailable during service worker install.");
  }

  const html = await rootResponse.clone().text();
  await cache.put("/", rootResponse);

  const optionalUrls = [...OPTIONAL_SHELL_URLS, ...buildAssetUrls(html)];
  await Promise.allSettled(optionalUrls.map((url) => fetchIntoCache(cache, url)));
}

async function networkFirstNavigation(event) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const preload = await event.preloadResponse;
    const response =
      preload ||
      (await fetch(new Request(event.request, { cache: "no-cache" })));

    if (isCacheable(response)) {
      await cache.put(event.request, response.clone());
      const url = new URL(event.request.url);
      if (url.pathname === "/") await cache.put("/", response.clone());
    }

    return response;
  } catch {
    return (
      (await cache.match(event.request)) ||
      (await cache.match("/")) ||
      new Response(
        "<!doctype html><title>Fire Your Coworkers</title><h1>Fire Your Coworkers</h1><p>The elevator is offline. Reconnect once to restore the starter level.</p>",
        {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    );
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key.startsWith(`${CACHE_NAMESPACE}-`) && key !== SHELL_CACHE,
              )
              .map((key) => caches.delete(key)),
          ),
        ),
      self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : Promise.resolve(),
    ]).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (event.data?.type === "GET_VERSION" && event.ports?.[0]) {
    event.ports[0].postMessage({ cacheName: SHELL_CACHE });
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isSameOrigin(url) || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    STATIC_DESTINATIONS.has(request.destination)
  ) {
    event.respondWith(cacheFirstStatic(request));
  }
});
