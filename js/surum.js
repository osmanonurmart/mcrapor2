// Uygulama sürümü.
//
// ELLE DEĞİŞTİRME. `node olustur.mjs` bu sayıyı commit sayısından üretip
// buraya, sw.js'e ve surum.json'a yazar; her yayında kendiliğinden artar.
// Tarayıcı surum.json'a bakıp sunucudaki sayı büyükse güncelleme rozetini
// gösterir.
export const SURUM = 37;

// Sunucudaki sürümü sorar. Dönen değer: sayı ya da null (bakılamadı).
export async function sunucuSurumu(){
  try{
    const y = await fetch('./surum.json?t=' + Date.now(), {cache:'no-store'});
    if(!y.ok) return null;
    const j = await y.json();
    return typeof j.surum === 'number' ? j.surum : null;
  }catch(e){ return null; }   // çevrimdışı ya da tek dosya sürümü
}

// Güncellenecek dosyaların listesi sw.js içinde zaten duruyor; ikinci bir
// liste tutup ayrı düşmesin diye oradan okunuyor.
async function varlikListesi(){
  try{
    const metin = await fetch('./sw.js?t=' + Date.now(), {cache:'no-store'}).then(r => r.text());
    const liste = [...metin.matchAll(/'(\.\/[^']*)'/g)].map(m => m[1]);
    if(liste.length) return [...new Set(liste)];
  }catch(e){}
  return ['./', './index.html', './css/app.css', './js/app.js'];
}

// Önbelleği ve servis çalışanını temizleyip sayfayı yeniden yükler.
//
// Yalnız servis çalışanını silmek yetmiyordu: GitHub Pages dosyaları
// Cache-Control ile gönderiyor, location.reload() da tarayıcının HTTP
// önbelleğinden okuyor; sürüm numarası artıyor ama kod eski kalıyordu.
// Çözüm, yeniden yüklemeden önce her dosyayı cache:'reload' ile çekmek —
// bu, ağdan alıp HTTP önbelleğindeki kaydı da tazeliyor.
export async function guncelle(){
  try{
    if('serviceWorker' in navigator){
      const kayitlar = await navigator.serviceWorker.getRegistrations();
      await Promise.all(kayitlar.map(k => k.unregister()));
    }
    if(window.caches){
      const adlar = await caches.keys();
      await Promise.all(adlar.map(a => caches.delete(a)));
    }
    const dosyalar = await varlikListesi();
    await Promise.all(dosyalar.map(u => fetch(u, {cache:'reload'}).catch(() => {})));
  }catch(e){ /* temizlenemezse de yeniden yükle */ }
  location.reload();
}
