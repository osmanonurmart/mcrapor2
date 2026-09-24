// Veri katmanı.
// Şimdilik tarayıcının localStorage'ı üstünde çalışıyor; Firebase'e geçerken
// yalnızca bu dosyadaki oku/yaz fonksiyonlarının içi değişecek, çağıran kodu değil.
import { pazartesi, haftaKey, dateStr, haftaGunleri, haftaEkle } from './util.js';

const ON_EK = 'mc2:';
const olaylar = new EventTarget();

function oku(anahtar, varsayilan){
  try{
    const ham = localStorage.getItem(ON_EK + anahtar);
    return ham === null ? varsayilan : JSON.parse(ham);
  }catch(e){ return varsayilan; }
}
function yaz(anahtar, deger){
  try{ localStorage.setItem(ON_EK + anahtar, JSON.stringify(deger)); }
  catch(e){ console.warn('Kaydedilemedi:', anahtar, e); }
  olaylar.dispatchEvent(new CustomEvent('degisti', {detail:{anahtar}}));
}
export function dinle(fn){ olaylar.addEventListener('degisti', fn); }

// ---------------- Profiller ----------------
export const ROLLER = { MAGAZA:'magaza', BOLGE:'bolge', KURUCU:'kurucu' };
export const profilleriGetir = () => oku('profiller', []);
export const profilGetir = key => profilleriGetir().find(p => p.key === key) || null;
export function profilleriYaz(liste){ yaz('profiller', liste); }
export function profilGuncelle(key, alanlar){
  const liste = profilleriGetir();
  const p = liste.find(x => x.key === key);
  if(!p) return null;
  Object.assign(p, alanlar);
  profilleriYaz(liste);
  return p;
}
export function magazalar(){ return profilleriGetir().filter(p => p.rol === ROLLER.MAGAZA); }

// ---------------- Günlük kayıt ----------------
// {ciro, mdo, fbu, fbs, mgs, toplu, hedef, izinler:[{personelId,tur}], yorum, kartlar:{}}
export const gunKey = (magaza, tarih) => 'gun:' + magaza + ':' + tarih;
export function gunGetir(magaza, tarih){ return oku(gunKey(magaza, tarih), null); }
export function gunYaz(magaza, tarih, kayit){ yaz(gunKey(magaza, tarih), kayit); }
export function gunAlanYaz(magaza, tarih, alan, deger){
  const k = gunGetir(magaza, tarih) || {};
  k[alan] = deger;
  k.guncelleme = new Date().toISOString();
  gunYaz(magaza, tarih, k);
  return k;
}
export function haftaKayitlari(magaza, pzt){
  return haftaGunleri(pzt).map(d => gunGetir(magaza, dateStr(d)) || {});
}

// ---------------- Hedefler ----------------
export function haftaHedefGetir(magaza, pzt){ return oku('hedef:' + magaza + ':' + haftaKey(pzt), null); }
export function haftaHedefYaz(magaza, pzt, deger){ yaz('hedef:' + magaza + ':' + haftaKey(pzt), deger); }
// Kural bazlı hedef: geçen haftanın cirosu ± yüzde.
export function kuralHedefi(magaza, pzt, yuzde){
  const gecen = haftaKayitlari(magaza, haftaEkle(pzt, -1))
    .map(k => k.ciro).filter(v => v !== null && v !== undefined && !isNaN(v));
  if(!gecen.length) return null;
  return Math.round(gecen.reduce((a,b)=>a+b,0) * (1 + yuzde/100));
}

// ---------------- Personel ve izin ----------------
export const IZIN_TURLERI = ['Haftalık','Yıllık','Rapor','Ücretsiz','Doğum'];
export function personelGetir(magaza){ return oku('personel:' + magaza, []); }
export function personelYaz(magaza, liste){ yaz('personel:' + magaza, liste); }
// Listeden çıkarılan kişi geçmiş kayıtlarda görünmeye devam etsin diye silinmez, pasife alınır.
export function personelPasifle(magaza, id){
  const liste = personelGetir(magaza);
  const k = liste.find(p => p.id === id);
  if(k){ k.aktif = false; personelYaz(magaza, liste); }
}
export function personelAdi(magaza, id){
  const k = personelGetir(magaza).find(p => p.id === id);
  return k ? k.ad : '(silinmiş)';
}

// ---------------- Haftalık ürün verisi (Excel) ----------------
// {gruplar:[{ad, adet, pay}]} — pay yüzde olarak.
export function urunHaftaGetir(magaza, pzt){ return oku('urun:' + magaza + ':' + haftaKey(pzt), null); }
export function urunHaftaYaz(magaza, pzt, veri){ yaz('urun:' + magaza + ':' + haftaKey(pzt), veri); }

// ---------------- Kartlar (sağ panel) ----------------
export function kartlarGetir(magaza){
  return oku('kartlar:' + magaza, [
    {id:'ciro',  ad:'Ciro',        alan:'ciro',  tur:'kaynak'},
    {id:'mgs',   ad:'MGS',         alan:'mgs',   tur:'kaynak'},
    {id:'toplu', ad:'Toplu satış', alan:'toplu', tur:'kaynak'}
  ]);
}
export function kartlarYaz(magaza, liste){ yaz('kartlar:' + magaza, liste); }

// ---------------- Ürün / kategori ve talepler ----------------
export function kategorilerGetir(){ return oku('kategoriler', []); }
export function kategorilerYaz(liste){ yaz('kategoriler', liste); }
export function taleplerGetir(){ return oku('talepler', []); }
export function taleplerYaz(liste){ yaz('talepler', liste); }
export function talepEkle(talep){
  const liste = taleplerGetir();
  liste.push(talep);
  taleplerYaz(liste);
  return talep;
}

// ---------------- Duyurular ----------------
export function duyurularGetir(){ return oku('duyurular', []); }
export function duyuruEkle(metin){
  const liste = duyurularGetir();
  liste.unshift({id:'d'+Date.now(), metin, tarih:new Date().toISOString()});
  yaz('duyurular', liste.slice(0, 50));
}
export function duyuruSil(id){ yaz('duyurular', duyurularGetir().filter(d => d.id !== id)); }

// ---------------- Haftalık rutin ----------------
// Liste mağazanın sabit rutinidir; işaretlemeler hafta hafta tutulur.
export const VARSAYILAN_RUTIN = [
  {id:'r_pzt1', gun:0, metin:'Örneklem'},
  {id:'r_pzt2', gun:0, metin:'Ürün talebi gönder'},
  {id:'r_car1', gun:2, metin:'Stok sayımı'},
  {id:'r_cum1', gun:4, metin:'Shift'},
  {id:'r_cmt1', gun:5, metin:'Vitrin düzeni'},
  {id:'r_paz1', gun:6, metin:'Ürün Excel yükle'},
  {id:'r_paz2', gun:6, metin:'Haftalık rapor'}
];
export function rutinGetir(magaza){ return oku('rutin:' + magaza, VARSAYILAN_RUTIN.map(r => ({...r}))); }
export function rutinYaz(magaza, liste){ yaz('rutin:' + magaza, liste); }
export function rutinDurumGetir(magaza, haftaAnahtari){ return oku('rutinDurum:' + magaza + ':' + haftaAnahtari, {}); }
export function rutinDurumDegistir(magaza, haftaAnahtari, maddeId){
  const d = rutinDurumGetir(magaza, haftaAnahtari);
  if(d[maddeId]) delete d[maddeId]; else d[maddeId] = true;
  yaz('rutinDurum:' + magaza + ':' + haftaAnahtari, d);
  return d;
}

// Özet panelinde açık olan sekme (gunluk | ayIci | ayToplam)
export function ozetSekmesiGetir(magaza){ return oku('ozetSekme:' + magaza, 'gunluk'); }
export function ozetSekmesiYaz(magaza, sekme){ yaz('ozetSekme:' + magaza, sekme); }

// ---------------- Panel yerleşimi ----------------
// Her mağaza panellerin sırasını ve boyutunu kendi ayarlar.
export function yerlesimGetir(magaza){ return oku('yerlesim:' + magaza, {sira:{}, boyut:{}}); }
export function yerlesimYaz(magaza, v){ yaz('yerlesim:' + magaza, v); }
export function yerlesimBoyutYaz(magaza, panelId, boyut){
  const y = yerlesimGetir(magaza);
  y.boyut = y.boyut || {};
  y.boyut[panelId] = Object.assign({}, y.boyut[panelId], boyut);
  yerlesimYaz(magaza, y);
}
export function yerlesimSiraYaz(magaza, kapId, sira){
  const y = yerlesimGetir(magaza);
  y.sira = y.sira || {};
  y.sira[kapId] = sira;
  yerlesimYaz(magaza, y);
}

// ---------------- Görünüm ayarları ----------------
export function bolgeGorunumGetir(){
  return oku('gorunum:bolge', {metrikler:['ciro','mdo','fbu'], kiyas:'gecenHafta'});
}
export function bolgeGorunumYaz(v){ yaz('gorunum:bolge', v); }
export function satirAyariGetir(){
  return oku('gorunum:satirlar', ['ciro','mdo','fbu','mgs','fbs','hedef','oran','toplu']);
}
export function satirAyariYaz(v){ yaz('gorunum:satirlar', v); }
export function etiketleriGetir(){ return oku('etiketler', [{anahtar:'halı', kart:'Halı satışı'}]); }
// Bu tutarın üzerindeki faturalar "toplu satış" sayılır.
export function topluEsikGetir(){ return oku('topluEsik', 2700); }
export function topluEsikYaz(v){ yaz('topluEsik', v); }
export function etiketleriYaz(v){ yaz('etiketler', v); }

// ---------------- Oturum ----------------
export function oturumGetir(){ return oku('oturum', null); }
export function oturumYaz(key){ yaz('oturum', key ? {key, ts:Date.now()} : null); }
export function oturumSil(){ try{ localStorage.removeItem(ON_EK + 'oturum'); }catch(e){} }

// ---------------- Tohum veri ----------------
// İlk açılışta 20 mağaza, bölge müdürü ve kurucu profili ile 10 haftalık örnek
// veri üretir. Amaç: uygulamadaki her bölümün en az iki dolu örnekle açılması.
// Gerçek veri girilmeye başlayınca bir daha çalışmaz.
const AD_HAVUZU = ['Ahmet','Ayşe','Mehmet','Fatma','Zeynep','Emre','Elif','Burak','Seda','Onur',
                   'Merve','Kerem','Hakan','Sibel','Tuğçe','Serkan','Derya','Okan','Nazlı','Barış'];
const YORUMLAR = [
  'Yol çalışması nedeniyle giriş sayısı düştü.',
  'Hafta sonu kampanyası ciroyu yukarı çekti.',
  'Sabah elektrik kesintisi oldu, kasa iki saat kapalı kaldı.',
  'Karşı caddeye yeni mağaza açıldı, giriş sayısında etkisi var.',
  'Toplu satış siparişi teslim edildi, ciro buradan geldi.',
  'Yağmur nedeniyle akşam saatleri boş geçti.',
  'Deterjan reyonu yenilendi, adetler arttı.',
  'Personel izinli olduğu için kasa tek kişiyle döndü.',
  'Okulların açılması sabah trafiğini artırdı.',
  'Tekstil grubunda stok eksiği yaşandı.'
];
const IZIN_SECENEK = ['Haftalık','Yıllık','Rapor','Ücretsiz'];
const URUN_GRUPLARI = ['Cam','Tekstil','Deterjan','Mutfak','Banyo','Dekorasyon'];

function rastgele(tohum){
  let x = tohum;
  return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
}
const sec = (rnd, liste) => liste[Math.floor(rnd() * liste.length) % liste.length];

export function tohumla(zorla){
  if(!zorla && profilleriGetir().length) return false;

  const renkler = ['#C8A066','#5f8d6a','#6f6494','#a34141','#3f6b8a','#8a6a3f','#4d7d78','#9a5f7a'];
  const profiller = [];
  for(let i=1;i<=20;i++){
    profiller.push({
      key:'m'+i, ad:'Mağaza ' + (2300 + i*7), rol:ROLLER.MAGAZA,
      simge:'🏪', renk:renkler[i % renkler.length], sifre:'1234'
    });
  }
  profiller.push({key:'bolge',  ad:'Bölge Müdürü', rol:ROLLER.BOLGE,  simge:'🗺️', renk:'#3f6b8a', sifre:'1234'});
  profiller.push({key:'kurucu', ad:'Kurucu',       rol:ROLLER.KURUCU, simge:'👑', renk:'#C8A066', sifre:'1234'});
  profilleriYaz(profiller);

  kategorilerYaz([
    {id:'k1', ad:'Cam',         urunler:[{id:'u1',ad:'Cam seti 6lı'},{id:'u2',ad:'Bardak 12li'},{id:'u3',ad:'Sürahi'},{id:'u4',ad:'Kase seti'}]},
    {id:'k2', ad:'Tekstil',     urunler:[{id:'u5',ad:'Havlu seti'},{id:'u6',ad:'Nevresim takımı'},{id:'u7',ad:'Halı 120x180'},{id:'u8',ad:'Paspas'}]},
    {id:'k3', ad:'Deterjan',    urunler:[{id:'u9',ad:'Çamaşır deterjanı'},{id:'u10',ad:'Bulaşık jeli'},{id:'u11',ad:'Yumuşatıcı'},{id:'u12',ad:'Yüzey temizleyici'}]},
    {id:'k4', ad:'Mutfak',      urunler:[{id:'u13',ad:'Tencere seti'},{id:'u14',ad:'Tava 24cm'},{id:'u15',ad:'Saklama kabı'},{id:'u16',ad:'Çaydanlık'}]},
    {id:'k5', ad:'Dekorasyon',  urunler:[{id:'u17',ad:'Mum seti'},{id:'u18',ad:'Çerçeve'},{id:'u19',ad:'Yapay çiçek'}]}
  ]);
  // Her ayarda en az iki örnek olsun.
  etiketleriYaz([
    {anahtar:'halı',     kart:'Halı satışı'},
    {anahtar:'deterjan', kart:'Deterjan adedi'}
  ]);
  bolgeGorunumYaz({metrikler:['ciro','mdo','fbu'], kiyas:'gecenHafta'});

  const bugunD = new Date();
  const buPzt = pazartesi(bugunD);
  const magazaListesi = profiller.filter(p => p.rol === ROLLER.MAGAZA);
  magazalarIcinTohum(magazaListesi, buPzt, bugunD);
  talepleriTohumla(magazaListesi, buPzt);

  // Üç duyuru: en yenisi en üstte görünür.
  yaz('duyurular', [
    {id:'d3', metin:'Bu hafta deterjan grubuna ağırlık veriyoruz, mağaza başı hedef 20 adet.', tarih:new Date(bugunD.getTime() - 2*3600e3).toISOString()},
    {id:'d2', metin:'Pazartesi ürün taleplerini gün sonuna kadar göndermeyi unutmayın.',        tarih:new Date(bugunD.getTime() - 26*3600e3).toISOString()},
    {id:'d1', metin:'Hafta sonu vitrin düzeni yenilenecek, fotoğrafları akşam paylaşın.',        tarih:new Date(bugunD.getTime() - 50*3600e3).toISOString()}
  ]);
  return true;
}

function magazalarIcinTohum(magazaListesi, buPzt, bugunD){
  const bugunStr = dateStr(bugunD);

  magazaListesi.forEach((m, mi) => {
    const rnd = rastgele(1000 + mi * 37);

    // Beş personel; sonuncusu pasif, "ayrılan kişi geçmişte görünür" durumunu gösterir.
    const personel = [0,1,2,3,4].map(i => ({
      id: 'p' + (i+1),
      ad: AD_HAVUZU[(mi*3 + i) % AD_HAVUZU.length],
      aktif: i < 4
    }));
    personelYaz(m.key, personel);

    // Üç kaynak kartı + iki elle girilen kart.
    kartlarYaz(m.key, [
      {id:'ciro',     ad:'Ciro',           alan:'ciro',  tur:'kaynak'},
      {id:'mgs',      ad:'MGS',            alan:'mgs',   tur:'kaynak'},
      {id:'toplu',    ad:'Toplu satış',    alan:'toplu', tur:'kaynak'},
      {id:'hali',     ad:'Halı satışı',    alan:null,    tur:'elle'},
      {id:'deterjan', ad:'Deterjan adedi', alan:null,    tur:'elle'}
    ]);

    const taban = 22000 + Math.floor(rnd() * 20000);

    for(let h = -9; h <= 0; h++){
      const pzt = haftaEkle(buPzt, h);
      const sonIkiHafta = h >= -1;
      haftaHedefYaz(m.key, pzt, Math.round(taban * 7 * (0.95 + rnd()*0.2) / 1000) * 1000);

      // Son iki haftada izinler sabit iki güne, farklı türlerle konur.
      const bugunIdx = (bugunD.getDay() + 6) % 7;
      const izinGunleri = h === 0
        ? [{gun:Math.max(0, bugunIdx - 2), kisi:0, tur:IZIN_SECENEK[0]},
           {gun:bugunIdx,                  kisi:2, tur:IZIN_SECENEK[(mi % 3) + 1]}]
        : (sonIkiHafta
            ? [{gun:1, kisi:0, tur:IZIN_SECENEK[0]}, {gun:4, kisi:2, tur:IZIN_SECENEK[(mi % 3) + 1]}]
            : [{gun:Math.floor(rnd()*7), kisi:Math.floor(rnd()*4), tur:sec(rnd, IZIN_SECENEK)}]);
      // Son iki haftada iki ayrı güne yorum yazılır; içinde bulunulan haftada
      // bugün ve dün seçilir ki sağ paneldeki yorum kutusu dolu açılsın.
      const bugunIndeks = (bugunD.getDay() + 6) % 7;
      const yorumGunleri = h === 0
        ? [Math.max(0, bugunIndeks - 1), bugunIndeks]
        : (sonIkiHafta ? [1, 4] : (rnd() > 0.7 ? [Math.floor(rnd()*7)] : []));

      haftaGunleri(pzt).forEach((gun, gi) => {
        const tarih = dateStr(gun);
        if(tarih > bugunStr) return;              // gelecek günler boş kalır

        const haftaSonu = gi >= 5 ? 1.25 : 1;
        const ciro = Math.round(taban * haftaSonu * (0.75 + rnd()*0.5));
        const mgs  = Math.round(45 + rnd()*55);
        const kayit = {
          ciro,
          mdo: Number((28 + rnd()*30).toFixed(2)),
          fbu: Number((3.4 + rnd()*3).toFixed(2)),
          fbs: Math.round(850 + rnd()*900),
          mgs,
          toplu: Math.round(rnd()*18),
          izinler: izinGunleri.filter(z => z.gun === gi)
                              .map(z => ({personelId: personel[z.kisi].id, tur: z.tur})),
          kartlar: {
            hali: Math.round(2 + rnd()*9),
            deterjan: Math.round(12 + rnd()*28)
          }
        };
        if(yorumGunleri.includes(gi)) kayit.yorum = sec(rnd, YORUMLAR);
        gunYaz(m.key, tarih, kayit);
      });

      // Pazar günü yüklenen ürün Excel'ini taklit eder.
      urunHaftaYaz(m.key, pzt, {
        gruplar: URUN_GRUPLARI.map(ad => ({
          ad,
          adet: Math.round(20 + rnd()*110),
          pay: Number((2 + rnd()*12).toFixed(1))
        })),
        yuklenme: new Date().toISOString()
      });
    }
  });
}

// Son iki hafta için talepler: bir kısmı gönderir, bir kısmı göndermez ki
// pazartesi raporunda hem gönderen hem göndermeyen listesi dolu olsun.
function talepleriTohumla(magazaListesi, buPzt){
  const kategoriler = kategorilerGetir();
  const tumUrunler = kategoriler.flatMap(k => k.urunler || []);
  const liste = [];

  [{pzt: haftaEkle(buPzt, -1), gonderenSayisi: 18, durum:'Karşılandı'},
   {pzt: buPzt,                gonderenSayisi: 13, durum:'Gönderildi'}].forEach((h, hi) => {
    magazaListesi.slice(0, h.gonderenSayisi).forEach((m, mi) => {
      const rnd = rastgele(500 + hi*100 + mi*17);
      const adet = 2 + Math.floor(rnd()*3);
      const secilenler = [];
      for(let i=0;i<adet;i++){
        const u = tumUrunler[Math.floor(rnd()*tumUrunler.length) % tumUrunler.length];
        if(secilenler.some(s => s.urunId === u.id)) continue;
        secilenler.push({urunId:u.id, ad:u.ad, adet: 1 + Math.floor(rnd()*6)});
      }
      const t = new Date(h.pzt); t.setHours(10 + Math.floor(rnd()*7));
      liste.push({
        id: 't' + hi + '_' + m.key,
        magazaKey: m.key,
        hafta: haftaKey(h.pzt),
        tarih: t.toISOString(),
        durum: h.durum,
        satirlar: secilenler
      });
    });
  });
  taleplerYaz(liste);
}

export function hepsiniSil(){
  const silinecek = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && k.startsWith(ON_EK)) silinecek.push(k);
  }
  silinecek.forEach(k => localStorage.removeItem(k));
}
