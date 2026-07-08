// Service worker - cache pro offline mapu osy.
// Verzuj při každé větší změně (změna CACHE_NAME invaliduje cache).
//
// DŮLEŽITÉ: HTML/navigace jde NETWORK-FIRST. Připnutá PWA na iOS si jinak
// drží starý index.html z cache a po pushi neukazuje aktualizaci. Online
// se vždy stáhne čerstvý HTML, offline padá zpět na poslední cache.
var CACHE_NAME = 'martinovice-v0.15-2026-07-07';
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

function isHtmlRequest(req){
  if(req.mode === 'navigate') return true;
  var acc = req.headers.get('accept') || '';
  return acc.indexOf('text/html') !== -1;
}

self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = req.url;

  // Mapové dlaždice a externí JS/CSS – jen network (necachujeme)
  if(url.indexOf('api.mapy.cz') !== -1 ||
     url.indexOf('tile.openstreetmap.org') !== -1 ||
     url.indexOf('services.cuzk.cz') !== -1 ||
     url.indexOf('unpkg.com') !== -1) {
    return; // browser default
  }

  // Data situace (overlay/) – NETWORK-FIRST, ať se po pushi vždy stáhnou čerstvá; offline → cache
  if(url.indexOf('/overlay/') !== -1) {
    e.respondWith(
      fetch(req).then(function(resp){
        if(resp && resp.status === 200 && req.method === 'GET') {
          var cl = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(req, cl); });
        }
        return resp;
      }).catch(function(){ return caches.match(req); })
    );
    return;
  }

  // HTML / navigace – NETWORK-FIRST (čerstvý index.html po pushi), offline → cache
  if(isHtmlRequest(req)) {
    e.respondWith(
      fetch(req).then(function(resp){
        if(resp && resp.status === 200 && req.method === 'GET') {
          var cl = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(req, cl); });
        }
        return resp;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Ostatní statika – cache-first
  e.respondWith(
    caches.match(req).then(function(r){
      return r || fetch(req).then(function(resp){
        if(resp && resp.status === 200 && req.method === 'GET') {
          var cl = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(req, cl); });
        }
        return resp;
      });
    })
  );
});
