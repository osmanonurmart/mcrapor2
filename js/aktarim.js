// Dışa / içe aktarma.
//
// Dışa aktarma: seçili mağazanın bütün verisi bir JSON yedeğine, günlük
// satırlar ayrıca bir CSV'ye yazılır (CSV Excel'de doğrudan açılır).
//
// İçe aktarma iki biçimi tanır:
//   1) v2 yedeği  — bu ekranın kendi ürettiği dosya.
//   2) v1 yedeği  — eski raporun "⬇ Dışa Aktar" düğmesinin ürettiği dosya.
//      Orada her gün "entry:YYYY-AA-GG" anahtarında JSON metni olarak durur,
//      haftalık hedefler "weekgoal:YYYY-Www" anahtarında tek sayı olarak.
import * as U from './util.js';
import * as V from './veri.js';
import { pencere, kapat } from './pencere.js';

const PAKET_SURUMU = 2;

// ---------------- Dosya indirme ----------------
function indir(ad, icerik, tur){
  const blob = new Blob([icerik], {type: tur});
  const url = URL.createObjectURL(blob);
  const bag = document.createElement('a');
  bag.href = url;
  bag.download = ad;
  document.body.appendChild(bag);
  bag.click();
  bag.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Excel Türkçe yerelde noktalı virgülle ayırır; BOM olmadan da Türkçe
// karakterleri bozuk gösterir. İkisi de burada veriliyor.
function csvYap(basliklar, satirlar){
  const hucre = v => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '﻿' + [basliklar, ...satirlar].map(r => r.map(hucre).join(';')).join('\r\n');
}

const CSV_ALANLARI = [
  ['Tarih',  k => k.tarih],
  ['Ciro',   k => k.ciro],
  ['MDO',    k => k.mdo],
  ['FBÜ',    k => k.fbu],
  ['MGS',    k => k.mgs],
  ['FBS',    k => k.fbs],
  ['Toplu',  k => k.toplu],
  ['Ürün adedi',    k => k.urunAdedi],
  ['Fatura sayısı', k => k.faturaSayisi],
  ['İzinli', (k, m) => (k.izinler || []).map(z => V.personelAdi(m, z.personelId) + ' · ' + z.tur).join(', ')],
  ['Yorum',  k => k.yorum],
  ['Kesin',  k => (k.kesin ? 'Evet' : 'Hayır')]
];

export function disaAktar(magazaKey){
  const profil = V.profilGetir(magazaKey);
  if(!profil){ U.bildir('uyari', 'Mağaza seçili değil', 'Önce üstteki listeden bir mağaza seçin.'); return; }

  const paket = V.magazaVerisiniTopla(magazaKey);
  const gunSayisi = Object.keys(paket.gunler).length;
  const yedek = {
    uygulama: 'mcrapor',
    surum: PAKET_SURUMU,
    magaza: magazaKey,
    magazaAd: profil.ad,
    tarih: new Date().toISOString(),
    ...paket
  };

  const damga = U.bugunStr();
  const dosyaAdi = 'mcrapor2-' + U.normalizeAd(profil.ad) + '-' + damga;
  indir(dosyaAdi + '.json', JSON.stringify(yedek, null, 2), 'application/json');

  const satirlar = Object.keys(paket.gunler).sort().map(tarih => {
    const k = {...(paket.gunler[tarih] || {}), tarih};
    return CSV_ALANLARI.map(([, al]) => al(k, magazaKey));
  });
  indir(dosyaAdi + '.csv', csvYap(CSV_ALANLARI.map(([ad]) => ad), satirlar), 'text/csv;charset=utf-8');

  U.bildir('iyi', '✓ Dışa aktarıldı',
    profil.ad + ' — ' + gunSayisi + ' gün, ' + Object.keys(paket.hedefler).length + ' haftalık hedef.<br>' +
    U.esc(dosyaAdi) + '.json ve .csv indirildi.');
}

// ---------------- v1 yedeğini çözümleme ----------------
// v1 kaydı: {date, ciro, mdo, fbu, mgs, fbs, hedef, toplu_satis, izinli, final}
// mdo metin olarak "% 28,50" biçiminde tutuluyor; sayıya çevriliyor.
const V1_ALAN = {ciro:'ciro', mdo:'mdo', fbu:'fbu', mgs:'mgs', fbs:'fbs', toplu:'toplu_satis'};

function v1KaydiCevir(ham){
  const kayit = {};
  Object.entries(V1_ALAN).forEach(([yeni, eski]) => {
    const s = U.metniSayiyaCevir(ham[eski]);
    if(s !== null) kayit[yeni] = s;
  });
  if(ham.final) kayit.kesin = true;
  return kayit;
}

// Dosyayı tanı ve ortak bir ara biçime indirge.
// Döner: {tur, magazaAd, gunler:{tarih:kayit}, hedefler:{hafta:sayi}, izinliler:{tarih:ad}, paket}
export function yedegiCozumle(metin){
  let ham;
  try{ ham = JSON.parse(metin); }
  catch(e){ return {hata: 'Dosya okunamadı: geçerli bir JSON değil.'}; }
  if(!ham || typeof ham !== 'object') return {hata: 'Dosya beklenen biçimde değil.'};

  // v2 yedeği
  if(ham.uygulama === 'mcrapor' && ham.gunler){
    return {
      tur: 'v2', magazaAd: ham.magazaAd || '',
      gunler: ham.gunler || {}, hedefler: ham.hedefler || {}, izinliler: {},
      paket: {
        gunler: ham.gunler || {}, hedefler: ham.hedefler || {},
        urunHafta: ham.urunHafta || {}, rutinDurum: ham.rutinDurum || {},
        personel: ham.personel || [], kartlar: ham.kartlar || [], rutin: ham.rutin || [],
        denetim: ham.denetim || null, notlar: ham.notlar || ''
      }
    };
  }

  // v1 yedeği: düz sözlük, değerler JSON metni.
  const girisler = Object.keys(ham).filter(k => k.startsWith('entry:'));
  if(!girisler.length) return {hata: 'Dosyada gün kaydı bulunamadı (v1 için "entry:" anahtarları bekleniyordu).'};

  const gunler = {}, izinliler = {}, gunlukHedef = {};
  girisler.forEach(k => {
    const tarih = k.slice(6);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return;
    let rec;
    try{ rec = typeof ham[k] === 'string' ? JSON.parse(ham[k]) : ham[k]; }
    catch(e){ return; }
    if(!rec || typeof rec !== 'object') return;
    const kayit = v1KaydiCevir(rec);
    const hedef = U.metniSayiyaCevir(rec.hedef);
    if(hedef !== null) gunlukHedef[tarih] = hedef;
    if(rec.izinli) izinliler[tarih] = String(rec.izinli).trim();
    if(Object.keys(kayit).length) gunler[tarih] = kayit;
  });

  // Haftalık hedef: önce v1'in kendi weekgoal kaydı, yoksa o haftanın
  // günlük hedeflerinin toplamı.
  const hedefler = {};
  Object.keys(ham).filter(k => k.startsWith('weekgoal:')).forEach(k => {
    const s = U.metniSayiyaCevir(ham[k]);
    if(s !== null) hedefler[k.slice(9)] = s;
  });
  const haftaToplami = {};
  Object.entries(gunlukHedef).forEach(([tarih, v]) => {
    const h = U.haftaKey(U.pazartesi(new Date(tarih + 'T12:00:00')));
    haftaToplami[h] = (haftaToplami[h] || 0) + v;
  });
  Object.entries(haftaToplami).forEach(([h, v]) => { if(hedefler[h] === undefined) hedefler[h] = v; });

  return {tur:'v1', magazaAd:'', gunler, hedefler, izinliler};
}

// v1'deki izinli adlarını mağazanın personel listesine bağlar; listede
// olmayan isimler listeye eklenir, yoksa tabloda "(silinmiş)" görünür.
function izinleriBagla(magazaKey, izinliler, gunler){
  const liste = V.personelGetir(magazaKey).map(p => ({...p}));
  const bul = ad => liste.find(p => U.normalizeAd(p.ad) === U.normalizeAd(ad));
  const eklenen = [];
  Object.entries(izinliler).forEach(([tarih, ad]) => {
    if(!ad) return;
    let kisi = bul(ad);
    if(!kisi){
      kisi = {id: 'p_v1_' + U.normalizeAd(ad), ad, aktif: true};
      liste.push(kisi);
      eklenen.push(ad);
    }
    gunler[tarih] = gunler[tarih] || {};
    gunler[tarih].izinler = [{personelId: kisi.id, tur: V.IZIN_TURLERI[0]}];
  });
  return {personel: liste, eklenen};
}

// ---------------- İçe aktarma penceresi ----------------
export function iceAktarPenceresi(magazaKey, yenile){
  const profil = V.profilGetir(magazaKey);
  if(!profil){ U.bildir('uyari', 'Mağaza seçili değil', 'Önce üstteki listeden bir mağaza seçin.'); return; }

  const govde = U.el(`<div class="aktarim">
    <p class="aciklama">Yedek dosyası <b>${U.esc(profil.ad)}</b> mağazasına yüklenecek.
      Eski raporun (v1) "⬇ Dışa Aktar" düğmesinden inen <b>.json</b> dosyasını ya da bu ekranın
      kendi yedeğini seçin. Aynı güne ait mevcut kayıtlar üzerine yazılır, diğer günlere dokunulmaz.</p>
    <label class="dosya-sec">
      <input type="file" accept=".json,application/json" class="yedek-dosya">
      <span class="dosya-etiket">📁 Yedek dosyasını seçin</span>
    </label>
    <div class="aktarim-sonuc"></div>
  </div>`);

  const dosya = govde.querySelector('.yedek-dosya');
  const etiket = govde.querySelector('.dosya-etiket');
  const sonuc = govde.querySelector('.aktarim-sonuc');
  let cozum = null;

  const kok = pencere('Veri içe aktar', govde, [
    {ad:'Vazgeç', tik: kapat},
    {ad:'İçe aktar', sinif:'birincil', tik: () => uygula()}
  ]);
  const uygulaDugmesi = kok.querySelectorAll('.pencere-alt .mini')[1];
  uygulaDugmesi.disabled = true;

  dosya.addEventListener('change', () => {
    const f = dosya.files && dosya.files[0];
    if(!f) return;
    etiket.textContent = '📄 ' + f.name;
    const okuyucu = new FileReader();
    okuyucu.onload = () => { cozum = yedegiCozumle(String(okuyucu.result)); onizle(); };
    okuyucu.onerror = () => { sonuc.innerHTML = '<div class="uyari">Dosya okunamadı.</div>'; };
    okuyucu.readAsText(f);
  });

  function onizle(){
    uygulaDugmesi.disabled = true;
    if(!cozum) return;
    if(cozum.hata){ sonuc.innerHTML = `<div class="uyari">${U.esc(cozum.hata)}</div>`; return; }

    const tarihler = Object.keys(cozum.gunler).sort();
    if(!tarihler.length){ sonuc.innerHTML = '<div class="uyari">Dosyada yazılacak gün kaydı yok.</div>'; return; }

    const uzerine = tarihler.filter(t => {
      const m = V.gunGetir(magazaKey, t);
      return m && Object.keys(m).length;
    }).length;
    const izinSayisi = Object.keys(cozum.izinliler || {}).length;
    const ornek = tarihler.slice(-7).map(t => {
      const k = cozum.gunler[t];
      const d = new Date(t + 'T12:00:00');
      return `<tr><td class="on-gun">${U.GUN_KISA[(d.getDay()+6)%7]} ${U.kisaTarih(d)}</td>
        <td>${k.ciro === undefined ? '–' : U.fmtSayi(k.ciro, 0)}</td>
        <td>${k.mdo === undefined ? '–' : U.fmtSayi(k.mdo, 2)}</td>
        <td>${k.mgs === undefined ? '–' : U.fmtSayi(k.mgs, 0)}</td>
        <td>${k.toplu === undefined ? '–' : U.fmtSayi(k.toplu, 0)}</td></tr>`;
    }).join('');

    sonuc.innerHTML = `<div class="bulgu-kutu">
      <div class="bulgu-ust">${cozum.tur === 'v1' ? 'Eski rapor (v1) yedeği' : 'MC Rapor v2 yedeği'}
        ${cozum.magazaAd ? ' · ' + U.esc(cozum.magazaAd) : ''}</div>
      <div class="bulgu-not"><b>${tarihler.length}</b> gün (${U.esc(tarihler[0])} → ${U.esc(tarihler[tarihler.length-1])}),
        <b>${Object.keys(cozum.hedefler || {}).length}</b> haftalık hedef${izinSayisi ? `, <b>${izinSayisi}</b> izin kaydı` : ''}.
        ${uzerine ? `<b>${uzerine}</b> günde mevcut veri var, üzerine yazılacak.` : 'Mevcut kayıtların üzerine yazılmıyor.'}</div>
      <table class="onizleme">
        <thead><tr><th>Son günler</th><th>Ciro</th><th>MDO</th><th>MGS</th><th>Toplu</th></tr></thead>
        <tbody>${ornek}</tbody>
      </table>
    </div>`;
    uygulaDugmesi.disabled = false;
  }

  async function uygula(){
    if(!cozum || cozum.hata) return;
    uygulaDugmesi.disabled = true;
    uygulaDugmesi.textContent = 'Yazılıyor…';
    try{
      const gunler = {};
      // Mevcut kayıt korunur, gelen alanlar üzerine bindirilir.
      Object.entries(cozum.gunler).forEach(([t, k]) => {
        gunler[t] = {...(V.gunGetir(magazaKey, t) || {}), ...k};
      });
      const paket = cozum.paket
        ? {...cozum.paket, gunler}
        : {gunler, hedefler: cozum.hedefler, urunHafta:{}, rutinDurum:{}};

      let eklenenPersonel = [];
      if(cozum.tur === 'v1' && Object.keys(cozum.izinliler || {}).length){
        const bagli = izinleriBagla(magazaKey, cozum.izinliler, gunler);
        paket.personel = bagli.personel;
        eklenenPersonel = bagli.eklenen;
      }

      const girdiler = V.paketiAnahtarlaraCevir(magazaKey, paket);
      await V.topluAnahtarYaz(girdiler);
      kapat();
      yenile();
      U.bildir('iyi', '✓ İçe aktarıldı',
        Object.keys(gunler).length + ' gün, ' + Object.keys(paket.hedefler || {}).length +
        ' haftalık hedef ' + U.esc(profil.ad) + ' mağazasına yazıldı.' +
        (eklenenPersonel.length ? '<br>Personel listesine eklenenler: ' + U.esc(eklenenPersonel.join(', ')) : ''));
    }catch(e){
      uygulaDugmesi.disabled = false;
      uygulaDugmesi.textContent = 'İçe aktar';
      sonuc.innerHTML = `<div class="uyari">Yazılamadı: ${U.esc(e.message)}</div>`;
    }
  }
}
