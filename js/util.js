// Ortak yardımcılar: tarih, hafta, biçimlendirme.
export const GUN_KISA = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
export const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const AY_KISA = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

export const pad = n => (n < 10 ? '0' : '') + n;
export const dateStr = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
export const kisaTarih = d => pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + String(d.getFullYear()).slice(2);

// Simüle tarih: seçilirse uygulama o günmüş gibi davranır.
let simuleGun = null;
export function simuleAyarla(tarihStr){ simuleGun = tarihStr || null; }
export function simuleDeger(){ return simuleGun; }
export function bugun(){ return simuleGun ? new Date(simuleGun + 'T12:00:00') : new Date(); }
export function bugunStr(){ return dateStr(bugun()); }

export function pazartesi(d){
  const g = (d.getDay() + 6) % 7;            // 0 = pazartesi
  const m = new Date(d);
  m.setDate(d.getDate() - g);
  m.setHours(0,0,0,0);
  return m;
}
export function haftaEkle(d, n){ const x = new Date(d); x.setDate(x.getDate() + n*7); return x; }

// ISO hafta numarası (pazartesi başlangıçlı, standart takvim haftası).
export function isoHafta(tarih){
  const d = new Date(Date.UTC(tarih.getFullYear(), tarih.getMonth(), tarih.getDate()));
  const gunNo = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - gunNo + 3);
  const ilkPersembe = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const hafta = 1 + Math.round(((d - ilkPersembe)/86400000 - 3 + ((ilkPersembe.getUTCDay()+6)%7)) / 7);
  return { yil: d.getUTCFullYear(), hafta };
}
export function haftaKey(pzt){ const {yil,hafta} = isoHafta(pzt); return yil + '-W' + pad(hafta); }
export function haftaGunleri(pzt){
  return Array.from({length:7}, (_,i)=>{ const d = new Date(pzt); d.setDate(pzt.getDate()+i); return d; });
}
export function haftaBasligi(pzt){
  const gunler = haftaGunleri(pzt);
  const {hafta} = isoHafta(pzt);
  return kisaTarih(gunler[0]) + ' - ' + kisaTarih(gunler[6]) + ' (Hafta ' + hafta + ')';
}
// Bir hafta, perşembesinin düştüğü aya aittir (ISO kuralı). Böylece her hafta
// tek bir aya girer; hafta seçmek şeridi değiştirmez.
export function persembe(pzt){ const d = new Date(pzt); d.setDate(d.getDate() + 3); return d; }
export function haftaninAyi(pzt){
  const p = persembe(pzt);
  return {yil: p.getFullYear(), ay: p.getMonth() + 1};
}
export function ayinHaftalari(yil, ay){
  // Ayın ilk gününü içeren haftadan başlayıp perşembesi bu ayda olanları al.
  const haftalar = [];
  let p = pazartesi(new Date(yil, ay-1, 1));
  for(let i=0;i<6;i++){
    const pr = persembe(p);
    if(pr.getFullYear() === yil && pr.getMonth() + 1 === ay) haftalar.push(new Date(p));
    p = haftaEkle(p, 1);
  }
  return haftalar;
}
// Bütün hafta etiketleri aynı biçimde: "7.Eyl - 13.Eyl", ay sınırını aşanlar dahil.
export function haftaAraligiEtiketi(pzt){
  const g = haftaGunleri(pzt);
  const yaz = d => d.getDate() + '.' + AY_KISA[d.getMonth()];
  return yaz(g[0]) + ' - ' + yaz(g[6]);
}

export const sayi = n => (n === null || n === undefined || n === '' || isNaN(n)) ? null : Number(n);
export function fmtTL(n){ const v = sayi(n); return v === null ? '–' : v.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' ₺'; }
export function fmtSayi(n, basamak = 2){ const v = sayi(n); return v === null ? '–' : v.toLocaleString('tr-TR', {maximumFractionDigits:basamak}); }
export function fmtYuzde(n, basamak = 1){ const v = sayi(n); return v === null ? '–' : '%' + v.toFixed(basamak).replace('.', ','); }
export function fmtDegisim(n){
  const v = sayi(n);
  if(v === null) return '–';
  const ok = v > 0.05 ? '▲' : (v < -0.05 ? '▼' : '■');
  return ok + ' %' + Math.abs(v).toFixed(1).replace('.', ',');
}
export function degisimSinifi(n){
  const v = sayi(n);
  if(v === null) return '';
  return v > 0.05 ? 'artis' : (v < -0.05 ? 'dusus' : 'sabit');
}
// "12.345,67" / "%45" / "1 234" gibi girdileri sayıya çevirir.
// "12.345,67 TRY", "% 45,45", "-93,79%", "23.411 TRY" gibi girdileri sayıya çevirir.
// Önce harf ve simgeler atılır; binlik/ondalık ayrımı ondan sonra yapılır,
// yoksa "23.411 TRY" içindeki harfler ayıraç kalıbını bozar.
export function metniSayiyaCevir(s){
  if(s === null || s === undefined) return null;
  let t = String(s).replace(/[^\d.,\-]/g, '');
  if(!t || t === '-' || t === '.' || t === ',') return null;
  const eksi = t.trimStart().startsWith('-');
  t = t.replace(/-/g, '');
  if(t.includes(',')){
    // "12.345,67" — nokta binlik, virgül ondalık.
    t = t.replace(/\./g, '').replace(',', '.');
  } else if(/^\d{1,3}(\.\d{3})+$/.test(t)){
    // "23.411" — virgül yok ve noktalar üçerli gruplar: binlik ayıracı.
    t = t.replace(/\./g, '');
  }
  const n = parseFloat(t);
  if(isNaN(n)) return null;
  return eksi ? -n : n;
}
export function ortalama(liste){
  const v = liste.filter(x => x !== null && x !== undefined && !isNaN(x));
  return v.length ? v.reduce((a,b)=>a+b,0) / v.length : null;
}
export function toplam(liste){
  const v = liste.filter(x => x !== null && x !== undefined && !isNaN(x));
  return v.length ? v.reduce((a,b)=>a+b,0) : null;
}
export function yuzdeDegisim(onceki, simdi){
  const o = sayi(onceki), s = sayi(simdi);
  if(o === null || s === null || !o) return null;
  return (s - o) / o * 100;
}
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Mağaza adı eşleştirmede büyük/küçük harf, boşluk ve Türkçe karakter farkını yok sayar.
export function normalizeAd(s){
  const harf = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return String(s || '').toLowerCase().replace(/[ıİşŞğĞüÜöÖçÇ]/g, h => harf[h] || h).replace(/[^a-z0-9]/g, '');
}
export function el(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
