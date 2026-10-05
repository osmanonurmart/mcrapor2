// Test sürümünün kendi service worker'ı: hiçbir şey yapmaz.
// Varlık sebebi, ana uygulamanın /mcrapor2/ kapsamındaki service worker'ının
// /mcrapor2/test/ altını da yönetmesini engellemek. Fetch olayı dinlenmediği
// için bütün istekler doğrudan ağa gider; test sürümü hiç önbelleklenmez.
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
