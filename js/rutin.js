// Haftalık rutin işler: 7 günlük kontrol listesi.
// Liste her hafta aynı kalır (mağazanın rutini), işaretlemeler haftalıktır.
import * as U from './util.js';
import * as V from './veri.js';

export function rutinBlogu(magazaKey, pzt, secenekler = {}){
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const yenile = secenekler.yenile || (()=>{});
  const maddeler = V.rutinGetir(magazaKey);
  const hafta = U.haftaKey(pzt);
  const durum = V.rutinDurumGetir(magazaKey, hafta);
  const gunler = U.haftaGunleri(pzt);
  const bugunStr = U.bugunStr();

  const toplam = maddeler.length;
  const biten = maddeler.filter(m => durum[m.id]).length;

  const kok = U.el(`<section class="rutin-blok" data-panel="rutin">
    <header class="rutin-ust">
      <span class="rutin-sayac ${toplam && biten === toplam ? 'tamam' : ''}">${biten}/${toplam}</span>
    </header>
    <div class="tablo-sar">
      <table class="rutin-tablo">
        <thead><tr>${gunler.map((g,i) =>
          `<th class="${U.dateStr(g) === bugunStr ? 'bugun' : ''}">${U.GUN_KISA[i]}</th>`).join('')}</tr></thead>
        <tbody><tr>${gunler.map((g,i) =>
          `<td class="${U.dateStr(g) === bugunStr ? 'bugun' : ''}" data-gun="${i}"></td>`).join('')}</tr></tbody>
      </table>
    </div>
  </section>`);

  kok.querySelectorAll('td[data-gun]').forEach(hucre => {
    const gun = Number(hucre.dataset.gun);
    maddeler.filter(m => m.gun === gun).forEach(m => {
      const madde = U.el(`<div class="rutin-madde ${durum[m.id] ? 'bitti' : ''}" title="${U.esc(m.metin)}">
        <span class="r-metin">${U.esc(m.metin)}</span>
        ${duzenlenebilir ? '<button class="r-sil" title="Kaldır">✕</button>' : ''}
      </div>`);
      madde.querySelector('.r-metin').addEventListener('click', () => {
        V.rutinDurumDegistir(magazaKey, hafta, m.id);
        yenile();
      });
      // Çift tıklama metni düzenler.
      if(duzenlenebilir){
        madde.querySelector('.r-metin').addEventListener('dblclick', e => {
          e.stopPropagation();
          maddeyiDuzenle(magazaKey, m, yenile);
        });
        madde.querySelector('.r-sil').addEventListener('click', e => {
          e.stopPropagation();
          V.rutinYaz(magazaKey, V.rutinGetir(magazaKey).filter(x => x.id !== m.id));
          yenile();
        });
      }
      hucre.appendChild(madde);
    });
    if(duzenlenebilir){
      const ekle = U.el('<button class="rutin-ekle" title="Bu güne rutin ekle">+</button>');
      ekle.addEventListener('click', () => yeniMadde(magazaKey, gun, hucre, yenile));
      hucre.appendChild(ekle);
    }
  });
  return kok;
}

function yeniMadde(magazaKey, gun, hucre, yenile){
  const girdi = U.el('<input class="rutin-girdi" type="text" placeholder="Rutin adı">');
  hucre.insertBefore(girdi, hucre.querySelector('.rutin-ekle'));
  girdi.focus();
  let bitti = false;
  const bitir = kaydet => {
    if(bitti) return;          // Enter'dan sonra blur da tetikleniyor
    bitti = true;
    const metin = girdi.value.trim();
    if(girdi.parentNode) girdi.remove();
    if(kaydet && metin){
      const liste = V.rutinGetir(magazaKey);
      liste.push({id:'r'+Date.now()+gun, gun, metin});
      V.rutinYaz(magazaKey, liste);
      yenile();
    }
  };
  girdi.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); bitir(true); }
    if(e.key === 'Escape'){ e.preventDefault(); bitir(false); }
  });
  girdi.addEventListener('blur', () => bitir(true));
}

function maddeyiDuzenle(magazaKey, madde, yenile){
  const yeni = prompt('Rutin adı:', madde.metin);
  if(yeni === null) return;
  const liste = V.rutinGetir(magazaKey);
  const k = liste.find(x => x.id === madde.id);
  if(!k) return;
  k.metin = yeni.trim() || k.metin;
  V.rutinYaz(magazaKey, liste);
  yenile();
}
