// Uygulama sürümü.
//
// Bu sayı elle artırılır; olustur.mjs aynı sayıyı v2/surum.json dosyasına
// yazar. Tarayıcı açıkken surum.json'a bakıp sunucudaki sayı büyükse
// güncelleme rozetini gösterir.
export const SURUM = 1;

// Sunucudaki sürümü sorar. Dönen değer: sayı ya da null (bakılamadı).
export async function sunucuSurumu(){
  try{
    const y = await fetch('./surum.json?t=' + Date.now(), {cache:'no-store'});
    if(!y.ok) return null;
    const j = await y.json();
    return typeof j.surum === 'number' ? j.surum : null;
  }catch(e){ return null; }   // çevrimdışı ya da tek dosya sürümü
}

// Önbelleği ve servis çalışanını temizleyip sayfayı yeniden yükler.
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
  }catch(e){ /* temizlenemezse de yeniden yükle */ }
  location.reload();
}
