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
  if(acik){ acik.remove(); acik = null; }
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') kapat(); });
