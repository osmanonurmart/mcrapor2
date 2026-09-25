// Çevrimdışı kabuk. Sürüm değişince eski önbellek silinir.
// Sürüm numarası js/surum.js ile birlikte artırılır.
const SURUM = 'mc2-v1';
const DOSYALAR = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './yer-imi.html',
  './css/app.css',
  './js/app.js', './js/util.js', './js/veri.js', './js/hafta.js',
  './js/panel.js', './js/magaza.js', './js/bolge.js', './js/kurucu.js',
  './js/talep.js', './js/yapistir.js', './js/pencere.js', './js/rutin.js',
  './js/yerlesim.js', './js/bulut.js', './js/tema.js', './js/surum.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(adlar => Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  // Sürüm dosyası hiçbir zaman önbellekten verilmez, yoksa güncelleme görünmez.
  if(e.request.url.includes('surum.json')) return;
  // Önce ağ, olmazsa önbellek: geliştirirken bayat dosya kalmasın.
  e.respondWith(
    fetch(e.request)
      .then(y => {
        const kopya = y.clone();
        caches.open(SURUM).then(c => c.put(e.request, kopya)).catch(()=>{});
        return y;
      })
      .catch(() => caches.match(e.request).then(y => y || caches.match('./index.html')))
  );
});
