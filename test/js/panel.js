// Sağ panel: sekmeli özet kutusu (Dün/Bugün, Ay içi kıyas, Ay toplamı)
// ve günlük yorum kutusu.
import * as U from './util.js';
import * as V from './veri.js';

const ALAN_ADLARI = {ciro:'Ciro', mdo:'MDO', fbu:'FBÜ', fbs:'FBS', mgs:'MGS', toplu:'Toplu satış'};
const ALAN_BICIM = {
  ciro:U.fmtTL, fbs:U.fmtTL, mdo:v=>U.fmtYuzde(v,1), fbu:v=>U.fmtSayi(v,2),
  mgs:v=>U.fmtSayi(v,0), toplu:v=>U.fmtSayi(v,0)
};
const SEKMELER = [
  {id:'gunluk',   ad:'Dün / Bugün'},
  {id:'ayIci',    ad:'Ay içi'},
  {id:'ayToplam', ad:'Ay toplamı'}
];

function alanBicimle(alan, deger){
  const f = ALAN_BICIM[alan] || (v => U.fmtSayi(v, 0));
  return deger === null || deger === undefined || deger === '' ? '–' : f(deger);
}

// Ayın 1'inden verilen güne kadar toplam/ortalama.
function ayToplami(magaza, yil, ay, sonGun){
  const gunSayisi = new Date(yil, ay, 0).getDate();
  const bitis = Math.min(sonGun || gunSayisi, gunSayisi);
  const kayitlar = [];
  for(let g=1; g<=bitis; g++){
    const k = V.gunGetir(magaza, yil + '-' + U.pad(ay) + '-' + U.pad(g));
    if(k) kayitlar.push(k);
  }
  // Elle girilen kartlar da toplansın; sağ sütun kullanıcının kartlarını
  // takip ediyor, oradaki her kartın ay içi karşılığı lazım.
  const elle = {};
  kayitlar.forEach(k => Object.entries(k.kartlar || {}).forEach(([id, v]) => {
    const n = U.sayi(v);
    if(n !== null) elle[id] = (elle[id] || 0) + n;
  }));
  return {
    ciro: U.toplam(kayitlar.map(k => U.sayi(k.ciro))),
    mgs:  U.toplam(kayitlar.map(k => U.sayi(k.mgs))),
    mdo:  U.ortalama(kayitlar.map(k => U.sayi(k.mdo))),
    fbu:  U.ortalama(kayitlar.map(k => U.sayi(k.fbu))),
    fbs:  U.ortalama(kayitlar.map(k => U.sayi(k.fbs))),
    toplu:U.toplam(kayitlar.map(k => U.sayi(k.toplu))),
    kartlar: elle
  };
}

function kiyasIcerigi(altBaslik, sol, sag, solEtiket, sagEtiket){
  const satirlar = ['ciro','mdo','fbu','mgs','fbs','toplu'].map(alan => {
    const d = U.yuzdeDegisim(sol[alan], sag[alan]);
    return `<tr>
      <td>${ALAN_ADLARI[alan]}</td>
      <td>${alanBicimle(alan, sol[alan])}</td>
      <td>${alanBicimle(alan, sag[alan])}</td>
      <td class="${U.degisimSinifi(d)}">${U.fmtDegisim(d)}</td>
    </tr>`;
  }).join('');
  return U.el(`<div class="sekme-govde">
    <div class="panel-alt">${U.esc(altBaslik)}</div>
    <table class="kiyas-tablo">
      <thead><tr><th></th><th>${U.esc(solEtiket)}</th><th>${U.esc(sagEtiket)}</th><th>Fark</th></tr></thead>
      <tbody>${satirlar}</tbody>
    </table>
  </div>`);
}

// Ay içi sütunu: her ölçüt için geçen ayın aynı dönemiyle kıyas.
// Soldaki dün/bugün kartlarıyla aynı görünümde olsun diye kart biçiminde.
// kip: 'ayIci'   → geçen ayın aynı dönemi ile bu ayın aynı dönemi
//      'ayToplam' → geçen ayın tamamı ile bu ayın bugüne kadarki kısmı
function ayKiyasIcerigi(magazaKey, oncekiYil, oncekiAy, yil, ay, gun, kip){
  const ayIci = kip !== 'ayToplam';
  const onceki = ayToplami(magazaKey, oncekiYil, oncekiAy, ayIci ? gun : null);
  const simdi  = ayToplami(magazaKey, yil, ay, gun);
  const ustEtiket = ayIci ? `1–${gun} ${U.AY_KISA[oncekiAy-1]}` : `${U.AY_KISA[oncekiAy-1]} tamamı`;
  const altEtiket = `1–${gun} ${U.AY_KISA[ay-1]}`;
  const govde = U.el('<div class="kart-liste"></div>');
  // Soldaki kartlarla aynı sırada, aynı sayıda: satırlar hizalı dursun.
  V.kartlarGetir(magazaKey).forEach(kart => {
    const kaynakMi = kart.tur === 'kaynak';
    const o = kaynakMi ? onceki[kart.alan] : (onceki.kartlar || {})[kart.id];
    const y = kaynakMi ? simdi[kart.alan]  : (simdi.kartlar  || {})[kart.id];
    const d = U.yuzdeDegisim(o, y);
    const bicim = v => kaynakMi ? alanBicimle(kart.alan, v)
      : (v === null || v === undefined ? '–' : U.fmtSayi(v, 0));
    govde.appendChild(U.el(`<div class="kart">
      <div class="kart-ust"><span class="kart-ad">${U.esc(kart.ad)}</span></div>
      <div class="kart-satir"><span>${U.esc(ustEtiket)}</span><b>${bicim(o)}</b><span></span></div>
      <div class="kart-satir kart-bugun">
        <span>${U.esc(altEtiket)}</span>
        <b>${bicim(y)}</b>
        <span class="kart-degisim ${U.degisimSinifi(d)}">${U.fmtDegisim(d)}</span>
      </div>
    </div>`));
  });
  return govde;
}

// ---------------- Dün / Bugün kartları ----------------
function kartIcerigi(magazaKey, secenekler){
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const bugunD = U.bugun();
  const bugunStr = U.bugunStr();
  const dunD = new Date(bugunD); dunD.setDate(dunD.getDate() - 1);
  const buGun = V.gunGetir(magazaKey, bugunStr) || {};
  const dun   = V.gunGetir(magazaKey, U.dateStr(dunD)) || {};

  const govde = U.el('<div class="kart-sutun"></div>');
  const kartListe = U.el('<div class="kart-liste"></div>');
  govde.appendChild(kartListe);

  V.kartlarGetir(magazaKey).forEach(kart => {
    const onceki = kart.tur === 'kaynak' ? dun[kart.alan]   : (dun.kartlar   || {})[kart.id];
    const simdi  = kart.tur === 'kaynak' ? buGun[kart.alan] : (buGun.kartlar || {})[kart.id];
    const d = U.yuzdeDegisim(onceki, simdi);
    const kartEl = U.el(`<div class="kart">
      <div class="kart-ust">
        <span class="kart-ad">${U.esc(kart.ad)}</span>
        <button class="kart-sil" title="Kartı kaldır">✕</button>
      </div>
      <div class="kart-satir"><span>Dün</span><b>${alanBicimle(kart.alan, onceki)}</b><span></span></div>
      <div class="kart-satir kart-bugun">
        <span>Bugün</span>
        ${kart.tur === 'kaynak'
          ? `<b>${alanBicimle(kart.alan, simdi)}</b>`
          : `<input class="kart-girdi" type="text" inputmode="decimal" value="${simdi ?? ''}" ${duzenlenebilir?'':'disabled'}>`}
        <span class="kart-degisim ${U.degisimSinifi(d)}">${U.fmtDegisim(d)}</span>
      </div>
    </div>`);
    const girdi = kartEl.querySelector('.kart-girdi');
    if(girdi) girdi.addEventListener('change', () => {
      const g = V.gunGetir(magazaKey, bugunStr) || {};
      g.kartlar = g.kartlar || {};
      g.kartlar[kart.id] = U.metniSayiyaCevir(girdi.value);
      V.gunYaz(magazaKey, bugunStr, g);
      secenekler.yenile && secenekler.yenile();
    });
    kartEl.querySelector('.kart-sil').addEventListener('click', () => {
      V.kartlarYaz(magazaKey, V.kartlarGetir(magazaKey).filter(k => k.id !== kart.id));
      secenekler.yenile && secenekler.yenile();
    });
    kartListe.appendChild(kartEl);
  });

  if(duzenlenebilir){
    const ekle = U.el('<button class="kart-ekle">+ Kart ekle</button>');
    ekle.addEventListener('click', () => kartEklemeFormu(magazaKey, kartListe, secenekler));
    govde.appendChild(ekle);
  }
  return govde;
}

// ---------------- Panel ----------------
export function panelOlustur(magazaKey, secenekler = {}){
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const bugunD = U.bugun();
  const bugunStr = U.bugunStr();
  const buGun = V.gunGetir(magazaKey, bugunStr) || {};
  // --- Özet kutusu: solda dün/bugün, sağında ay içi ---
  const yil = bugunD.getFullYear(), ay = bugunD.getMonth() + 1, gun = bugunD.getDate();
  const oncekiAy = ay === 1 ? 12 : ay - 1;
  const oncekiYil = ay === 1 ? yil - 1 : yil;

  const ozet = U.el(`<div class="panel-kutu ozet-kutu" data-panel="ozet">
    <div class="ozet-basliklar">
      <div class="ozet-baslik">Dün / Bugün</div>
      <div class="ozet-sekmeler">
        <button class="ozet-sekme" data-kip="ayIci">Ay içi</button>
        <button class="ozet-sekme" data-kip="ayToplam">Ay toplamı</button>
      </div>
    </div>
    <div class="ozet-sutunlar">
      <div class="ozet-sol"></div>
      <div class="ozet-sag"></div>
    </div>
  </div>`);
  ozet.querySelector('.ozet-sol').appendChild(kartIcerigi(magazaKey, secenekler));

  const sag = ozet.querySelector('.ozet-sag');
  const sagCiz = kip => {
    sag.innerHTML = '';
    sag.appendChild(ayKiyasIcerigi(magazaKey, oncekiYil, oncekiAy, yil, ay, gun, kip));
    ozet.querySelectorAll('.ozet-sekme').forEach(b => b.classList.toggle('secili', b.dataset.kip === kip));
  };
  ozet.querySelectorAll('.ozet-sekme').forEach(b => b.addEventListener('click', () => {
    V.ozetSekmesiYaz(magazaKey, b.dataset.kip);
    sagCiz(b.dataset.kip);
  }));
  const kayitliKip = V.ozetSekmesiGetir(magazaKey);
  sagCiz(kayitliKip === 'ayToplam' ? 'ayToplam' : 'ayIci');

  // --- Günlük yorum ---
  const yorumKutu = U.el(`<div class="panel-kutu" data-panel="yorum">
    <div class="panel-alt">${U.kisaTarih(bugunD)} — bölge müdürüne iletilir</div>
    <textarea class="yorum-alan" placeholder="Düşüş veya yükselişin sebebi..." ${duzenlenebilir?'':'disabled'}>${U.esc(buGun.yorum || '')}</textarea>
    <div class="yorum-durum"></div>
  </div>`);
  const yorumAlan = yorumKutu.querySelector('.yorum-alan');
  let zaman = null;
  yorumAlan.addEventListener('input', () => {
    clearTimeout(zaman);
    zaman = setTimeout(() => {
      V.gunAlanYaz(magazaKey, bugunStr, 'yorum', yorumAlan.value);
      yorumKutu.querySelector('.yorum-durum').textContent = 'Kaydedildi ✓';
      setTimeout(() => { yorumKutu.querySelector('.yorum-durum').textContent = ''; }, 1800);
    }, 500);
  });
  return {ozet, yorum: yorumKutu};
}

function kartEklemeFormu(magazaKey, kap, secenekler){
  const form = U.el(`<div class="kart kart-form">
    <input class="k-ad" type="text" placeholder="Kart adı (ör. Halı satışı)">
    <select class="k-tur">
      <option value="elle">Elle girilecek</option>
      ${Object.keys(ALAN_ADLARI).map(a => `<option value="${a}">${ALAN_ADLARI[a]} (kaynaktan)</option>`).join('')}
    </select>
    <div class="kart-form-alt"><button class="mini birincil k-kaydet">Ekle</button><button class="mini k-iptal">İptal</button></div>
  </div>`);
  form.querySelector('.k-iptal').addEventListener('click', () => form.remove());
  form.querySelector('.k-kaydet').addEventListener('click', () => {
    const ad = form.querySelector('.k-ad').value.trim();
    if(!ad){ U.bosUyar(form.querySelector('.k-ad')); return; }
    const tur = form.querySelector('.k-tur').value;
    const liste = V.kartlarGetir(magazaKey);
    liste.push(tur === 'elle'
      ? {id:'k'+Date.now(), ad, alan:null, tur:'elle'}
      : {id:'k'+Date.now(), ad, alan:tur, tur:'kaynak'});
    V.kartlarYaz(magazaKey, liste);
    secenekler.yenile && secenekler.yenile();
  });
  kap.appendChild(form);
  form.querySelector('.k-ad').focus();
}
