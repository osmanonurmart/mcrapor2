// Basit kalıcı pencere (modal).
import { el } from './util.js';

let acik = null;
export function pencere(baslik, govde, dugmeler = []){
  kapat();
  const kok = el(`<div class="pencere-katman">
    <div class="pencere">
      <header><h2>${baslik}</h2><button class="pencere-kapat" title="Kapat">✕</button></header>
      <div class="pencere-govde"></div>
      <footer class="pencere-alt"></footer>
    </div>
  </div>`);
  kok.querySelector('.pencere-govde').appendChild(govde);
  const alt = kok.querySelector('.pencere-alt');
  dugmeler.forEach(d => {
    const b = el(`<button class="mini ${d.sinif || ''}">${d.ad}</button>`);
    b.addEventListener('click', () => d.tik());
    alt.appendChild(b);
  });
  kok.querySelector('.pencere-kapat').addEventListener('click', kapat);
  kok.addEventListener('click', e => { if(e.target === kok) kapat(); });
  document.body.appendChild(kok);
  acik = kok;
  return kok;
}
export function kapat(){
  if(acik){
    const k = acik;
    acik = null;
    // Söz döndüren pencereler (onay/soru) kapanışı böyle duyuyor; Escape ya da
    // dışına tıklama da iptal sayılsın diye.
    k.dispatchEvent(new CustomEvent('pencere-kapandi'));
    k.remove();
  }
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') kapat(); });

// ---------------- Onay / soru pencereleri ----------------
// Tarayıcının confirm/prompt kutuları yerine siteyle aynı görünen,
// söz (Promise) döndüren pencereler. Escape ve dışına tıklama = iptal.
export function onay(baslik, mesaj, secenekler = {}){
  return new Promise(coz => {
    let verildi = false;
    const bitir = deger => { if(verildi) return; verildi = true; kapat(); coz(deger); };
    const govde = el(`<div class="onay-govde">${
      String(mesaj).split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
    }</div>`);
    const kok = pencere(baslik, govde, [
      {ad: secenekler.iptalAd || 'Vazgeç', tik: () => bitir(false)},
      {ad: secenekler.onayAd || 'Devam',
       sinif: secenekler.tehlike ? 'tehlike' : 'birincil',
       tik: () => bitir(true)}
    ]);
    kok.querySelector('.pencere-kapat').addEventListener('click', () => bitir(false));
    kok.addEventListener('click', e => { if(e.target === kok) bitir(false); });
    kok.addEventListener('pencere-kapandi', () => bitir(false));
    kok.querySelectorAll('.pencere-alt .mini')[1].focus();
  });
}

export function soru(baslik, mesaj, secenekler = {}){
  return new Promise(coz => {
    let verildi = false;
    const bitir = deger => { if(verildi) return; verildi = true; kapat(); coz(deger); };
    const govde = el(`<div class="onay-govde">
      ${String(mesaj || '').split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
      <input class="onay-girdi" type="${secenekler.tur || 'text'}"
             placeholder="${secenekler.yerTutucu || ''}" value="${secenekler.varsayilan || ''}">
    </div>`);
    const girdi = govde.querySelector('.onay-girdi');
    const kok = pencere(baslik, govde, [
      {ad: 'Vazgeç', tik: () => bitir(null)},
      {ad: secenekler.onayAd || 'Tamam', sinif:'birincil', tik: () => bitir(girdi.value)}
    ]);
    girdi.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); bitir(girdi.value); }
    });
    kok.querySelector('.pencere-kapat').addEventListener('click', () => bitir(null));
    kok.addEventListener('click', e => { if(e.target === kok) bitir(null); });
    kok.addEventListener('pencere-kapandi', () => bitir(null));
    setTimeout(() => { girdi.focus(); girdi.select(); }, 30);
  });
}
