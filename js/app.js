// Uygulama iskeleti: profil girişi, üst çubuk, sayfa yönlendirme.
import * as U from './util.js';
import * as V from './veri.js';
import { magazaEkrani, yapistirPenceresi, personelPenceresi, seciliHafta, haftaSec } from './magaza.js';
import { bolgePaneli } from './bolge.js';
import { kurucuPaneli } from './kurucu.js';
import { talepEkrani, urunTalepListesi, talepRaporu } from './talep.js';
import { pencere, kapat } from './pencere.js';
import { baglan, bulutVarMi, authAl, dbAl, girisHatasi, epostaYap, kullaniciAdiYap, KULLANICILAR, KULLANICI_ALANI } from './bulut.js';
import { yerlesimSifirla, TASINABILIR } from './yerlesim.js';
import { TEMALAR, temaGetir, temaYaz, temaUygula } from './tema.js';
import { SURUM, sunucuSurumu, guncelle } from './surum.js';

const kokEl = document.getElementById('kok');
let aktif = null;            // aktif profil
let sayfa = 'ana';           // ana | talep | talep-rapor | bolge | kurucu
let kurucuMagaza = null;     // kurucu bir mağazayı incelerken
let bulutKullanicisi = null; // {uid, eposta, rol, magazaKey}

// ---------------- Giriş ----------------
// Bulut açıkken e-posta/şifre; Firebase yoksa (tek dosya, çevrimdışı deneme)
// eski profil seçim ekranı devrede kalır.
const YONETICI_EPOSTALARI = ['osmanonurmrt@gmail.com'];

function bulutGirisEkrani(mesaj, iyiMi){
  const kok = U.el(`<div class="giris-ekran">
    <div class="giris-kutu">
      <div class="giris-logo"></div>
      <h1>Mağaza Performans Takip</h1>
      <label class="giris-etiket">Kullanıcı adı</label>
      <input type="text" id="girisEposta" class="giris-girdi" autocomplete="username"
             autocapitalize="off" spellcheck="false">
      <label class="giris-etiket">Şifre</label>
      <input type="password" id="girisSifre" class="giris-girdi" autocomplete="current-password">
      <div class="giris-hata ${iyiMi ? 'iyi' : ''}">${U.esc(mesaj || '')}</div>
      <button class="mini birincil giris-btn">Giriş yap</button>
      <button class="giris-bag" id="sifreUnuttum">Şifremi unuttum</button>
      <p class="giris-not">Kullanıcı adınızı ve şifrenizi kurucunuz verir.</p>
    </div>
  </div>`);
  const simge = document.querySelector('link[rel="icon"]');
  if(simge) kok.querySelector('.giris-logo').style.backgroundImage = `url("${simge.href}")`;

  const mail = kok.querySelector('#girisEposta');
  const sifre = kok.querySelector('#girisSifre');
  const hata = kok.querySelector('.giris-hata');
  const btn = kok.querySelector('.giris-btn');

  const dene = async () => {
    hata.className = 'giris-hata';
    if(!mail.value.trim() || !sifre.value){ hata.textContent = 'Kullanıcı adı ve şifre gerekli.'; return; }
    btn.disabled = true; btn.textContent = 'Giriş yapılıyor...';
    try{ await authAl().signInWithEmailAndPassword(epostaYap(mail.value), sifre.value); }
    catch(e){ hata.textContent = girisHatasi(e); }
    btn.disabled = false; btn.textContent = 'Giriş yap';
  };
  btn.addEventListener('click', dene);
  [mail, sifre].forEach(i => i.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); dene(); }
  }));
  kok.querySelector('#sifreUnuttum').addEventListener('click', async () => {
    const ad = mail.value.trim();
    if(!ad){ hata.textContent = 'Önce kullanıcı adınızı yazın.'; return; }
    // Kullanıcı adları yapay bir alan adı kullandığı için onlara posta gitmez.
    if(!ad.includes('@')){
      hata.className = 'giris-hata';
      hata.textContent = 'Kullanıcı adlarına posta gönderilemez. Şifrenizi kurucunuz değiştirir.';
      return;
    }
    try{
      await authAl().sendPasswordResetEmail(ad);
      hata.className = 'giris-hata iyi';
      hata.textContent = 'Sıfırlama bağlantısı gönderildi.';
    }catch(e){ hata.className = 'giris-hata'; hata.textContent = girisHatasi(e); }
  });
  setTimeout(() => mail.focus(), 60);
  return kok;
}

// Kullanıcı ↔ mağaza eşlemesi; yönetici e-postası ilk girişte kendini oluşturur.
async function kullaniciBaglami(user){
  const db = dbAl();
  const eposta = (user.email || '').toLowerCase();
  const sabitYonetici = YONETICI_EPOSTALARI.includes(eposta);
  let doc;
  try{
    doc = await db.collection(KULLANICILAR).doc(user.uid).get();
  }catch(e){
    // Kural hatası: kayıt olmadığı için değil, kural kendi kaydını okumaya
    // izin vermediği için gelir. Karıştırmamak adına ayrı mesaj.
    throw new Error('Kullanıcı kaydınız okunamadı (' + (e.code || e.message) + '). ' +
      'Firestore kurallarının güncel sürümü yüklü olmayabilir.');
  }
  if(!doc.exists && sabitYonetici){
    await db.collection(KULLANICILAR).doc(user.uid).set({eposta, rol:V.ROLLER.KURUCU, magazaKey:null});
    doc = await db.collection(KULLANICILAR).doc(user.uid).get();
  }
  const veri = doc.exists ? (doc.data() || {}) : {};
  return {
    uid: user.uid, eposta,
    rol: sabitYonetici ? V.ROLLER.KURUCU : (veri.rol || null),
    magazaKey: veri.magazaKey || null,
    kayitliMi: doc.exists
  };
}

// signOut() onAuthStateChanged'i tetikler ve giriş ekranını yeniden çizer;
// mesaj kaybolmasın diye burada bekletilir.
let bekleyenMesaj = '';
async function cikisYap(mesaj){
  bekleyenMesaj = mesaj || '';
  V.bulutuKapat();
  await authAl().signOut();
  ciz(bulutGirisEkrani(bekleyenMesaj));
}

function eposta_ipucu(baglam){
  return 'Bu kullanıcı (' + kullaniciAdiYap(baglam.eposta) + ') hiçbir mağazaya bağlı değil.\n' +
    'Kurucu → Ayarlar → Kullanıcılar bölümünden bu kullanıcıyı bir mağazaya bağlayın.';
}

// Girişten sonra: veriyi yükle, aktif profili belirle, uygulamayı çiz.
async function bulutOturumuAc(user){
  ciz(U.el('<div class="acilis">Veriler yükleniyor…</div>'));
  const baglam = await kullaniciBaglami(user);
  if(!baglam.rol){
    await cikisYap(eposta_ipucu(baglam));
    return;
  }
  await V.veriYukle(baglam);

  const profiller = V.profilleriGetir();
  if(!profiller.length){
    // Henüz kurulum yapılmamış: yalnızca kurucu tohumlayabilir.
    if(baglam.rol === V.ROLLER.KURUCU){ ciz(kurulumEkrani(user)); return; }
    await cikisYap('Sistem henüz kurulmamış. Kurucunun ilk kurulumu yapması gerekiyor.');
    return;
  }
  aktif = baglam.rol === V.ROLLER.MAGAZA
    ? V.profilGetir(baglam.magazaKey)
    : (profiller.find(p => p.rol === baglam.rol) || {key:baglam.rol, ad:baglam.eposta, rol:baglam.rol, simge:'👤', renk:'#3f6b8a'});
  if(!aktif){
    await cikisYap('Hesabınıza bağlı mağaza (' + baglam.magazaKey + ') profil listesinde yok.');
    return;
  }
  bulutKullanicisi = baglam;
  sayfa = varsayilanSayfa(aktif);
  kurucuMagaza = null;
  uygulamaCiz();
}

// Kurucu ilk girişte örnek veriyi buluta yazabilsin.
function kurulumEkrani(user){
  const kok = U.el(`<div class="giris-ekran">
    <div class="giris-kutu genis">
      <h1>İlk kurulum</h1>
      <p class="giris-aciklama">Bulutta henüz veri yok. Aşağıdaki düğme 20 mağaza,
        bölge müdürü ve kurucu profillerini, kategorileri ve yaklaşık 10 haftalık
        örnek veriyi Firestore'a yazar. Sonra mağaza kullanıcılarını
        Kurucu → Kullanıcılar bölümünden açarsınız.</p>
      <div class="giris-hata"></div>
      <button class="mini birincil kur-btn">Örnek veriyi buluta yaz</button>
      <button class="giris-bag" id="kurCik">Çıkış yap</button>
    </div>
  </div>`);
  const hata = kok.querySelector('.giris-hata');
  const btn = kok.querySelector('.kur-btn');
  btn.addEventListener('click', async () => {
    btn.disabled = true; btn.textContent = 'Yazılıyor...';
    try{
      const adet = await V.bulutaTohumla();
      hata.className = 'giris-hata iyi';
      hata.textContent = adet + ' kayıt yazıldı. Uygulama açılıyor...';
      const kimlik = authAl().currentUser || user;
      setTimeout(() => { bulutOturumuAc(kimlik); }, 600);
    }catch(e){
      hata.className = 'giris-hata';
      hata.textContent = girisHatasi(e);
      btn.disabled = false; btn.textContent = 'Örnek veriyi buluta yaz';
    }
  });
  kok.querySelector('#kurCik').addEventListener('click', () => authAl().signOut());
  return kok;
}

// --- Firebase yokken: eski yerel profil ekranı ---
function girisEkrani(secilenKey){
  const profiller = V.profilleriGetir();
  const secilen = secilenKey ? V.profilGetir(secilenKey) : null;

  const kok = U.el(`<div class="giris-ekran">
    <h1>Kim kullanıyor?</h1>
    <div class="profil-izgara"></div>
    <div class="giris-sifre" style="display:${secilen ? '' : 'none'}">
      <div class="secilen-profil">
        <span class="p-simge" style="background:${secilen ? secilen.renk : ''}">${secilen ? secilen.simge : ''}</span>
        <span>${secilen ? U.esc(secilen.ad) : ''}</span>
      </div>
      <input type="password" class="sifre-girdi" placeholder="Şifre" autocomplete="current-password">
      <button class="mini birincil giris-btn">Giriş</button>
      <button class="mini geri-btn">← Geri</button>
      <div class="giris-hata"></div>
    </div>
    <p class="giris-not">Yerel deneme modu — Firebase bağlantısı yok. Örnek şifre: 1234</p>
  </div>`);

  const izgara = kok.querySelector('.profil-izgara');
  profiller.forEach(p => {
    const kart = U.el(`<button class="profil-kart ${p.rol !== 'magaza' ? 'ozel' : ''}" data-key="${p.key}">
      <span class="p-simge" style="background:${p.renk}">${p.simge}</span>
      <span class="p-ad">${U.esc(p.ad)}</span>
    </button>`);
    kart.addEventListener('click', () => ciz(girisEkrani(p.key)));
    izgara.appendChild(kart);
  });

  if(secilen){
    const girdi = kok.querySelector('.sifre-girdi');
    const hata = kok.querySelector('.giris-hata');
    const dene = () => {
      if(girdi.value === (secilen.sifre || '')){
        V.oturumYaz(secilen.key);
        aktif = secilen;
        sayfa = varsayilanSayfa(secilen);
        uygulamaCiz();
      } else {
        hata.textContent = 'Şifre yanlış.';
        girdi.value = '';
        girdi.focus();
      }
    };
    kok.querySelector('.giris-btn').addEventListener('click', dene);
    kok.querySelector('.geri-btn').addEventListener('click', () => ciz(girisEkrani(null)));
    girdi.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); dene(); } });
    setTimeout(() => girdi.focus(), 60);
  }
  return kok;
}

function varsayilanSayfa(profil){
  if(profil.rol === V.ROLLER.BOLGE)  return 'bolge';
  if(profil.rol === V.ROLLER.KURUCU) return 'kurucu';
  return 'ana';
}

// ---------------- Üst çubuk ----------------
function ustCubuk(){
  const magazaGibi = aktif.rol === V.ROLLER.MAGAZA || (aktif.rol === V.ROLLER.KURUCU && kurucuMagaza);
  const menu = [];
  if(aktif.rol === V.ROLLER.MAGAZA){
    menu.push(['ana','Ana Sayfa'], ['talep','Ürün Talepleri']);
  } else if(aktif.rol === V.ROLLER.BOLGE){
    menu.push(['bolge','Özet'], ['talep-rapor','Ürün Talepleri']);
  } else {
    menu.push(['kurucu','Ayarlar'], ['bolge','Bölge Görünümü'], ['ana','Mağaza Ekranı'], ['talep-rapor','Ürün Talepleri']);
  }

  const kok = U.el(`<header class="ust-cubuk">
    <button class="ust-logo" title="Ana sayfaya dön"><img alt="Mağaza Performans Takip"></button>
    <button class="surum-rozet" title="Sürüm — güncelleme için tıklayın">v${SURUM}</button>
    <nav class="menu">${menu.map(([k,a]) => `<button class="menu-btn ${sayfa===k?'secili':''}" data-sayfa="${k}">${a}</button>`).join('')}</nav>
    <div class="ust-orta"></div>
    <div class="ust-sag">
      ${magazaGibi ? '<button class="mini birincil" data-yapistir="1">⬇ Yapıştır / Veri Ekle</button>' : ''}
      <button class="profil-rozet" title="Profil">
        <span class="p-simge kucuk" style="background:${aktif.renk}">${aktif.simge}</span>
        <span>${U.esc(kurucuMagaza ? V.profilGetir(kurucuMagaza).ad : aktif.ad)}</span>
      </button>
    </div>
  </header>`);

  if(aktif.rol === V.ROLLER.KURUCU){
    const sec = U.el(`<select class="magaza-sec">
      <option value="">— mağaza seç —</option>
      ${V.magazalar().map(m => `<option value="${m.key}" ${kurucuMagaza===m.key?'selected':''}>${U.esc(m.ad)}</option>`).join('')}
    </select>`);
    sec.addEventListener('change', () => {
      kurucuMagaza = sec.value || null;
      if(kurucuMagaza) sayfa = 'ana';
      uygulamaCiz();
    });
    kok.querySelector('.ust-orta').appendChild(sec);
  }

  kok.querySelectorAll('[data-sayfa]').forEach(b => b.addEventListener('click', () => {
    sayfa = b.dataset.sayfa;
    uygulamaCiz();
  }));
  const yap = kok.querySelector('[data-yapistir]');
  if(yap) yap.addEventListener('click', () => yapistirPenceresi(aktifMagaza(), uygulamaCiz));
  // Logo, tarayıcı sekmesindeki simgenin aynısı; tıklayınca ana sayfaya döner.
  const logo = kok.querySelector('.ust-logo');
  const simge = document.querySelector('link[rel="icon"]');
  if(simge) logo.querySelector('img').src = simge.href;
  logo.addEventListener('click', () => {
    sayfa = varsayilanSayfa(aktif);
    uygulamaCiz();
  });

  kok.querySelector('.profil-rozet').addEventListener('click', profilMenusu);
  surumRozetiKur(kok.querySelector('.surum-rozet'));
  return kok;
}

// Sürüm rozeti. Sunucuda daha yeni sürüm varsa yukarı ok çıkar; tıklayınca
// önbellek temizlenip yeni sürüm yüklenir.
let yeniSurum = null;          // bulunan sunucu sürümü (yoksa null)
function surumRozetiKur(rozet){
  if(!rozet) return;
  const ciz = () => {
    rozet.classList.remove('guncel');
    if(yeniSurum && yeniSurum > SURUM){
      rozet.classList.add('guncelleme');
      rozet.innerHTML = 'v' + yeniSurum + ' <span class="surum-ok">↑</span>';
      rozet.title = 'Yeni sürüm hazır (v' + yeniSurum + ') — yüklemek için tıklayın';
    } else {
      rozet.classList.remove('guncelleme');
      rozet.textContent = 'v' + SURUM;
      rozet.title = 'Sürüm v' + SURUM + ' — güncelleme aramak için tıklayın';
    }
  };
  ciz();

  rozet.addEventListener('click', async () => {
    if(yeniSurum && yeniSurum > SURUM){ rozet.textContent = '...'; await guncelle(); return; }
    rozet.textContent = '...';
    yeniSurum = await sunucuSurumu();
    ciz();
    if(!(yeniSurum && yeniSurum > SURUM)){
      rozet.classList.add('guncel');
      rozet.title = yeniSurum === null
        ? 'Sunucuya ulaşılamadı; çevrimdışı olabilirsiniz.'
        : 'Son sürümü kullanıyorsunuz (v' + SURUM + ').';
      setTimeout(() => rozet.classList.remove('guncel'), 2000);
    }
  });
}

// Açılışta ve yarım saatte bir sessiz kontrol.
async function surumKontrolSessiz(){
  const s = await sunucuSurumu();
  if(s === null) return;
  const oncekiyleAyni = yeniSurum === s;
  yeniSurum = s;
  // Giriş ekranındayken çizim yapılmaz; rozet zaten üst çubukta.
  if(!oncekiyleAyni && s > SURUM && aktif) uygulamaCiz();
}

// Ölçü modu: ekran görüntüsü üzerinde konuşabilmek için her bloğun piksel
// ölçüsünü ve 100 px'lik bir referans kareyi gösterir.
function olcuModu(){
  const acik = document.body.classList.toggle('olcu-modu');
  document.querySelectorAll('.olcu-etiket,.olcu-referans').forEach(x => x.remove());
  if(!acik) return;

  const ref = U.el(`<div class="olcu-referans"><span>100 px</span></div>`);
  document.body.appendChild(ref);

  const yaz = () => {
    document.querySelectorAll('.olcu-etiket').forEach(x => x.remove());
    document.querySelectorAll('.tuval-blok,.hafta-tablo,.ozet-tablo,.panel-kutu').forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.width < 40 || r.height < 24) return;
      const et = U.el(`<div class="olcu-etiket">${Math.round(r.width)} × ${Math.round(r.height)}</div>`);
      et.style.top  = (window.scrollY + r.top + 2) + 'px';
      et.style.left = (window.scrollX + r.left + 2) + 'px';
      document.body.appendChild(et);
    });
  };
  yaz();
  const tekrar = () => { if(document.body.classList.contains('olcu-modu')) yaz(); };
  window.addEventListener('resize', tekrar);
  window.addEventListener('scroll', tekrar);
}

function profilMenusu(e){
  e.stopPropagation();
  document.querySelectorAll('.acilir-menu').forEach(m => m.remove());
  const menu = U.el(`<div class="acilir-menu profil-menu">
    ${aktif.rol === V.ROLLER.MAGAZA ? '<button data-act="personel">👥 Personel</button>' : ''}
    ${TASINABILIR ? '<button data-act="yerlesim">🧩 Panel yerleşimini sıfırla</button>' : ''}
    ${bulutKullanicisi ? '' : '<button data-act="sifirla">♻ Örnek veriyi yenile</button>'}
    <div class="menu-ayrac"></div>
    <div class="menu-baslik">🎨 Tema</div>
    <div class="tema-liste">
      ${TEMALAR.map(t => `<button class="tema-secim ${t.id === temaGetir() ? 'secili' : ''}" data-tema="${t.id}">
        <span class="tema-ornek">${t.ornek.map(r => `<i style="background:${r}"></i>`).join('')}</span>
        <span>${t.ad}</span>
      </button>`).join('')}
    </div>
    <div class="menu-ayrac"></div>
    <button data-act="olcu">📐 Ölçü modu ${document.body.classList.contains('olcu-modu') ? '(açık)' : ''}</button>
    <button data-act="cikis">🚪 ${bulutKullanicisi ? 'Çıkış yap' : 'Profil değiştir'}</button>
  </div>`);

  // Tema seçimi menüyü kapatmaz: yan yana deneyebilsin.
  menu.querySelectorAll('[data-tema]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    temaYaz(b.dataset.tema);
    menu.querySelectorAll('[data-tema]').forEach(x => x.classList.toggle('secili', x === b));
  }));
  menu.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
    menu.remove();
    if(b.dataset.act === 'personel') personelPenceresi(aktifMagaza(), uygulamaCiz);
    if(b.dataset.act === 'olcu') olcuModu();
    if(b.dataset.act === 'yerlesim'){ yerlesimSifirla(aktifMagaza()); uygulamaCiz(); }
    if(b.dataset.act === 'cikis'){
      if(bulutVarMi() && authAl() && authAl().currentUser){ V.bulutuKapat(); authAl().signOut(); }
      else { V.oturumSil(); aktif = null; kurucuMagaza = null; ciz(girisEkrani(null)); }
    }
    if(b.dataset.act === 'sifirla'){
      if(!confirm('Bütün yerel veri silinip örnek veri yeniden üretilecek. Devam?')) return;
      V.hepsiniSil(); V.tohumla(true); V.oturumSil(); aktif = null; ciz(girisEkrani(null));
    }
  }));
  document.body.appendChild(menu);
  const r = e.currentTarget.getBoundingClientRect();
  menu.style.top = (window.scrollY + r.bottom + 6) + 'px';
  menu.style.left = Math.min(r.left, window.innerWidth - 220) + 'px';
  setTimeout(() => document.addEventListener('click', function k(){ menu.remove(); document.removeEventListener('click', k); }, {once:true}), 0);
}

function aktifMagaza(){
  if(aktif.rol === V.ROLLER.MAGAZA) return aktif.key;
  return kurucuMagaza || (V.magazalar()[0] || {}).key;
}

// ---------------- Sayfalar ----------------
function sayfaIcerigi(){
  if(sayfa === 'bolge')       return bolgePaneli(seciliHafta(), sonuc => {
    if(sonuc && sonuc.magazaDetay){ kurucuMagaza = sonuc.magazaDetay; sayfa = 'ana'; }
    uygulamaCiz();
  });
  if(sayfa === 'kurucu')      return kurucuPaneli(uygulamaCiz);
  if(sayfa === 'talep')       return talepEkrani(aktifMagaza(), uygulamaCiz);
  if(sayfa === 'talep-rapor') return talepRaporSayfasi();
  // 'araclar' sayfası menüden kaldırıldı: içi boştu. Eski sürümün araç
  // kutuları taşındığında menüye geri eklenecek (bkz. NOTLAR.md).

  const magaza = aktifMagaza();
  if(!magaza) return U.el('<div class="bos-sayfa"><h2>Mağaza seçilmedi</h2><p>Üstteki listeden bir mağaza seçin.</p></div>');
  const duzenlenebilir = aktif.rol !== V.ROLLER.BOLGE;
  return magazaEkrani(magaza, {duzenlenebilir, yenile: uygulamaCiz});
}

function talepRaporSayfasi(){
  const pzt = U.pazartesi(U.bugun());
  const rapor = talepRaporu(pzt);
  const kok = U.el(`<div class="talep-rapor-sayfa">
    <div class="bolum-ust">
      <h2>Ürün talepleri</h2>
      <span class="alt">${U.haftaKey(pzt)} · gönderen ${rapor.gonderenler.length}, göndermeyen ${rapor.gondermeyenler.length}</span>
    </div>
    <div class="talep-ekran">
      <div class="talep-sol"></div>
      <aside class="talep-sag">
        <div class="panel-kutu">
          <h3>📦 Gönderen mağazalar</h3>
          <div class="rapor-liste">
            ${rapor.talepler.map(t => {
              const m = V.profilGetir(t.magazaKey);
              return `<div class="rapor-satir"><b>${U.esc(m ? m.ad : t.magazaKey)}</b>
                <span>${t.satirlar.map(x => U.esc(x.ad) + ' ×' + x.adet).join(', ')}</span></div>`;
            }).join('') || '<div class="menu-bos">Bu hafta talep gelmedi.</div>'}
          </div>
        </div>
        <div class="panel-kutu">
          <h3>⚠ Göndermeyenler</h3>
          <div class="rapor-eksik">${rapor.gondermeyenler.map(m => U.esc(m.ad)).join(', ') || '—'}</div>
        </div>
      </aside>
    </div>
  </div>`);
  kok.querySelector('.talep-sol').appendChild(urunTalepListesi(pzt));
  return kok;
}

// ---------------- Çizim ----------------
function ciz(icerik){
  kokEl.innerHTML = '';
  kokEl.appendChild(icerik);
}
function uygulamaCiz(){
  kapat();
  const sar = U.el('<div class="uygulama"></div>');
  sar.appendChild(ustCubuk());
  const govde = U.el('<main class="sayfa"></main>');
  govde.appendChild(sayfaIcerigi());
  sar.appendChild(govde);
  ciz(sar);
}

// ---------------- Açılış ----------------
temaUygula(temaGetir());
surumKontrolSessiz();
setInterval(surumKontrolSessiz, 30 * 60 * 1000);
haftaSec(U.pazartesi(U.bugun()));

if(baglan()){
  // Bulut modu: oturum durumunu Firebase yönetir.
  authAl().onAuthStateChanged(async user => {
    if(!user){
      aktif = null; kurucuMagaza = null; bulutKullanicisi = null;
      V.bulutuKapat();
      ciz(bulutGirisEkrani(bekleyenMesaj));
      bekleyenMesaj = '';
      return;
    }
    try{ await bulutOturumuAc(user); }
    catch(e){
      console.error(e);
      ciz(bulutGirisEkrani('Veriler yüklenemedi: ' + (e && e.message ? e.message : e) +
        '\nGüvenlik kuralları bu hesaba izin vermiyor olabilir.'));
    }
  });
} else {
  // Firebase yok: yerel deneme modu.
  V.tohumla(false);
  const oturum = V.oturumGetir();
  if(oturum && V.profilGetir(oturum.key)){
    aktif = V.profilGetir(oturum.key);
    sayfa = varsayilanSayfa(aktif);
    uygulamaCiz();
  } else {
    ciz(girisEkrani(null));
  }
}

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
