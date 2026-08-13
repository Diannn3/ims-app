/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const STATIC_CACHE = `ims-static-${version}`;
const PUBLIC_PAGE_CACHE = `ims-public-pages-${version}`;
const PRECACHE = [...build, ...files];
const PRECACHE_URLS = new Set(PRECACHE.map((path) => new URL(path, worker.location.origin).pathname));

const OFFLINE_SAFE_PAGE_PREFIXES = ['/', '/map', '/tools/grades', '/services/math-clinic'];
const NEVER_CACHE_PREFIXES = ['/admin', '/staff', '/auth', '/api/admin', '/api/auth'];

function isSameOrigin(url: URL) {
  return url.origin === worker.location.origin;
}

function isNeverCachePath(pathname: string) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isOfflineSafeNavigation(pathname: string) {
  return OFFLINE_SAFE_PAGE_PREFIXES.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

async function cacheFirst(request: Request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirstPublicPage(request: Request) {
  const cache = await caches.open(PUBLIC_PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // The map is the most useful deterministic offline fallback if this exact page
    // has not been visited before.
    const mapFallback = await cache.match('/map');
    if (mapFallback) return mapFallback;
    throw error;
  }
}

worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE);
      await worker.skipWaiting();
    })
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PUBLIC_PAGE_CACHE)
          .map((key) => caches.delete(key))
      );
      await worker.clients.claim();
    })
  );
});

worker.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(url) || isNeverCachePath(url.pathname)) return;

  // Build output and versioned static assets are deterministic and safe to precache.
  if (PRECACHE_URLS.has(url.pathname) || url.pathname.startsWith('/maps/') || url.pathname.startsWith('/brand/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Only explicitly audited public pages are runtime-cached. Academic SSR routes are
  // network-only until the dedicated versioned public snapshot endpoint is added.
  if (request.mode === 'navigate' && isOfflineSafeNavigation(url.pathname)) {
    event.respondWith(networkFirstPublicPage(request));
  }
});
