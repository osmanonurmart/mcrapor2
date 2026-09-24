// Haftalık KPI tablosu: 9 sütun (KPI + 7 gün + Formüller).
import * as U from './util.js';
import * as V from './veri.js';

export const KPI_TANIM = [
  {id:'ciro',  ad:'Ciro',           tur:'para',    formul:'degisim',   ipucu:'Geçen haftaya göre değişim'},
  {id:'mdo',   ad:'MDO',            tur:'yuzde',   formul:'ortalama',  ipucu:'Haftalık ortalama'},
  {id:'fbu',   ad:'FBÜ',            tur:'ondalik', formul:'ortalama',  ipucu:'Haftalık ortalama'},
  {id:'mgs',   ad:'MGS',            tur:'tam',     formul:'toplamOrt', ipucu:'Toplam ve günlük ortalama'},
  {id:'fbs',   ad:'FBS',            tur:'para',    formul:'ortalama',  ipucu:'Haftalık ortalama'},
  {id:'hedef', ad:'Hedef',          tur:'para',    formul:'toplam',    ipucu:'Haftalık toplam hedef'},
  {id:'oran',  ad:'Oran',           tur:'yuzde',   formul:'oran',      ipucu:'Hafta toplamı / hafta hedefi', hesaplanan:true},
  {id:'toplu', ad:'Toplu Satışlar', tur:'tam',     formul:'toplam',    ipucu:'Haftalık toplam'},
  // Kaynak sayfada var; kurucu panelinden açılabilir, varsayılanda kapalı.
  {id:'urunAdedi',    ad:'Ürün Adedi',   tur:'tam', formul:'toplam', ipucu:'Haftalık toplam'},
  {id:'faturaSayisi', ad:'Fatura Sayısı',tur:'tam', formul:'toplam', ipucu:'Haftalık toplam'}
];

function bicim(tur, deger){
  if(deger === null || deger === undefined || deger === '') return '';
  if(tur === 'para')    return U.fmtSayi(deger, 0);
  if(tur === 'yuzde')   return U.fmtSayi(deger, 1);
  if(tur === 'ondalik') return U.fmtSayi(deger, 2);
  return U.fmtSayi(deger, 0);
}

// Günlük hedef: elle girilmişse o, yoksa haftalık hedefin yedide biri.
export function gunlukHedef(magaza, pzt, kayit){
  if(kayit && kayit.hedef !== null && kayit.hedef !== undefined && kayit.hedef !== '') return Number(kayit.hedef);
  const haftalik = V.haftaHedefGetir(magaza, pzt);
  return haftalik ? Math.round(haftalik / 7) : null;
}

// gunSiniri verilirse yalnızca haftanın ilk o kadar günü hesaba katılır.
// Yarım haftayı geçen haftanın tamamıyla kıyaslamamak için kullanılır.
export function haftaOzeti(magaza, pzt, gunSiniri){
  const tumKayitlar = V.haftaKayitlari(magaza, pzt);
  const kayitlar = gunSiniri ? tumKayitlar.slice(0, gunSiniri) : tumKayitlar;
  const ciroToplam = U.toplam(kayitlar.map(k => U.sayi(k.ciro)));
  // Hedef ve oran her zaman haftanın tamamı üzerinden.
  const hedefToplam = V.haftaHedefGetir(magaza, pzt)
    || U.toplam(tumKayitlar.map(k => gunlukHedef(magaza, pzt, k)));
  const gecen = V.haftaKayitlari(magaza, U.haftaEkle(pzt, -1));
  // Yarım hafta tam haftayla kıyaslanmasın: bu haftada veri girilen gün sayısı
  // kadar gün, geçen haftadan da baştan alınır.
  const doluGun = kayitlar.filter(k => U.sayi(k.ciro) !== null).length;
  const gecenEs = doluGun ? gecen.slice(0, doluGun) : gecen;
  return {
    kayitlar,
    ciroToplam,
    hedefToplam,
    doluGun,
    oran: (U.toplam(tumKayitlar.map(k => U.sayi(k.ciro))) !== null && hedefToplam)
      ? U.toplam(tumKayitlar.map(k => U.sayi(k.ciro))) / hedefToplam * 100 : null,
    gecenCiro: U.toplam(gecenEs.map(k => U.sayi(k.ciro))),
    gecenTamCiro: U.toplam(gecen.map(k => U.sayi(k.ciro))),
    mdoOrt: U.ortalama(kayitlar.map(k => U.sayi(k.mdo))),
    fbuOrt: U.ortalama(kayitlar.map(k => U.sayi(k.fbu))),
    fbsOrt: U.ortalama(kayitlar.map(k => U.sayi(k.fbs))),
    mgsToplam: U.toplam(kayitlar.map(k => U.sayi(k.mgs))),
    topluToplam: U.toplam(kayitlar.map(k => U.sayi(k.toplu)))
  };
}

function formulHucresi(kpi, magaza, pzt, ozet){
  switch(kpi.formul){
    case 'degisim': {
      const d = U.yuzdeDegisim(ozet.gecenCiro, ozet.ciroToplam);
      const yarim = ozet.doluGun > 0 && ozet.doluGun < 7;
      return {
        metin: U.fmtDegisim(d) + (yarim ? ' (ilk ' + ozet.doluGun + ' gün)' : ''),
        sinif: U.degisimSinifi(d)
      };
    }
    case 'ortalama': {
      const harita = {mdo: ozet.mdoOrt, fbu: ozet.fbuOrt, fbs: ozet.fbsOrt};
      const v = harita[kpi.id];
      return {metin: v === null ? '–' : 'ort ' + bicim(kpi.tur, v), sinif:''};
    }
    case 'toplamOrt': {
      const ort = U.ortalama(ozet.kayitlar.map(k => U.sayi(k.mgs)));
      return {metin: (ozet.mgsToplam === null ? '–' : U.fmtSayi(ozet.mgsToplam,0)) + ' / ort ' + (ort === null ? '–' : U.fmtSayi(ort,0)), sinif:''};
    }
    case 'toplam': {
      const v = kpi.id === 'hedef'
        ? ozet.hedefToplam
        : U.toplam(ozet.kayitlar.map(k => U.sayi(k[kpi.id])));
      return {metin: v === null ? '–' : U.fmtSayi(v, 0), sinif:''};
    }
    case 'oran':
      return {metin: ozet.oran === null ? '–' : U.fmtYuzde(ozet.oran, 0), sinif: ozet.oran >= 100 ? 'artis' : ''};
    default:
      return {metin:'', sinif:''};
  }
}

// secenekler: {duzenlenebilir, izinDuzenle}
export function haftaTablosu(magazaKey, pzt, secenekler = {}){
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const gunler = U.haftaGunleri(pzt);
  const ozet = haftaOzeti(magazaKey, pzt);
  const bugunStr = U.bugunStr();
  const gorunur = V.satirAyariGetir();
  const kpiler = KPI_TANIM.filter(k => gorunur.includes(k.id));
  const personel = V.personelGetir(magazaKey);

  const kok = U.el(`<section class="hafta-blok" data-hafta="${U.haftaKey(pzt)}">
    <header class="hafta-ust">
      <div class="hafta-hedef">
        <span class="etiket">Hedef</span>
        <input class="hedef-girdi" type="text" inputmode="numeric" value="${ozet.hedefToplam ?? ''}" ${duzenlenebilir?'':'disabled'}>
        <span class="oran-rozet ${ozet.oran >= 100 ? 'artis' : (ozet.oran !== null && ozet.oran < 80 ? 'dusus' : '')}">${ozet.oran === null ? '–' : U.fmtYuzde(ozet.oran, 0)}</span>
      </div>
      <div class="hafta-urun">
        <button class="mini" data-urun="gecen">Geçen H.</button>
        <button class="mini" data-urun="bu">Bu H.</button>
      </div>
    </header>
    <div class="tablo-sar">
      <table class="hafta-tablo"><thead></thead><tbody></tbody></table>
    </div>
  </section>`);

  // --- Başlık satırı ---
  const thead = kok.querySelector('thead');
  const tr = document.createElement('tr');
  tr.appendChild(U.el('<th class="kpi-sutun">KPI</th>'));
  gunler.forEach((g, i) => {
    const tarih = U.dateStr(g);
    const kayit = ozet.kayitlar[i] || {};
    const izinler = kayit.izinler || [];
    const etiket = izinler.length
      ? izinler.map(z => V.personelAdi(magazaKey, z.personelId) + ' · ' + z.tur).join(', ')
      : 'İzinli yok';
    const th = U.el(`<th class="${tarih === bugunStr ? 'bugun' : ''}">
      <span class="gun-ad">${U.GUN_KISA[i]}${kayit.kesin ? '<span class="gun-kesin" title="Kapanmış gün, veri kesin">✓</span>' : ''}</span>
      <span class="gun-tarih">${U.kisaTarih(g)}</span>
      <button class="izin-btn ${izinler.length ? 'dolu' : ''}" data-tarih="${tarih}" title="${U.esc(etiket)}">${izinler.length ? U.esc(etiket.split(',')[0]) : 'İzin ▾'}</button>
    </th>`);
    tr.appendChild(th);
  });
  tr.appendChild(U.el('<th class="formul-sutun">Formüller</th>'));
  thead.appendChild(tr);

  // --- KPI satırları ---
  const tbody = kok.querySelector('tbody');
  kpiler.forEach(kpi => {
    const satir = document.createElement('tr');
    satir.appendChild(U.el(`<th class="kpi-sutun" title="${U.esc(kpi.ipucu)}">${kpi.ad}</th>`));
    gunler.forEach((g, i) => {
      const tarih = U.dateStr(g);
      const kayit = ozet.kayitlar[i] || {};
      const td = document.createElement('td');
      if(tarih === bugunStr) td.classList.add('bugun');

      if(kpi.id === 'oran'){
        const hedef = gunlukHedef(magazaKey, pzt, kayit);
        const oran = (U.sayi(kayit.ciro) !== null && hedef) ? U.sayi(kayit.ciro)/hedef*100 : null;
        td.className += ' hesaplanan ' + (oran >= 100 ? 'artis' : '');
        td.textContent = oran === null ? '' : U.fmtYuzde(oran, 0);
      } else if(kpi.id === 'hedef'){
        const deger = (kayit.hedef ?? '') === '' ? (gunlukHedef(magazaKey, pzt, kayit) ?? '') : kayit.hedef;
        td.appendChild(hucreGirdisi(magazaKey, tarih, 'hedef', deger, kpi.tur, duzenlenebilir));
      } else {
        td.appendChild(hucreGirdisi(magazaKey, tarih, kpi.id, kayit[kpi.id] ?? '', kpi.tur, duzenlenebilir));
      }
      satir.appendChild(td);
    });
    const f = formulHucresi(kpi, magazaKey, pzt, ozet);
    satir.appendChild(U.el(`<td class="formul-sutun ${f.sinif}">${U.esc(f.metin)}</td>`));
    tbody.appendChild(satir);
  });

  // --- Olaylar ---
  kok.querySelector('.hedef-girdi').addEventListener('change', function(){
    const v = U.metniSayiyaCevir(this.value);
    V.haftaHedefYaz(magazaKey, pzt, v);
    secenekler.yenile && secenekler.yenile();
  });
  kok.querySelectorAll('[data-urun]').forEach(b => b.addEventListener('click', () => {
    secenekler.urunAc && secenekler.urunAc(b.dataset.urun === 'bu' ? pzt : U.haftaEkle(pzt, -1));
  }));
  kok.querySelectorAll('.izin-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    izinMenusu(b, magazaKey, b.dataset.tarih, personel, secenekler);
  }));

  return kok;

  function hucreGirdisi(magaza, tarih, alan, deger, tur, aktif){
    const inp = document.createElement('input');
    inp.className = 'hucre';
    inp.type = 'text';
    inp.inputMode = 'decimal';
    inp.value = bicim(tur, deger);
    if(!aktif) inp.disabled = true;
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('change', () => {
      const v = U.metniSayiyaCevir(inp.value);
      V.gunAlanYaz(magaza, tarih, alan, v);
      secenekler.yenile && secenekler.yenile();
    });
    return inp;
  }
}

// Gün başlığındaki izin seçimi: kişi + izin türü, en altta personel düzenleme.
function izinMenusu(dugme, magazaKey, tarih, personel, secenekler){
  document.querySelectorAll('.acilir-menu').forEach(m => m.remove());
  const kayit = V.gunGetir(magazaKey, tarih) || {};
  const izinler = kayit.izinler || [];
  const aktifler = personel.filter(p => p.aktif !== false);

  const menu = U.el(`<div class="acilir-menu izin-menu">
    <div class="menu-baslik">${U.kisaTarih(new Date(tarih + 'T12:00:00'))} — izinli personel</div>
    <div class="izin-satirlar"></div>
    <button class="menu-alt" data-duzenle="1">⚙ Personeli düzenle</button>
  </div>`);
  const kap = menu.querySelector('.izin-satirlar');

  if(!aktifler.length) kap.appendChild(U.el('<div class="menu-bos">Personel listesi boş.</div>'));
  aktifler.forEach(p => {
    const mevcut = izinler.find(z => z.personelId === p.id);
    // Satır bir <label> değil: iç içe label + checkbox tıklamayı iki kez
    // tetikleyip seçimi geri alıyordu. Kutu yalnızca görsel, tıklamayı satır
    // ele alıyor.
    const satir = U.el(`<div class="izin-satir">
      <input type="checkbox" tabindex="-1" ${mevcut ? 'checked' : ''}>
      <span class="izin-ad">${U.esc(p.ad)}</span>
      <select class="izin-tur" ${mevcut ? '' : 'disabled'}>
        ${V.IZIN_TURLERI.map(t => `<option ${mevcut && mevcut.tur === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>`);
    const kutu = satir.querySelector('input');
    const tur = satir.querySelector('select');
    const kaydet = () => {
      const g = V.gunGetir(magazaKey, tarih) || {};
      const liste = (g.izinler || []).filter(z => z.personelId !== p.id);
      if(kutu.checked) liste.push({personelId: p.id, tur: tur.value});
      V.gunAlanYaz(magazaKey, tarih, 'izinler', liste);
      secenekler.yenile && secenekler.yenile();
    };
    satir.addEventListener('click', e => {
      if(e.target.closest('.izin-tur')) return;     // tür seçerken satır değişmesin
      kutu.checked = !kutu.checked;
      tur.disabled = !kutu.checked;
      kaydet();
    });
    tur.addEventListener('change', kaydet);
    kap.appendChild(satir);
  });

  menu.querySelector('[data-duzenle]').addEventListener('click', () => {
    menu.remove();
    secenekler.personelDuzenle && secenekler.personelDuzenle();
  });

  document.body.appendChild(menu);
  const kutu = dugme.getBoundingClientRect();
  menu.style.top = (window.scrollY + kutu.bottom + 4) + 'px';
  menu.style.left = Math.min(kutu.left, window.innerWidth - 260) + 'px';

  // Menü yalnızca dışına tıklayınca kapansın; içeride birden fazla kişi
  // işaretlenebilmeli.
  function disariTiklandi(e){
    if(menu.contains(e.target)) return;
    menu.remove();
    document.removeEventListener('click', disariTiklandi);
  }
  setTimeout(() => document.addEventListener('click', disariTiklandi), 0);
}
