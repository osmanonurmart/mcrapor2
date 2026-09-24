// Panodan gelen veriyi işler.
//
// Kaynak site (ciro takip) yer imi çıktısında üç tablo veriyor:
//   1) KPI tablosu      : KPI | BUGÜN | DÜN | GEÇEN HAFTA | ...değişim sütunları
//   2) Hafta tablosu    : KPI | Pazartesi..Pazar | 38.HAFTA | 39.HAFTA | aylar
//   3) Gruplama tablosu : satış danışmanı veya fatura kırılımı
// "Tarih" alanı raporun hangi güne ait olduğunu söyler.
//
// En değerlisi 2. tablo: haftanın bütün günlerini tek seferde verir, yani bir
// yapıştırma haftalık tabloyu baştan sona doldurur.
import * as U from './util.js';

// Kaynaktaki satır adı -> bizim alan adımız
const KPI_ESLESME = [
  {alan:'ciro',         desen:/^(ciro|satı[şs])$/i},
  {alan:'mdo',          desen:/^mdo$/i},
  {alan:'fbu',          desen:/^fb[uü]$/i},
  {alan:'fbs',          desen:/^fbs$/i},
  {alan:'mgs',          desen:/^mgs$/i},
  {alan:'urunAdedi',    desen:/^[uü]r[uü]n\s*aded[ıi]$/i},
  {alan:'faturaSayisi', desen:/^fatura\s*say[ıi]s[ıi]$/i}
];
const GUN_BASLIKLARI = [/^pazartes[ıi]$/i, /^sal[ıi]$/i, /^[çc]ar[şs]amba$/i, /^per[şs]embe$/i,
                        /^cuma$/i, /^cumartes[ıi]$/i, /^pazar$/i];

const temiz = s => String(s ?? '').replace(/\s+/g, ' ').trim();
function alanTani(ad){
  const t = temiz(ad);
  const b = KPI_ESLESME.find(k => k.desen.test(t));
  return b ? b.alan : null;
}
function tabloBul(tablolar, basligaGore){
  return (tablolar || []).find(t => t && t.satirlar && t.satirlar.length && basligaGore(t.satirlar[0].map(temiz)));
}
function sutunBul(baslik, desen){
  return baslik.findIndex(h => desen.test(h));
}

// Raporun tarihi: "Tarih" alanı, yoksa çıktının zaman damgası, o da yoksa bugün.
function raporTarihi(veri){
  const alan = (veri.alanlar || []).find(a => /^tarih$/i.test(temiz(a.etiket)));
  if(alan && /^\d{4}-\d{2}-\d{2}$/.test(temiz(alan.deger))) return temiz(alan.deger);
  if(veri.zaman && /^\d{4}-\d{2}-\d{2}/.test(veri.zaman)) return veri.zaman.slice(0,10);
  return U.bugunStr();
}

// 2. tablo: haftanın günleri. Rapor tarihinden sonraki günler (hepsi 0) atlanır.
function haftaTablosunuCozumle(veri, tarih){
  const tablo = tabloBul(veri.tablolar, b => GUN_BASLIKLARI[0].test(b[1] || ''));
  if(!tablo) return {gunler: [], haftaToplamlari: {}};

  const baslik = tablo.satirlar[0].map(temiz);
  const gunSutunlari = GUN_BASLIKLARI.map(d => sutunBul(baslik, d));
  const pzt = U.pazartesi(new Date(tarih + 'T12:00:00'));

  const gunler = [];
  gunSutunlari.forEach((sutun, i) => {
    if(sutun < 0) return;
    const d = new Date(pzt); d.setDate(pzt.getDate() + i);
    const gunStr = U.dateStr(d);
    if(gunStr > tarih) return;                 // gelecek günler kaynakta 0 geliyor, yazma

    const degerler = {};
    tablo.satirlar.slice(1).forEach(satir => {
      const alan = alanTani(satir[0]);
      if(!alan) return;
      const sayi = U.metniSayiyaCevir(satir[sutun]);
      if(sayi !== null) degerler[alan] = sayi;
    });
    if(Object.keys(degerler).length) gunler.push({tarih: gunStr, degerler});
  });

  // "38.HAFTA", "EYLÜL" gibi özet sütunları — yazılmaz, sadece gösterilir.
  const haftaToplamlari = {};
  baslik.forEach((h, i) => {
    if(!/hafta$|^(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)$/i.test(h)) return;
    const ciroSatiri = tablo.satirlar.slice(1).find(s => alanTani(s[0]) === 'ciro');
    if(ciroSatiri) haftaToplamlari[h] = U.metniSayiyaCevir(ciroSatiri[i]);
  });
  return {gunler, haftaToplamlari};
}

// 1. tablo: bugün ve dün sütunları. Hafta tablosunda olmayan alanları tamamlar
// (ürün adedi, fatura sayısı gibi).
function kpiTablosunuCozumle(veri, tarih){
  const tablo = tabloBul(veri.tablolar, b => /^bug[uü]n$/i.test(b[1] || ''));
  if(!tablo) return {};
  const baslik = tablo.satirlar[0].map(temiz);
  const bugunSutun = sutunBul(baslik, /^bug[uü]n$/i);
  const dunSutun   = sutunBul(baslik, /^d[uü]n$/i);

  const dun = new Date(tarih + 'T12:00:00');
  dun.setDate(dun.getDate() - 1);

  const cikar = sutun => {
    if(sutun < 0) return null;
    const degerler = {};
    tablo.satirlar.slice(1).forEach(satir => {
      const alan = alanTani(satir[0]);
      if(!alan) return;
      const sayi = U.metniSayiyaCevir(satir[sutun]);
      if(sayi !== null) degerler[alan] = sayi;
    });
    return Object.keys(degerler).length ? degerler : null;
  };
  const sonuc = {};
  const b = cikar(bugunSutun);
  const d = cikar(dunSutun);
  if(b) sonuc[tarih] = b;
  if(d) sonuc[U.dateStr(dun)] = d;
  return sonuc;
}

// 3. tablo: gruplama. "Fatura No" ile gruplanmışsa toplu satış hesaplanabilir.
function grupTablosunuCozumle(veri, topluEsik){
  const tablo = tabloBul(veri.tablolar, b => /^grup$/i.test(b[0] || ''));
  if(!tablo) return null;
  const baslik = tablo.satirlar[0].map(temiz);
  const toplamSutun = sutunBul(baslik, /^toplam$/i);
  if(toplamSutun < 0) return null;

  const satirlar = tablo.satirlar.slice(1).map(s => ({
    ad: temiz(s[0]),
    fatura: U.metniSayiyaCevir(s[sutunBul(baslik, /fatura/i)]),
    adet: U.metniSayiyaCevir(s[sutunBul(baslik, /^adet$/i)]),
    tutar: U.metniSayiyaCevir(s[toplamSutun])
  })).filter(s => s.ad);

  // Gruplama ölçütünü açılır listeden anla.
  const liste = (veri.listeler || []).find(l => /gruplama/i.test(temiz(l.etiket)));
  const olcut = liste && liste.secili && liste.secili[0] ? temiz(liste.secili[0]) : '';
  const faturaBazli = /fatura/i.test(olcut);

  return {
    olcut: olcut || 'bilinmiyor',
    faturaBazli,
    satirlar,
    esik: topluEsik,
    topluSatis: faturaBazli
      ? Math.round(satirlar.filter(s => (s.tutar || 0) >= topluEsik).reduce((t,s) => t + s.tutar, 0) / 1000)
      : null,
    topluAdet: faturaBazli ? satirlar.filter(s => (s.tutar || 0) >= topluEsik).length : null,
    faturaSayisi: satirlar.length
  };
}

// secenekler: {topluEsik}
export function metniCozumle(metin, secenekler = {}){
  const topluEsik = secenekler.topluEsik ?? 2700;
  let veri;
  try{ veri = JSON.parse(metin); }
  catch(e){ return {hata:'Yapıştırılan metin JSON değil. Yer imine tıklayıp çıkan kutudaki metni kopyalayın.'}; }
  if(!veri || typeof veri !== 'object') return {hata:'Beklenen biçimde veri bulunamadı.'};

  const tarih = raporTarihi(veri);
  const {gunler, haftaToplamlari} = haftaTablosunuCozumle(veri, tarih);
  const kpi = kpiTablosunuCozumle(veri, tarih);
  const grup = grupTablosunuCozumle(veri, topluEsik);

  // Gün listesini birleştir. Hafta tablosu bütün günleri verir ama ciroyu tam
  // sayıya yuvarlar (3.599,84 → 3.600); KPI tablosu bugün ve dün için tam
  // değeri verdiğinden o ikisinde KPI tablosu esas alınır.
  const harita = new Map();
  gunler.forEach(g => harita.set(g.tarih, Object.assign({}, g.degerler)));
  Object.keys(kpi).forEach(t => {
    harita.set(t, Object.assign({}, harita.get(t) || {}, kpi[t]));
  });
  if(grup && grup.topluSatis !== null && harita.has(tarih)){
    harita.get(tarih).toplu = grup.topluSatis;
  }

  // Rapor gününden önceki günler artık değişmez: "kesin" işaretlenir.
  // Rapor günü akşama kadar değişebilir, kesin sayılmaz.
  const yazilacak = [...harita.entries()]
    .map(([t, degerler]) => ({tarih: t, degerler, kesin: t < tarih}))
    .sort((a,b) => a.tarih.localeCompare(b.tarih));

  if(!yazilacak.length){
    return {hata:'Tablolar okundu ama tanınan bir KPI satırı bulunamadı. Çıktıyı olduğu gibi paylaşırsanız eşleştirmeyi genişletirim.'};
  }
  return {
    kaynak: 'Ciro takip sayfası',
    url: veri.url || '',
    tarih,
    yazilacak,
    haftaToplamlari,
    grup,
    ham: veri
  };
}
