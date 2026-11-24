// FixPoint service worker: caches the app shell only (HTML, JS, CSS, fonts, icons).
// Never caches data or third-party APIs (maps, address search, postcodes).
const CACHE = 'fixpoint-shell-v1'
const SHELL = ['/', '/admin', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  // Pages: network first, fall back to the cached shell when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(url.pathname.startsWith('/admin') ? '/admin' : '/')))
    return
  }
  // Built files (hashed names): cache first
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.svg')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(e.request, copy))
      return res
    })))
  }
})
