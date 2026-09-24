// Kurucu paneli: ürün/kategori, kullanıcılar, görünüm ve veri ayarları.
import * as U from './util.js';
import * as V from './veri.js';
import { KPI_TANIM } from './hafta.js';

export function kurucuPaneli(yenile){
  const kok = U.el(`<div class="kurucu-panel">
    <div class="bolum-ust"><h2>Kurucu ayarları</h2>
      <span class="alt">Mağaza ve bölge ekranlarını üst menüden açabilirsiniz</span></div>
    <div class="kurucu-izgara">
      <div class="panel-kutu"><h3>Ürün / kategori</h3><div class="kategori-yonet"></div>
        <div class="satir-ekle"><input class="yeni-kategori" type="text" placeholder="Yeni kategori"><button class="mini birincil kategori-ekle">+ Ekle</button></div>
      </div>
      <div class="panel-kutu"><h3>Kullanıcılar</h3><div class="kullanici-yonet"></div></div>
      <div class="panel-kutu"><h3>Görünür KPI satırları</h3><div class="satir-ayar"></div>
        <p class="aciklama">Mağaza tablolarında hangi satırların görüneceğini belirler.</p></div>
      <div class="panel-kutu"><h3>Toplu satış eşiği</h3>
        <label class="esik-satir">Bu tutarın üzerindeki faturalar toplu satış sayılır:
          <input type="text" inputmode="numeric" class="toplu-esik" value="${V.topluEsikGetir()}"> ₺</label>
        <p class="aciklama">Yapıştırma sırasında kaynak sayfadaki fatura listesi bu eşiğe göre toplanır.</p>
      </div>
      <div class="panel-kutu"><h3>Etiketler</h3><div class="etiket-yonet"></div>
        <div class="satir-ekle"><input class="e-anahtar" type="text" placeholder="halı"><input class="e-kart" type="text" placeholder="Halı satışı"><button class="mini birincil etiket-ekle">+ Ekle</button></div>
        <p class="aciklama">Ürün satırlarında anahtar kelime geçen kayıtlar bu kartta toplanır.</p></div>
    </div>
  </div>`);

  // --- Kategoriler ---
  const katKutu = kok.querySelector('.kategori-yonet');
  const katCiz = () => {
    const liste = V.kategorilerGetir();
    katKutu.innerHTML = liste.length ? '' : '<div class="menu-bos">Kategori yok.</div>';
    liste.forEach(kat => {
      const blok = U.el(`<div class="kategori-blok">
        <div class="kategori-ust">
          <input class="kat-ad" type="text" value="${U.esc(kat.ad)}">
          <button class="mini kat-sil" title="Kategoriyi sil">✕</button>
        </div>
        <div class="kat-urunler"></div>
        <div class="satir-ekle kucuk"><input class="yeni-urun" type="text" placeholder="Yeni ürün"><button class="mini urun-ekle">+</button></div>
      </div>`);
      const urunKap = blok.querySelector('.kat-urunler');
      (kat.urunler || []).forEach(u => {
        const satir = U.el(`<div class="kat-urun"><input type="text" value="${U.esc(u.ad)}"><button class="mini" title="Sil">✕</button></div>`);
        satir.querySelector('input').addEventListener('change', function(){
          const l = V.kategorilerGetir();
          const k = l.find(x => x.id === kat.id);
          const uu = k.urunler.find(x => x.id === u.id);
          uu.ad = this.value.trim() || uu.ad;
          V.kategorilerYaz(l); katCiz();
        });
        satir.querySelector('button').addEventListener('click', () => {
          const l = V.kategorilerGetir();
          const k = l.find(x => x.id === kat.id);
          k.urunler = k.urunler.filter(x => x.id !== u.id);
          V.kategorilerYaz(l); katCiz();
        });
        urunKap.appendChild(satir);
      });
      blok.querySelector('.kat-ad').addEventListener('change', function(){
        const l = V.kategorilerGetir();
        const k = l.find(x => x.id === kat.id);
        k.ad = this.value.trim() || k.ad;
        V.kategorilerYaz(l); katCiz();
      });
      blok.querySelector('.kat-sil').addEventListener('click', () => {
        if(!confirm(kat.ad + ' kategorisi ve ürünleri silinecek. Devam?')) return;
        V.kategorilerYaz(V.kategorilerGetir().filter(x => x.id !== kat.id)); katCiz();
      });
      const yeni = blok.querySelector('.yeni-urun');
      const urunEkle = () => {
        const ad = yeni.value.trim();
        if(!ad) return;
        const l = V.kategorilerGetir();
        const k = l.find(x => x.id === kat.id);
        k.urunler = k.urunler || [];
        k.urunler.push({id:'u'+Date.now(), ad});
        V.kategorilerYaz(l); katCiz();
      };
      blok.querySelector('.urun-ekle').addEventListener('click', urunEkle);
      yeni.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); urunEkle(); } });
      katKutu.appendChild(blok);
    });
  };
  katCiz();
  kok.querySelector('.kategori-ekle').addEventListener('click', () => {
    const girdi = kok.querySelector('.yeni-kategori');
    const ad = girdi.value.trim();
    if(!ad) return;
    const l = V.kategorilerGetir();
    l.push({id:'k'+Date.now(), ad, urunler:[]});
    V.kategorilerYaz(l);
    girdi.value = '';
    katCiz();
  });

  // --- Kullanıcılar ---
  const kulKutu = kok.querySelector('.kullanici-yonet');
  const kulCiz = () => {
    kulKutu.innerHTML = '';
    V.profilleriGetir().forEach(p => {
      const satir = U.el(`<div class="kullanici-satir">
        <span class="k-simge" style="background:${p.renk}">${p.simge || '🏪'}</span>
        <input class="k-ad" type="text" value="${U.esc(p.ad)}">
        <span class="k-rol">${p.rol}</span>
        <input class="k-sifre" type="text" value="${U.esc(p.sifre || '')}" title="Şifre">
      </div>`);
      satir.querySelector('.k-ad').addEventListener('change', function(){
        V.profilGuncelle(p.key, {ad: this.value.trim() || p.ad}); kulCiz(); yenile && yenile();
      });
      satir.querySelector('.k-sifre').addEventListener('change', function(){
        V.profilGuncelle(p.key, {sifre: this.value});
      });
      kulKutu.appendChild(satir);
    });
  };
  kulCiz();

  // --- Görünür satırlar ---
  const satirKutu = kok.querySelector('.satir-ayar');
  const satirCiz = () => {
    const secili = V.satirAyariGetir();
    satirKutu.innerHTML = '';
    KPI_TANIM.forEach(k => {
      const b = U.el(`<button class="mini ${secili.includes(k.id) ? 'secili' : ''}">${k.ad}</button>`);
      b.addEventListener('click', () => {
        const s = V.satirAyariGetir();
        const yeni = s.includes(k.id) ? s.filter(x => x !== k.id) : s.concat(k.id);
        V.satirAyariYaz(yeni.length ? yeni : ['ciro']);
        satirCiz();
      });
      satirKutu.appendChild(b);
    });
  };
  satirCiz();

  // --- Toplu satış eşiği ---
  kok.querySelector('.toplu-esik').addEventListener('change', function(){
    const v = U.metniSayiyaCevir(this.value);
    if(v === null || v < 0){ this.value = V.topluEsikGetir(); return; }
    V.topluEsikYaz(v);
    this.value = v;
  });

  // --- Etiketler ---
  const etKutu = kok.querySelector('.etiket-yonet');
  const etCiz = () => {
    const liste = V.etiketleriGetir();
    etKutu.innerHTML = liste.length ? '' : '<div class="menu-bos">Etiket yok.</div>';
    liste.forEach((e, i) => {
      const satir = U.el(`<div class="etiket-satir"><code>${U.esc(e.anahtar)}</code> → <span>${U.esc(e.kart)}</span><button class="mini" title="Sil">✕</button></div>`);
      satir.querySelector('button').addEventListener('click', () => {
        const l = V.etiketleriGetir(); l.splice(i,1); V.etiketleriYaz(l); etCiz();
      });
      etKutu.appendChild(satir);
    });
  };
  etCiz();
  kok.querySelector('.etiket-ekle').addEventListener('click', () => {
    const a = kok.querySelector('.e-anahtar').value.trim();
    const k = kok.querySelector('.e-kart').value.trim();
    if(!a || !k) return;
    V.etiketleriYaz(V.etiketleriGetir().concat({anahtar:a, kart:k}));
    kok.querySelector('.e-anahtar').value = '';
    kok.querySelector('.e-kart').value = '';
    etCiz();
  });

  return kok;
}
