// Service worker - cache pro offline mapu osy.
// Verzuj při každé větší změně (změna CACHE_NAME invaliduje cache).
//
// DŮLEŽITÉ: HTML/navigace jde NETWORK-FIRST. Připnutá PWA na iOS si jinak
// drží starý index.html z cache a po pushi neukazuje aktualizaci. Online
// se vždy stáhne čerstvý HTML, offline padá zpět na poslední cache.
var CACHE_NAME = 'martinovice-v0.47-2026-08-13-fcm27';
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

// ── Push notifikace (Web Push / FCM) – sjednoceno se šablonou ──
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {
    try { data = { notification: { title: 'Notifikace', body: event.data.text() } }; } catch(_) {}
  }
  var n = data.notification || {};
  var title = n.title || 'I/16 Martinovice';
  var options = {
    body:    n.body || '',
    icon:    n.icon || './manifest.json',
    badge:   n.badge,
    data:    data.data || {},
    tag:     (data.data && data.data.taskId) || 'stavba-notify',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options).then(function(){
    try{ if(self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge(); }catch(e){}
  }));
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var taskId = event.notification.data && event.notification.data.taskId;
  var url = './' + (taskId ? ('#task=' + encodeURIComponent(taskId)) : '');
  event.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list){
      for(var i=0; i<list.length; i++) {
        var c = list[i];
        if(c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
          c.focus();
          if('navigate' in c) c.navigate(url);
          return;
        }
      }
      if(self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
