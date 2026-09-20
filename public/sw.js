/* HIRUNDU legacy service-worker kill switch.
   Older builds registered /Hirundu1.1-/sw.js. This worker deliberately removes
   those registrations/caches so current GitHub Pages builds always boot from network. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => /hirundu|aracne/i.test(key)).map((key) => caches.delete(key)));
    } catch {}

    try {
      await self.registration.unregister();
    } catch {}

    try {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const scope = new URL(self.registration.scope);
      await Promise.all(clients.filter((client) => {
        const url = new URL(client.url);
        return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
      }).map((client) => client.navigate(client.url).catch(() => undefined)));
    } catch {}
  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
