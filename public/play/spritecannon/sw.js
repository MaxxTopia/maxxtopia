/* Sprite Cannon - PWA service worker (cache-first shell + offline).
   Scope = the directory this file is served from (e.g. /play/spritecannon/).
   Bump CACHE when shipping a new build so clients pull the fresh shell. */
"use strict";
var CACHE = "sprite-cannon-v1";
var SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Don't fail the whole install if one optional asset 404s.
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Navigations: network-first so new deploys win, fall back to cached shell offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        caches.open(CACHE).then(function (c) { c.put(req, res.clone()); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match("index.html") || caches.match("./"); });
      })
    );
    return;
  }

  // Everything else (skins, icons, manifest, cross-origin fonts): stale-while-revalidate.
  e.respondWith(
    caches.match(req).then(function (cached) {
      var fetched = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});
