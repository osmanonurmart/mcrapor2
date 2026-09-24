// Mağaza müdürü ana ekranı: hafta gezinme, iki haftalık tablo, sağ panel.
import * as U from './util.js';
import * as V from './veri.js';
import { haftaTablosu, haftaOzeti } from './hafta.js';
import { panelOlustur } from './panel.js';
import { metniCozumle } from './yapistir.js';
import { pencere, kapat } from './pencere.js';
import { rutinBlogu } from './rutin.js';
import { tuvalCiz } from './yerlesim.js';

let seciliPzt = null;

export function seciliHafta(){ return seciliPzt || U.pazartesi(U.bugun()); }
export function haftaSec(pzt){ seciliPzt = U.pazartesi(pzt); }

export function magazaEkrani(magazaKey, secenekler = {}){
  const pzt = seciliHafta();
  const oncekiPzt = U.haftaEkle(pzt, -1);
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const yenile = secenekler.yenile || (() => {});

  const tabloSecenekleri = {
    duzenlenebilir, yenile,
    urunAc: p => urunPenceresi(magazaKey, p, duzenlenebilir, yenile),
    personelDuzenle: () => personelPenceresi(magazaKey, yenile)
  };
  const gez = haftaGezinti(pzt, yenile);
  const yan = panelOlustur(magazaKey, {duzenlenebilir, yenile});

  // Her bölüm bir blok. Yeni bir bölüm eklemek için buraya bir satır eklemek
  // yeterli; taşıma, boyutlandırma ve başlık kendiliğinden geliyor.
  const paneller = {
    hafta:        gez.hafta,
    duyuru:       gez.duyuru,
    rutin:        rutinBlogu(magazaKey, pzt, {duzenlenebilir, yenile}),
    haftaSecili:  haftaTablosu(magazaKey, pzt, tabloSecenekleri),
    haftaOnceki:  haftaTablosu(magazaKey, oncekiPzt, tabloSecenekleri),
    ozet:         yan.ozet,
    yorum:        yan.yorum
  };
  const adlar = {
    hafta:       '📅 Hafta seçimi',
    duyuru:      '📢 Duyurular',
    rutin:       '✓ Haftalık rutin',
    haftaSecili: '📊 ' + U.haftaBasligi(pzt),
    haftaOnceki: '📊 ' + U.haftaBasligi(oncekiPzt),
    ozet:        '📌 Özet',
    yorum:       '📝 Günlük yorum'
  };

  const kok = U.el('<div class="magaza-ekran"></div>');
  kok.appendChild(tuvalCiz(paneller, {magaza: magazaKey, adlar}));
  kok.appendChild(simuleSatiri(yenile));
  return kok;
}

function haftaGezinti(pzt, yenile){
  const bugunD = U.bugun();
  // Ay şeridi haftanın perşembesine göre belirlenir; 31 Ağustos'ta başlayan
  // hafta Eylül'e ait sayılır ve şerit hafta seçince değişmez.
  const {yil, ay} = U.haftaninAyi(pzt);
  const haftalar = U.ayinHaftalari(yil, ay);
  const seciliKey = U.haftaKey(pzt);

  const hafta = U.el(`<div class="gez-sol">
    <div class="ay-satir">
      ${U.AY_KISA.map((a,i) => `<button class="ay ${i+1===ay?'secili':''}" data-ay="${i+1}">${a}</button>`).join('')}
      <select class="yil-sec">
        ${[yil-1, yil, yil+1].map(y => `<option ${y===yil?'selected':''}>${y}</option>`).join('')}
      </select>
    </div>
    <div class="hafta-satir">
      <button class="ok" data-kaydir="-1" title="Önceki hafta">◀</button>
      <div class="hafta-listesi">
        ${haftalar.map(h => `<button class="hafta ${U.haftaKey(h)===seciliKey?'secili':''}" data-pzt="${U.dateStr(h)}">
            <span class="h-no">H${U.isoHafta(h).hafta}</span>
            <span class="h-aralik">${U.haftaAraligiEtiketi(h)}</span>
          </button>`).join('')}
      </div>
      <button class="ok" data-kaydir="1" title="Sonraki hafta">▶</button>
      <button class="mini" data-bugun="1">Bu hafta</button>
    </div>
  </div>`);

  const duyurular = V.duyurularGetir();
  const duyuru = U.el(`<div class="gez-sag">
    <div class="duyuru-serit">
      ${duyurular.length
        ? duyurular.slice(0,6).map(d => `<div class="duyuru-satir" title="${U.esc(d.metin)}">${U.esc(d.metin)}</div>`).join('')
        : '<div class="duyuru-bos">Duyuru yok.</div>'}
    </div>
  </div>`);

  hafta.querySelectorAll('[data-ay]').forEach(b => b.addEventListener('click', () => {
    const hedef = U.ayinHaftalari(Number(hafta.querySelector('.yil-sec').value), Number(b.dataset.ay))[0];
    if(hedef){ haftaSec(hedef); yenile(); }
  }));
  hafta.querySelector('.yil-sec').addEventListener('change', function(){
    const hedef = U.ayinHaftalari(Number(this.value), ay)[0];
    if(hedef){ haftaSec(hedef); yenile(); }
  });
  hafta.querySelectorAll('[data-pzt]').forEach(b => b.addEventListener('click', () => {
    haftaSec(new Date(b.dataset.pzt + 'T12:00:00')); yenile();
  }));
  hafta.querySelectorAll('[data-kaydir]').forEach(b => b.addEventListener('click', () => {
    haftaSec(U.haftaEkle(pzt, Number(b.dataset.kaydir))); yenile();
  }));
  hafta.querySelector('[data-bugun]').addEventListener('click', () => { haftaSec(U.pazartesi(bugunD)); yenile(); });

  return {hafta, duyuru};
}

function simuleSatiri(yenile){
  const kok = U.el(`<div class="simule-satir">
    <span>🕒 Simüle tarihi</span>
    <input type="date" value="${U.simuleDeger() || ''}">
    <button class="mini" data-sifirla="1">Gerçek güne dön</button>
    <span class="simule-not">${U.simuleDeger() ? 'Girilen veriler ' + U.simuleDeger() + ' tarihine kaydedilir.' : ''}</span>
  </div>`);
  kok.querySelector('input').addEventListener('change', function(){
    U.simuleAyarla(this.value);
    haftaSec(U.pazartesi(U.bugun()));
    yenile();
  });
  kok.querySelector('[data-sifirla]').addEventListener('click', () => {
    U.simuleAyarla(null);
    haftaSec(U.pazartesi(U.bugun()));
    yenile();
  });
  return kok;
}

// ---------------- Yapıştır penceresi ----------------
const ONIZLEME_ALANLARI = [
  {alan:'ciro',         ad:'Ciro',    basamak:0},
  {alan:'mdo',          ad:'MDO',     basamak:2},
  {alan:'fbu',          ad:'FBÜ',     basamak:2},
  {alan:'fbs',          ad:'FBS',     basamak:2},
  {alan:'mgs',          ad:'MGS',     basamak:0},
  {alan:'urunAdedi',    ad:'Ürün ad.',basamak:0},
  {alan:'faturaSayisi', ad:'Fatura',  basamak:0},
  {alan:'toplu',        ad:'Toplu',   basamak:0}
];

export function yapistirPenceresi(magazaKey, yenile){
  const govde = U.el(`<div class="yapistir">
    <p class="aciklama">Ciro takip sitesinde yer imine tıklayın, çıkan kutudaki metni buraya yapıştırın.
    Sayfa haftanın bütün günlerini verdiği için tek yapıştırma haftalık tabloyu baştan doldurur.</p>
    <textarea class="yapistir-alan" placeholder="Yer iminin kopyaladığı JSON..."></textarea>
    <div class="yapistir-sonuc"></div>
  </div>`);
  const alan = govde.querySelector('.yapistir-alan');
  const sonuc = govde.querySelector('.yapistir-sonuc');
  let cozum = null;

  const cozumle = () => {
    if(!alan.value.trim()){ sonuc.innerHTML = ''; cozum = null; return; }
    const c = metniCozumle(alan.value.trim(), {topluEsik: V.topluEsikGetir()});
    cozum = c;
    if(c.hata){ sonuc.innerHTML = `<div class="uyari">${U.esc(c.hata)}</div>`; return; }

    // Hangi alanlar geldi, onları sütun yap.
    const gelen = ONIZLEME_ALANLARI.filter(a => c.yazilacak.some(g => g.degerler[a.alan] !== undefined));
    const satirlar = c.yazilacak.map(g => {
      const d = new Date(g.tarih + 'T12:00:00');
      const mevcut = V.gunGetir(magazaKey, g.tarih);
      const uzerineMi = mevcut && ONIZLEME_ALANLARI.some(a => mevcut[a.alan] !== undefined && mevcut[a.alan] !== null);
      return `<tr>
        <td class="on-gun">${U.GUN_KISA[(d.getDay()+6)%7]} ${U.kisaTarih(d)}${g.kesin ? ' <span class="on-kesin" title="Gün kapandı, bu veri kesinleşti">✓</span>' : ' <span class="on-gecici" title="Gün devam ediyor, akşam değişebilir">~</span>'}${uzerineMi ? ' <span class="on-uyari" title="Bu günde zaten veri var, üzerine yazılacak">●</span>' : ''}</td>
        ${gelen.map(a => `<td>${g.degerler[a.alan] === undefined ? '–' : U.fmtSayi(g.degerler[a.alan], a.basamak)}</td>`).join('')}
      </tr>`;
    }).join('');

    const ozet = Object.keys(c.haftaToplamlari || {});
    sonuc.innerHTML = `<div class="bulgu-kutu">
      <div class="bulgu-ust">${U.esc(c.kaynak)} · rapor tarihi <b>${U.esc(c.tarih)}</b>${c.url ? ' · ' + U.esc(c.url) : ''}</div>
      <table class="onizleme">
        <thead><tr><th>Gün</th>${gelen.map(a => `<th>${a.ad}</th>`).join('')}</tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
      ${ozet.length ? `<div class="bulgu-not">Kaynaktaki özetler (yazılmaz, kıyas için):
        ${ozet.map(k => U.esc(k) + ' ' + U.fmtSayi(c.haftaToplamlari[k], 0)).join(' · ')}</div>` : ''}
      ${grupNotu(c)}
      <div class="bulgu-not">${c.yazilacak.length} gün yazılacak.
        <b>✓</b> kapanmış gün, veri kesin · <b>~</b> devam eden gün, akşam değişebilir ·
        <b>●</b> bu günde mevcut veri var, üzerine yazılır. Geçen haftaya dokunulmaz.</div>
    </div>`;
  };
  alan.addEventListener('input', () => { clearTimeout(alan._z); alan._z = setTimeout(cozumle, 300); });

  pencere('Veri ekle', govde, [
    {ad:'Panodan al', sinif:'', tik: async () => {
      try{ alan.value = await navigator.clipboard.readText(); cozumle(); }
      catch(e){ sonuc.innerHTML = '<div class="uyari">Pano okunamadı. Metni elle yapıştırın.</div>'; }
    }},
    {ad:'Kaydet', sinif:'birincil', tik: () => {
      if(!cozum || cozum.hata) return;
      cozum.yazilacak.forEach(g => {
        const kayit = V.gunGetir(magazaKey, g.tarih) || {};
        Object.keys(g.degerler).forEach(a => { kayit[a] = g.degerler[a]; });
        if(g.kesin) kayit.kesin = true;
        V.gunYaz(magazaKey, g.tarih, kayit);
      });
      // Yazılan günlerin haftasına geç ki sonuç hemen görünsün.
      haftaSec(U.pazartesi(new Date(cozum.tarih + 'T12:00:00')));
      kapat();
      yenile();
    }}
  ]);
}

// Gruplama tablosu: fatura bazlıysa toplu satış hesaplanır, değilse nasıl
// yapılacağı anlatılır.
function grupNotu(c){
  if(!c.grup) return '';
  if(c.grup.faturaBazli){
    const esik = U.fmtSayi(c.grup.esik, 0) + ' ₺';
    return c.grup.topluAdet
      ? `<div class="bulgu-not iyi">Toplu satış: ${c.grup.topluAdet} fatura, ${U.fmtSayi(c.grup.topluSatis, 0)} K
         (${c.grup.faturaSayisi} faturanın ${esik} üzerinde olanları).</div>`
      : `<div class="bulgu-not">Bugünkü ${c.grup.faturaSayisi} faturanın hiçbiri ${esik} eşiğini geçmedi,
         toplu satış 0 yazılacak. Eşik Kurucu panelinden değiştirilebilir.</div>`;
  }
  return `<div class="bulgu-not">Gruplama şu an <b>${U.esc(c.grup.olcut)}</b>. Toplu satışın da
    otomatik gelmesi için kaynak sayfada gruplamayı <b>Fatura No</b> yapıp tekrar yapıştırın.</div>`;
}

// ---------------- Personel penceresi ----------------
export function personelPenceresi(magazaKey, yenile){
  const govde = U.el('<div class="personel"><div class="personel-liste"></div><div class="personel-ekle"><input type="text" placeholder="Yeni personel adı"><button class="mini birincil">+ Ekle</button></div><p class="aciklama">Listeden çıkarılan kişi geçmiş günlerde görünmeye devam eder.</p></div>');
  const liste = govde.querySelector('.personel-liste');

  const ciz = () => {
    const kisiler = V.personelGetir(magazaKey);
    liste.innerHTML = kisiler.length ? '' : '<div class="menu-bos">Personel yok.</div>';
    kisiler.forEach(p => {
      const satir = U.el(`<div class="personel-satir ${p.aktif === false ? 'pasif' : ''}">
        <input class="p-ad" type="text" value="${U.esc(p.ad)}">
        <span class="p-durum">${p.aktif === false ? 'pasif' : 'aktif'}</span>
        <button class="mini p-durum-btn">${p.aktif === false ? 'Aktifleştir' : 'Çıkar'}</button>
      </div>`);
      satir.querySelector('.p-ad').addEventListener('change', function(){
        const l = V.personelGetir(magazaKey);
        const k = l.find(x => x.id === p.id);
        if(k){ k.ad = this.value.trim() || k.ad; V.personelYaz(magazaKey, l); ciz(); yenile(); }
      });
      satir.querySelector('.p-durum-btn').addEventListener('click', () => {
        const l = V.personelGetir(magazaKey);
        const k = l.find(x => x.id === p.id);
        if(k){ k.aktif = k.aktif === false; V.personelYaz(magazaKey, l); ciz(); yenile(); }
      });
      liste.appendChild(satir);
    });
  };
  ciz();

  const girdi = govde.querySelector('.personel-ekle input');
  const ekleBtn = govde.querySelector('.personel-ekle button');
  const ekle = () => {
    const ad = girdi.value.trim();
    if(!ad) return;
    const l = V.personelGetir(magazaKey);
    l.push({id:'p'+Date.now(), ad, aktif:true});
    V.personelYaz(magazaKey, l);
    girdi.value = '';
    ciz(); yenile();
  };
  ekleBtn.addEventListener('click', ekle);
  girdi.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); ekle(); } });

  pencere('Personel', govde, [{ad:'Kapat', sinif:'birincil', tik: kapat}]);
}

// ---------------- Haftalık ürün verisi ----------------
export function urunPenceresi(magazaKey, pzt, duzenlenebilir, yenile){
  const bu = V.urunHaftaGetir(magazaKey, pzt);
  const gecen = V.urunHaftaGetir(magazaKey, U.haftaEkle(pzt, -1));
  const govde = U.el(`<div class="urun-pencere">
    <div class="urun-ust">${U.haftaBasligi(pzt)}</div>
    <div class="urun-icerik"></div>
    ${duzenlenebilir ? '<div class="urun-yukle"><label>Excel’den kopyalanan satırları yapıştırın (grup adı ⇥ adet ⇥ pay)</label><textarea class="urun-alan" placeholder="Cam\t54\t5,2"></textarea><button class="mini birincil urun-kaydet">Yükle</button></div>' : ''}
  </div>`);
  const icerik = govde.querySelector('.urun-icerik');

  const ciz = () => {
    const veri = V.urunHaftaGetir(magazaKey, pzt);
    if(!veri || !veri.gruplar || !veri.gruplar.length){
      icerik.innerHTML = '<div class="menu-bos">Bu hafta için ürün verisi yüklenmemiş.</div>';
      return;
    }
    const gecenPay = ad => {
      const g = (gecen && gecen.gruplar || []).find(x => U.normalizeAd(x.ad) === U.normalizeAd(ad));
      return g ? g.pay : null;
    };
    const satirlar = veri.gruplar.map(g => {
      const onceki = gecenPay(g.ad);
      const fark = (onceki === null) ? null : g.pay - onceki;
      return `<tr class="${(g.pay >= 5 || (fark !== null && Math.abs(fark) >= 5)) ? 'one-cikan' : ''}">
        <td>${U.esc(g.ad)}</td><td>${U.fmtSayi(g.adet,0)}</td>
        <td>${U.fmtYuzde(g.pay,1)}</td>
        <td>${onceki === null ? '–' : U.fmtYuzde(onceki,1)}</td>
        <td class="${fark > 0 ? 'artis' : (fark < 0 ? 'dusus' : '')}">${fark === null ? '–' : (fark>0?'+':'') + U.fmtSayi(fark,1)}</td>
      </tr>`;
    }).join('');

    // Payı %5 üstünde olan veya %5'ten fazla değişen gruplar otomatik rapora girer.
    const oneCikan = veri.gruplar.filter(g => {
      const o = gecenPay(g.ad);
      return g.pay >= 5 || (o !== null && Math.abs(g.pay - o) >= 5);
    });
    icerik.innerHTML = `<table class="urun-tablo">
        <thead><tr><th>Grup</th><th>Adet</th><th>Bu hafta pay</th><th>Geçen hafta</th><th>Fark</th></tr></thead>
        <tbody>${satirlar}</tbody></table>
      ${oneCikan.length ? `<div class="urun-rapor"><b>Otomatik rapor</b>${oneCikan.map(g => {
        const o = gecenPay(g.ad);
        return `<div>${U.esc(g.ad)}: ${o === null ? 'bu hafta ' + U.fmtYuzde(g.pay,1) : U.fmtYuzde(o,1) + ' → ' + U.fmtYuzde(g.pay,1)}</div>`;
      }).join('')}</div>` : ''}`;
  };
  ciz();

  const kaydet = govde.querySelector('.urun-kaydet');
  if(kaydet) kaydet.addEventListener('click', () => {
    const metin = govde.querySelector('.urun-alan').value;
    const gruplar = metin.split('\n').map(s => s.trim()).filter(Boolean).map(satir => {
      const p = satir.split(/\t|;|\s{2,}/).map(x => x.trim());
      return {ad: p[0], adet: U.metniSayiyaCevir(p[1]) ?? 0, pay: U.metniSayiyaCevir(p[2]) ?? 0};
    }).filter(g => g.ad);
    if(!gruplar.length) return;
    V.urunHaftaYaz(magazaKey, pzt, {gruplar, yuklenme:new Date().toISOString()});
    govde.querySelector('.urun-alan').value = '';
    ciz(); yenile();
  });

  pencere('Haftalık ürün verisi', govde, [{ad:'Kapat', sinif:'birincil', tik: kapat}]);
}
