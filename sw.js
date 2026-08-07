/* Sessions service worker.
   Bump VERSION whenever a cached asset changes, or installed phones
   keep serving the old copy. */
const VERSION = 'v4';
const SHELL = 'shell-' + VERSION;
const RUNTIME = 'runtime-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

/* Assets are added one at a time and failures are swallowed. addAll() is
   all or nothing, so a single missing file would leave the app with no
   service worker at all. Exercise images are not listed here: they are
   picked up by the runtime handler below the first time one is shown. */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* The page itself is network-first, so a push goes live on the next load
   instead of being pinned to whatever was cached at install. */
async function pageFirst(req){
  try{
    const fresh = await fetch(req);
    const c = await caches.open(SHELL);
    c.put('./index.html', fresh.clone());
    return fresh;
  }catch(e){
    return (await caches.match('./index.html')) || Response.error();
  }
}

/* Everything else: serve the cached copy at once, refresh it in the
   background. Covers the icons and the Google Fonts CSS and woff2 files,
   which is what makes the app work offline. */
async function staleWhileRevalidate(req, cacheName){
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  const net = fetch(req).then(res => {
    if(res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if(req.mode === 'navigate'){
    e.respondWith(pageFirst(req));
  }else if(sameOrigin && url.pathname.startsWith(new URL('./', self.location).pathname)){
    e.respondWith(staleWhileRevalidate(req, SHELL));
  }else if(isFont){
    e.respondWith(staleWhileRevalidate(req, RUNTIME));
  }
});
