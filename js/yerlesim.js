// Notion tarzı serbest yerleşim.
//
// Yerleşim satırlardan oluşur, her satır yan yana duran bloklardan. Bir bloğu
// tutamağından sürükleyip:
//   - başka bloğun soluna/sağına bırakırsan o satıra sütun olarak girer,
//   - üstüne/altına bırakırsan yeni bir satır açılır.
// Sütunlar arasındaki çizgiden çekerek genişlik, bloğun altından çekerek
// yükseklik ayarlanır. Düzen mağaza bazlı saklanır.
import * as V from './veri.js';
import { el } from './util.js';

// Serbest yerleşim şimdilik kapalı: düzen sabit, bloklar taşınmıyor ve
// boyutlandırılmıyor. Açmak için tek yapılacak bunu true yapmak.
export const TASINABILIR = false;

const EN_KUCUK_YUZDE = 12;
const EN_KUCUK_YUKSEKLIK = 80;

// Sabit düzen: üstte hafta seçimi / duyurular / rutin,
// altta iki sütun. Sütunlar "yığın": içindeki bloklar alt alta dizilir ve her
// biri kendi boyu kadar yer kaplar, böylece kısa bloğun altında boşluk kalmaz.
//   sol yığın : mevcut hafta, önceki hafta
//   sağ yığın : dün-bugün özeti, günlük yorum
// Yeni bir panel eklendiğinde burada yoksa en alta kendi satırında görünür.
const VARSAYILAN_DUZEN = [
  {bloklar: [{panel:'hafta', yuzde:34}, {panel:'duyuru', yuzde:28}, {panel:'rutin', yuzde:38}]},
  {bloklar: [{yigin:['haftaSecili','haftaOnceki'], yuzde:71}, {yigin:['ozet','yorum'], yuzde:29}]}
];
// Yığınları tek tek bloklara açar; serbest yerleşim açıkken kullanılır.
function yiginlariAc(satirlar){
  const cikti = [];
  satirlar.forEach(satir => {
    const duz = [];
    satir.bloklar.forEach(b => {
      if(!b.yigin){ duz.push(b); return; }
      b.yigin.forEach((panel, i) => duz.push({panel, yuzde: i === 0 ? b.yuzde : b.yuzde}));
    });
    cikti.push({bloklar: duz});
  });
  return cikti;
}

function duzeniOku(magaza, panelAdlari){
  const kayit = V.yerlesimGetir(magaza);
  // Kilitliyken kullanıcının eski düzeni değil, sabit düzen kullanılır.
  let satirlar = (TASINABILIR && Array.isArray(kayit.satirlar) && kayit.satirlar.length)
    ? JSON.parse(JSON.stringify(kayit.satirlar))
    : JSON.parse(JSON.stringify(VARSAYILAN_DUZEN));

  if(TASINABILIR) satirlar = yiginlariAc(satirlar);

  // Artık olmayan panelleri at.
  satirlar.forEach(s => {
    s.bloklar = (s.bloklar || []).map(b => {
      if(!b.yigin) return b;
      return {...b, yigin: b.yigin.filter(x => panelAdlari.includes(x))};
    }).filter(b => b.yigin ? b.yigin.length : panelAdlari.includes(b.panel));
  });
  satirlar = satirlar.filter(s => s.bloklar.length);

  // Yeni eklenen panelleri en alta koy.
  const yerlesmis = satirlar.flatMap(s => s.bloklar.flatMap(b => b.yigin || [b.panel]));
  panelAdlari.filter(a => !yerlesmis.includes(a))
    .forEach(a => satirlar.push({bloklar: [{panel:a, yuzde:100}]}));

  satirlar.forEach(duzeltYuzdeler);
  return satirlar;
}
function duzeltYuzdeler(satir){
  const toplam = satir.bloklar.reduce((t,b) => t + (Number(b.yuzde) || 0), 0);
  if(!toplam){ satir.bloklar.forEach(b => b.yuzde = 100 / satir.bloklar.length); return; }
  satir.bloklar.forEach(b => b.yuzde = (Number(b.yuzde) || 0) * 100 / toplam);
}

// panelHaritasi: {panelAdi: HTMLElement}, adlar: {panelAdi: 'Görünen ad'}
export function tuvalCiz(panelHaritasi, {magaza, adlar = {}}){
  const panelAdlari = Object.keys(panelHaritasi);
  let satirlar = duzeniOku(magaza, panelAdlari);
  const tuval = el('<div class="tuval"></div>');
  const boyutlar = V.yerlesimGetir(magaza).boyut || {};

  const kaydet = () => {
    const y = V.yerlesimGetir(magaza);
    y.satirlar = satirlar;
    V.yerlesimYaz(magaza, y);
  };

  // Tek bir bloğun sarmalını kurar (başlık + gövde + varsa tutamaklar).
  function blokKur(blok, govde){
    const sarmal = el(`<div class="tuval-blok" data-panel="${blok.panel}"></div>`);
    sarmal.appendChild(el(`<div class="blok-baslik">
      ${TASINABILIR ? '<button class="panel-tut" title="Basılı tutup sürükleyin">⠿</button>' : ''}
      <span class="blok-ad">${adlar[blok.panel] || blok.panel}</span>
    </div>`));
    sarmal.appendChild(govde);
    if(TASINABILIR){
      const b = boyutlar[blok.panel];
      if(b && b.yukseklik) sarmal.style.height = b.yukseklik + 'px';
      sarmal.appendChild(el('<span class="blok-tutamak alt" title="Yükseklik"></span>'));
      sarmal.querySelector('.panel-tut').addEventListener('pointerdown',
        e => tasimayaBasla(e, blok.panel));
      sarmal.querySelector('.blok-tutamak.alt').addEventListener('pointerdown',
        e => yukseklikBasla(e, sarmal, blok.panel));
    }
    return sarmal;
  }

  function ciz(){
    tuval.innerHTML = '';
    satirlar.forEach((satir, si) => {
      const satirEl = el(`<div class="tuval-satir" data-satir="${si}"></div>`);
      satir.bloklar.forEach((blok, bi) => {
        // Yığın: birden çok blok alt alta, sütun gibi davranır.
        if(blok.yigin){
          const yiginEl = el('<div class="tuval-yigin"></div>');
          yiginEl.style.flex = `0 1 ${blok.yuzde}%`;
          blok.yigin.forEach(panelAdi => {
            const g = panelHaritasi[panelAdi];
            if(!g) return;
            yiginEl.appendChild(blokKur({panel:panelAdi}, g, null));
          });
          satirEl.appendChild(yiginEl);
          if(bi < satir.bloklar.length - 1) satirEl.appendChild(el('<div class="tuval-aralik"></div>'));
          return;
        }
        const govde = panelHaritasi[blok.panel];
        if(!govde) return;
        const sarmal = blokKur(blok, govde);
        sarmal.style.flex = `0 1 ${blok.yuzde}%`;
        satirEl.appendChild(sarmal);

        if(TASINABILIR && bi < satir.bloklar.length - 1){
          const ayirac = el('<div class="tuval-ayirac" title="Genişliği ayarla"></div>');
          ayirac.addEventListener('pointerdown', e => genislikBasla(e, satirEl, si, bi));
          satirEl.appendChild(ayirac);
        } else if(bi < satir.bloklar.length - 1){
          satirEl.appendChild(el('<div class="tuval-aralik"></div>'));
        }
      });
      tuval.appendChild(satirEl);
    });
  }

  // ---------- Taşıma ----------
  function tasimayaBasla(e, panelAdi){
    e.preventDefault();
    e.stopPropagation();
    const isaret = el('<div class="birakma-isareti"></div>');
    document.body.appendChild(isaret);
    tuval.classList.add('tasima-modu');
    const kaynak = tuval.querySelector(`.tuval-blok[data-panel="${panelAdi}"]`);
    if(kaynak) kaynak.classList.add('tasiniyor');
    let hedef = null;

    const hareket = ev => {
      hedef = birakmaNoktasi(ev.clientX, ev.clientY, panelAdi);
      if(!hedef){ isaret.style.display = 'none'; return; }
      isaret.style.display = '';
      const r = hedef.kutu;
      if(hedef.yon === 'sol' || hedef.yon === 'sag'){
        isaret.className = 'birakma-isareti dikey';
        isaret.style.left = (window.scrollX + (hedef.yon === 'sol' ? r.left : r.right) - 2) + 'px';
        isaret.style.top = (window.scrollY + r.top) + 'px';
        isaret.style.height = r.height + 'px';
        isaret.style.width = '4px';
      } else {
        isaret.className = 'birakma-isareti yatay';
        isaret.style.left = (window.scrollX + r.left) + 'px';
        isaret.style.top = (window.scrollY + (hedef.yon === 'ust' ? r.top : r.bottom) - 2) + 'px';
        isaret.style.width = r.width + 'px';
        isaret.style.height = '4px';
      }
    };
    const bitir = () => {
      window.removeEventListener('pointermove', hareket);
      window.removeEventListener('pointerup', bitir);
      window.removeEventListener('pointercancel', bitir);
      isaret.remove();
      tuval.classList.remove('tasima-modu');
      if(kaynak) kaynak.classList.remove('tasiniyor');
      if(hedef){ tasi(panelAdi, hedef); kaydet(); ciz(); }
    };
    window.addEventListener('pointermove', hareket);
    window.addEventListener('pointerup', bitir);
    window.addEventListener('pointercancel', bitir);
  }

  // İmlecin üzerindeki bloğu ve hangi kenarına yakın olduğunu bulur.
  function birakmaNoktasi(x, y, kaynakPanel){
    const bloklar = [...tuval.querySelectorAll('.tuval-blok')];
    for(const b of bloklar){
      const r = b.getBoundingClientRect();
      if(x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const solPay = (x - r.left) / r.width;
      const ustPay = (y - r.top) / r.height;
      let yon;
      if(solPay < 0.25) yon = 'sol';
      else if(solPay > 0.75) yon = 'sag';
      else if(ustPay < 0.35) yon = 'ust';
      else yon = 'alt';
      if(b.dataset.panel === kaynakPanel) return null;
      return {panel: b.dataset.panel, yon, kutu: r};
    }
    return null;
  }

  function blokBul(panelAdi){
    for(let si=0; si<satirlar.length; si++){
      const bi = satirlar[si].bloklar.findIndex(b => b.panel === panelAdi);
      if(bi > -1) return {si, bi};
    }
    return null;
  }

  function tasi(kaynakPanel, hedef){
    const k = blokBul(kaynakPanel);
    const h = blokBul(hedef.panel);
    if(!k || !h) return;
    const [tasinan] = satirlar[k.si].bloklar.splice(k.bi, 1);

    // Kaynak satır boşaldıysa kaldır, hedef satırın yeni indeksini düzelt.
    let hedefSatir = h.si;
    if(!satirlar[k.si].bloklar.length){
      satirlar.splice(k.si, 1);
      if(k.si < hedefSatir) hedefSatir--;
    } else {
      duzeltYuzdeler(satirlar[k.si]);
    }
    const hedefBi = satirlar[hedefSatir].bloklar.findIndex(b => b.panel === hedef.panel);

    if(hedef.yon === 'sol' || hedef.yon === 'sag'){
      const satir = satirlar[hedefSatir];
      const komsu = satir.bloklar[hedefBi];
      // Yeni sütun, komşunun yerinden pay alır.
      tasinan.yuzde = komsu.yuzde / 2;
      komsu.yuzde = komsu.yuzde / 2;
      satir.bloklar.splice(hedef.yon === 'sol' ? hedefBi : hedefBi + 1, 0, tasinan);
      duzeltYuzdeler(satir);
    } else {
      tasinan.yuzde = 100;
      satirlar.splice(hedef.yon === 'ust' ? hedefSatir : hedefSatir + 1, 0, {bloklar:[tasinan]});
    }
  }

  // ---------- Genişlik ----------
  function genislikBasla(e, satirEl, si, bi){
    e.preventDefault();
    e.stopPropagation();
    const satir = satirlar[si];
    const sol = satir.bloklar[bi], sag = satir.bloklar[bi+1];
    const toplamPx = satirEl.getBoundingClientRect().width;
    const baslangicX = e.clientX;
    const solY = sol.yuzde, sagY = sag.yuzde;
    satirEl.classList.add('ayarlaniyor');

    const hareket = ev => {
      const fark = (ev.clientX - baslangicX) / toplamPx * 100;
      const yeniSol = Math.max(EN_KUCUK_YUZDE, Math.min(solY + sagY - EN_KUCUK_YUZDE, solY + fark));
      sol.yuzde = yeniSol;
      sag.yuzde = solY + sagY - yeniSol;
      const blokEl = [...satirEl.querySelectorAll('.tuval-blok')];
      blokEl[bi].style.flex = `0 1 ${sol.yuzde}%`;
      blokEl[bi+1].style.flex = `0 1 ${sag.yuzde}%`;
    };
    const bitir = () => {
      satirEl.classList.remove('ayarlaniyor');
      window.removeEventListener('pointermove', hareket);
      window.removeEventListener('pointerup', bitir);
      kaydet();
    };
    window.addEventListener('pointermove', hareket);
    window.addEventListener('pointerup', bitir);
  }

  // ---------- Yükseklik ----------
  function yukseklikBasla(e, sarmal, panelAdi){
    e.preventDefault();
    e.stopPropagation();
    const baslangic = {y:e.clientY, h:sarmal.offsetHeight};
    sarmal.classList.add('boyutlaniyor');
    const hareket = ev => {
      sarmal.style.height = Math.max(EN_KUCUK_YUKSEKLIK, baslangic.h + (ev.clientY - baslangic.y)) + 'px';
    };
    const bitir = () => {
      sarmal.classList.remove('boyutlaniyor');
      window.removeEventListener('pointermove', hareket);
      window.removeEventListener('pointerup', bitir);
      V.yerlesimBoyutYaz(magaza, panelAdi, {yukseklik: sarmal.offsetHeight});
    };
    window.addEventListener('pointermove', hareket);
    window.addEventListener('pointerup', bitir);
  }

  ciz();
  return tuval;
}

export function yerlesimSifirla(magaza){
  V.yerlesimYaz(magaza, {satirlar:[], boyut:{}});
}
