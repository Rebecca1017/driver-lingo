/* 缓存策略：
 * - 页面和脚本（index.html / logic.js / config.js）走「先网络、后缓存」，
 *   保证每次发新版本，用户刷新就能拿到，不会一直跑旧代码；
 * - 图标等静态资源走「先缓存」；
 * - 翻译引擎的请求是跨域的，完全不拦截。
 */
var CACHE = 'driver-lingo-v3';
var ASSETS = [
  './',
  './index.html',
  './config.js',
  './logic.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   // 翻译接口等外部请求直接放行

  // 页面本身和三个脚本一律先问网络，保证更新能立刻生效
  var freshFirst = req.mode === 'navigate'
    || /\/(index\.html|logic\.js|config\.js|manifest\.webmanifest)$/.test(url.pathname)
    || /\/$/.test(url.pathname);

  if (freshFirst) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          return caches.match('./index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
