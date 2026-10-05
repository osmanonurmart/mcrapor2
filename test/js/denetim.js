// Mağaza denetim checklist'i.
//
// Liste sabit (denetim-veri.js); değişen tek şey mağazanın işaretleri.
// İşaretler mağaza bazında tutuluyor ve buluta gidiyor, böylece bölge müdürü
// ve kurucu da aynı durumu görüyor.
import * as U from './util.js';
import * as V from './veri.js';
import { onay } from './pencere.js';
import { DENETIM, TOPLAM_PUAN, maddeId } from './denetim-veri.js';

// secenekler: {duzenlenebilir}
export function denetimEkrani(magazaKey, secenekler = {}){
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const profil = V.profilGetir(magazaKey);
  const kok = U.el(`<div class="denetim-ekran">
    <div class="bolum-ust">
      <h2>${U.esc(DENETIM.baslik)}</h2>
      <span class="alt">${U.esc(profil ? profil.ad : '')} — ${U.esc(DENETIM.giris)}</span>
    </div>
    <div class="denetim-ozet"></div>
    <details class="denetim-genel">
      <summary>Genel kurallar</summary>
      <ul>${DENETIM.genel.map(g => `<li>${U.esc(g)}</li>`).join('')}</ul>
    </details>
    <div class="denetim-liste"></div>
  </div>`);

  const liste = kok.querySelector('.denetim-liste');
  const ozetKutu = kok.querySelector('.denetim-ozet');

  const durum = () => V.denetimGetir(magazaKey);
  const isaretli = id => !!durum().isaretli[id];

  // Bir sorunun eksiği varsa o sorunun puanı "risk altında" sayılır: denetimde
  // kaybedilebilecek puanın üst sınırı.
  function hesapla(){
    const d = durum();
    let madde = 0, biten = 0, riskPuan = 0, eksikSoru = 0;
    DENETIM.gruplar.forEach(g => g.sorular.forEach(s => {
      const tik = s.maddeler.filter((_, i) => d.isaretli[maddeId(s.no, i)]).length;
      madde += s.maddeler.length;
      biten += tik;
      if(tik < s.maddeler.length){ riskPuan += s.puan; eksikSoru++; }
    }));
    return {madde, biten, riskPuan, eksikSoru, tarih: d.tarih};
  }

  function ozetCiz(){
    const h = hesapla();
    const yuzde = h.madde ? Math.round(h.biten / h.madde * 100) : 0;
    ozetKutu.innerHTML = `
      <div class="d-kutu"><span class="d-buyuk">${h.biten}/${h.madde}</span><span class="d-alt">işaretli madde</span></div>
      <div class="d-kutu"><span class="d-buyuk">%${yuzde}</span><span class="d-alt">tamamlanma</span></div>
      <div class="d-kutu ${h.riskPuan ? 'riskli' : 'tamam'}">
        <span class="d-buyuk">${h.riskPuan}</span><span class="d-alt">risk altındaki puan / ${TOPLAM_PUAN}</span></div>
      <div class="d-kutu"><span class="d-buyuk">${h.eksikSoru}</span><span class="d-alt">eksiği olan başlık</span></div>
      <div class="d-kutu genis">
        <span class="d-alt">${h.tarih ? 'son değişiklik ' + U.kisaTarih(new Date(h.tarih)) : 'henüz işaretlenmedi'}</span>
        ${duzenlenebilir ? '<button class="mini tehlike d-sifirla">Yeni denetim — hepsini temizle</button>' : ''}
      </div>`;
    const sifirla = ozetKutu.querySelector('.d-sifirla');
    if(sifirla) sifirla.addEventListener('click', async () => {
      if(!await onay('Yeni denetim',
        'Bütün işaretler temizlenecek ve liste sıfırdan başlayacak.',
        {onayAd:'Temizle', tehlike:true})) return;
      V.denetimYaz(magazaKey, {isaretli:{}, tarih:new Date().toISOString()});
      ciz();
    });
  }

  function ciz(){
    liste.innerHTML = '';
    const d = durum();
    DENETIM.gruplar.forEach(g => {
      const grupPuan = g.sorular.reduce((t,s) => t + s.puan, 0);
      const grupMadde = g.sorular.reduce((t,s) => t + s.maddeler.length, 0);
      const grupTik = g.sorular.reduce((t,s) =>
        t + s.maddeler.filter((_,i) => d.isaretli[maddeId(s.no,i)]).length, 0);
      const blok = U.el(`<details class="d-grup" ${grupTik < grupMadde ? 'open' : ''}>
        <summary>
          <span class="d-harf">${g.harf}</span>
          <span class="d-grup-ad">${U.esc(g.ad)}</span>
          <span class="d-grup-sayac ${grupTik === grupMadde ? 'tamam' : ''}">${grupTik}/${grupMadde}</span>
          <span class="d-grup-puan">${grupPuan} puan</span>
        </summary>
        <div class="d-sorular"></div>
      </details>`);
      const kap = blok.querySelector('.d-sorular');

      g.sorular.forEach(s => {
        const tik = s.maddeler.filter((_,i) => d.isaretli[maddeId(s.no,i)]).length;
        const tam = tik === s.maddeler.length;
        const soru = U.el(`<section class="d-soru ${tam ? 'tamam' : ''}">
          <header class="d-soru-ust">
            <span class="d-no">${s.no}</span>
            <span class="d-soru-metin">${U.esc(s.metin)}</span>
            <span class="d-soru-puan" title="Bu başlıktan kesilebilecek puan">${s.puan}p</span>
            <span class="d-soru-sayac">${tik}/${s.maddeler.length}</span>
          </header>
          <div class="d-maddeler"></div>
          ${s.puanlama ? `<p class="d-puanlama"><b>Puanlama:</b> ${U.esc(s.puanlama)}</p>` : ''}
        </section>`);
        const mKap = soru.querySelector('.d-maddeler');
        s.maddeler.forEach((m, i) => {
          const id = maddeId(s.no, i);
          const satir = U.el(`<div class="d-madde ${isaretli(id) ? 'bitti' : ''}">
            <span class="d-kutucuk">${isaretli(id) ? '✓' : ''}</span>
            <span class="d-madde-metin">${U.esc(m)}</span>
          </div>`);
          if(duzenlenebilir){
            satir.addEventListener('click', () => { V.denetimDegistir(magazaKey, id); ciz(); });
          } else {
            satir.classList.add('kilitli');
          }
          mKap.appendChild(satir);
        });
        kap.appendChild(soru);
      });
      liste.appendChild(blok);
    });
    ozetCiz();
  }

  ciz();
  return kok;
}
