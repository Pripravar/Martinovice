// Service worker - jednoduchá cache pro offline mapu osy.
// Verzuj při každé větší změně (změna CACHE_NAME invaliduje cache).
var CACHE_NAME = 'martinovice-v0.3-2026-06-02';
var ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){ return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Mapové dlaždice a externí JS/CSS – jen network (necachujeme, aby se nevyplnila kapacita)
  var url = e.request.url;
  if(url.indexOf('api.mapy.cz') !== -1 ||
     url.indexOf('tile.openstreetmap.org') !== -1 ||
     url.indexOf('services.cuzk.cz') !== -1 ||
     url.indexOf('unpkg.com') !== -1) {
    return; // browser default
  }
  // Statika – cache-first
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).then(function(resp){
        if(resp && resp.status === 200 && e.request.method === 'GET') {
          var cl = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, cl); });
        }
        return resp;
      });
    })
  );
});
