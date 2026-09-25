// Kurucu paneli: ürün/kategori, kullanıcılar, görünüm ve veri ayarları.
import * as U from './util.js';

// Kullanıcı bölümünün son bildirimi; panel yeniden çizilince korunur.
let sonNot = '';
import * as V from './veri.js';
import { KPI_TANIM } from './hafta.js';
import { kullaniciOlustur, sifreDegistir, dbAl, authAl, girisHatasi, epostaYap, kullaniciAdiYap, KULLANICILAR } from './bulut.js';

export function kurucuPaneli(yenile){
  const kok = U.el(`<div class="kurucu-panel">
    <div class="bolum-ust"><h2>Kurucu ayarları</h2>
      <span class="alt">Mağaza ve bölge ekranlarını üst menüden açabilirsiniz</span></div>
    <div class="kurucu-izgara">
      <div class="panel-kutu"><h3>Ürün / kategori</h3><div class="kategori-yonet"></div>
        <div class="satir-ekle"><input class="yeni-kategori" type="text" placeholder="Yeni kategori"><button class="mini birincil kategori-ekle">+ Ekle</button></div>
      </div>
      <div class="panel-kutu genis"><h3>Kullanıcılar</h3><div class="kullanici-yonet"></div>
        <div class="satir-ekle magaza-ekle-satir">
          <input class="yeni-magaza" type="text" placeholder="Yeni mağaza adı">
          <button class="mini birincil magaza-ekle">+ Mağaza ekle</button>
        </div>
        <p class="aciklama kullanici-not"></p></div>
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
        if(!ad){ U.bosUyar(yeni); return; }
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
    if(!ad){ U.bosUyar(girdi); return; }
    const l = V.kategorilerGetir();
    l.push({id:'k'+Date.now(), ad, urunler:[]});
    V.kategorilerYaz(l);
    girdi.value = '';
    katCiz();
  });

  // --- Kullanıcılar ---
  const kulKutu = kok.querySelector('.kullanici-yonet');
  const kulNotEl = kok.querySelector('.kullanici-not');
  const bulutta = V.bulutAcikMi();
  // yenile() bütün paneli yeniden çizdiği için mesaj modül düzeyinde tutulur.
  const kulNot = { set textContent(v){ sonNot = v; kulNotEl.textContent = v; } ,
                   get textContent(){ return kulNotEl.textContent; } };
  kulNotEl.textContent = sonNot || (bulutta
    ? 'Her mağazanın tek kullanıcısı olur. Kullanıcı adı ve şifreyi siz belirlersiniz; mağaza bunlarla girer ve yalnızca kendi verisini görür.'
    : 'Yerel deneme modundasınız; şifreler yalnızca bu tarayıcıda tutulur.');

  const kulCiz = () => {
    kulKutu.innerHTML = '';
    V.profilleriGetir().forEach(p => {
      const kAdi = p.kullaniciMaili ? kullaniciAdiYap(p.kullaniciMaili) : '';
      const satir = U.el(`<div class="kullanici-satir">
        <span class="k-simge" style="background:${p.renk}">${p.simge || '🏪'}</span>
        <input class="k-ad" type="text" value="${U.esc(p.ad)}" title="Mağaza adı">
        <span class="k-rol">${p.rol}</span>
        ${bulutta
          ? (p.kullaniciMaili
              ? `<span class="k-mail" title="Kullanıcı adı">${U.esc(kAdi)}</span>
                 <input class="k-eski-sifre" type="text" placeholder="mevcut şifre">
                 <input class="k-yeni-sifre2" type="text" placeholder="yeni şifre (6+)">
                 <button class="mini birincil k-degistir">Şifreyi değiştir</button>
                 <button class="mini k-coz">Kullanıcıyı ayır</button>`
              : `<input class="k-yeni-mail" type="text" placeholder="kullanıcı adı"
                        autocapitalize="off" spellcheck="false">
                 <input class="k-yeni-sifre" type="text" placeholder="şifre (6+)">
                 <button class="mini birincil k-ac">Kullanıcı aç</button>`)
          : `<input class="k-sifre-yerel" type="text" value="${U.esc(p.sifre || '')}" title="Şifre">`}
        ${p.rol === V.ROLLER.MAGAZA ? '<button class="mini k-magaza-sil" title="Mağazayı ve bütün verisini sil">🗑</button>' : ''}
      </div>`);
      satir.querySelector('.k-ad').addEventListener('change', function(){
        V.profilGuncelle(p.key, {ad: this.value.trim() || p.ad}); kulCiz(); yenile && yenile();
      });
      const yerelSifre = satir.querySelector('.k-sifre-yerel');
      if(yerelSifre) yerelSifre.addEventListener('change', function(){ V.profilGuncelle(p.key, {sifre: this.value}); });

      // Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir:
      // içeride e-postaya çevrildiği için boşluk ve @ kabul edilmez.
      const acBtn = satir.querySelector('.k-ac');
      if(acBtn) acBtn.addEventListener('click', async () => {
        const adAlan = satir.querySelector('.k-yeni-mail');
        const sifAlan = satir.querySelector('.k-yeni-sifre');
        const ad = adAlan.value.trim().toLowerCase();
        const sifre = sifAlan.value;
        if(!ad){ U.bosUyar(adAlan); kulNot.textContent = 'Kullanıcı adı gerekli.'; return; }
        if(!/^[a-z0-9._-]+$/.test(ad)){
          U.bosUyar(adAlan);
          kulNot.textContent = 'Kullanıcı adında yalnızca harf, rakam, nokta, tire ve alt çizgi olabilir (boşluk ve @ olmaz).';
          return;
        }
        if(sifre.length < 6){ U.bosUyar(sifAlan); kulNot.textContent = 'Şifre en az 6 karakter olmalı.'; return; }
        if(V.profilleriGetir().some(x => x.kullaniciMaili === epostaYap(ad))){
          U.bosUyar(adAlan); kulNot.textContent = 'Bu kullanıcı adı başka bir mağazada kullanılıyor.'; return;
        }
        acBtn.disabled = true; acBtn.textContent = 'Açılıyor...';
        try{
          const uid = await kullaniciOlustur(epostaYap(ad), sifre);
          await dbAl().collection(KULLANICILAR).doc(uid).set({
            eposta: epostaYap(ad), rol: p.rol, magazaKey: p.rol === V.ROLLER.MAGAZA ? p.key : null
          });
          V.profilGuncelle(p.key, {kullaniciMaili: epostaYap(ad)});
          kulNot.textContent = p.ad + ' → kullanıcı adı "' + ad + '", şifre "' + sifre + '". Bu bilgiyi mağazaya verin.';
          kulCiz();
        }catch(e){
          kulNot.textContent = girisHatasi(e);
          acBtn.disabled = false; acBtn.textContent = 'Kullanıcı aç';
        }
      });

      // Tarayıcıdan başkasının şifresi ancak mevcut şifresi bilinerek değişir.
      const degistirBtn = satir.querySelector('.k-degistir');
      if(degistirBtn) degistirBtn.addEventListener('click', async () => {
        const eskiAlan = satir.querySelector('.k-eski-sifre');
        const yeniAlan = satir.querySelector('.k-yeni-sifre2');
        if(!eskiAlan.value){ U.bosUyar(eskiAlan); kulNot.textContent = 'Mevcut şifre gerekli.'; return; }
        if(yeniAlan.value.length < 6){ U.bosUyar(yeniAlan); kulNot.textContent = 'Yeni şifre en az 6 karakter olmalı.'; return; }
        degistirBtn.disabled = true; degistirBtn.textContent = 'Değiştiriliyor...';
        try{
          await sifreDegistir(p.kullaniciMaili, eskiAlan.value, yeniAlan.value);
          kulNot.textContent = p.ad + ' şifresi değiştirildi. Yeni şifre: ' + yeniAlan.value;
          kulCiz();
        }catch(e){
          kulNot.textContent = girisHatasi(e);
          degistirBtn.disabled = false; degistirBtn.textContent = 'Şifreyi değiştir';
        }
      });

      // Şifre tamamen unutulduysa: kullanıcıyı mağazadan ayır, konsoldan hesabı
      // sil, sonra yeni kullanıcı adı ve şifreyle yeniden aç.
      const cozBtn = satir.querySelector('.k-coz');
      if(cozBtn) cozBtn.addEventListener('click', async () => {
        const adYedek = kullaniciAdiYap(p.kullaniciMaili);
        const mailYedek = p.kullaniciMaili;
        if(!confirm(p.ad + ' ile "' + adYedek + '" kullanıcısının bağlantısı kaldırılacak.\n\n' +
          'Mağazanın verisi silinmez. Ardından buradan yeni kullanıcı adı ve şifreyle yeniden açabilirsiniz.\n\n' +
          'Devam edilsin mi?')) return;
        try{
          const snap = await dbAl().collection(KULLANICILAR).where('magazaKey','==',p.key).get();
          const yigin = dbAl().batch();
          snap.forEach(d => yigin.delete(dbAl().collection(KULLANICILAR).doc(d.id)));
          await yigin.commit();
          V.profilGuncelle(p.key, {kullaniciMaili: null});
          kulNot.textContent = adYedek + ' ayrıldı. Aynı kullanıcı adını yeniden kullanmak isterseniz önce ' +
            'Firebase Console → Authentication → Users bölümünden ' + mailYedek + ' hesabını silin.';
          kulCiz();
        }catch(e){ kulNot.textContent = girisHatasi(e); }
      });

      // Mağazayı tamamen silme: bütün günlük veri, hedef, personel ve rutin gider.
      const magSilBtn = satir.querySelector('.k-magaza-sil');
      if(magSilBtn) magSilBtn.addEventListener('click', () => {
        if(!confirm(p.ad + ' silinecek.\n\nBu mağazanın bütün günlük verisi, hedefleri, personeli ve ' +
          'rutin listesi kalıcı olarak gidecek. Geri alınamaz.\n\nDevam edilsin mi?')) return;
        V.magazaSil(p.key);
        kulNot.textContent = p.ad + ' ve verisi silindi.' +
          (p.kullaniciMaili ? ' Kullanıcı hesabını Firebase Console → Authentication → Users bölümünden silin.' : '');
        kulCiz(); yenile && yenile();
      });
      kulKutu.appendChild(satir);
    });
  };
  kulCiz();

  const magazaAlan = kok.querySelector('.yeni-magaza');
  kok.querySelector('.magaza-ekle').addEventListener('click', () => {
    const ad = magazaAlan.value.trim();
    if(!ad){ U.bosUyar(magazaAlan); return; }
    if(V.profilleriGetir().some(p => p.ad.toLowerCase() === ad.toLowerCase())){
      U.bosUyar(magazaAlan); kulNot.textContent = 'Bu adda bir mağaza zaten var.'; return;
    }
    const yeniM = V.magazaEkle(ad);
    magazaAlan.value = '';
    kulNot.textContent = yeniM.ad + ' eklendi. Şimdi karşısındaki alanlara kullanıcı adı ve şifre yazıp "Kullanıcı aç" deyin.';
    kulCiz(); yenile && yenile();
  });

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
    if(!a || !k){ U.bosUyar(kok.querySelector(a ? '.e-kart' : '.e-anahtar')); return; }
    V.etiketleriYaz(V.etiketleriGetir().concat({anahtar:a, kart:k}));
    kok.querySelector('.e-anahtar').value = '';
    kok.querySelector('.e-kart').value = '';
    etCiz();
  });

  return kok;
}
