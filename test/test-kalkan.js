// TEST KALKANI — ana uygulamanın verisini korur.
//
// Bu dosya uygulama kodundan ÖNCE yüklenir ve global `firebase` nesnesini
// sarar. Uygulama kaynağına tek satır dokunulmaz; böylece test sürümü ana
// sürümün birebir kopyası kalır, aradaki tek fark bu dosyadır.
//
// Yaptıkları:
//   1. Firestore YAZMALARI engellenir (set/update/delete/add/batch.commit).
//      Okuma serbest: test uygulaması gerçek veriyi görür.
//   2. Firebase Auth'ta hesap açma / şifre değiştirme engellenir.
//      Giriş serbest.
//   3. Uygulama adı 'mc2' yerine 'mc2test' olur: aynı tarayıcıda ana
//      uygulamanın oturumuyla çakışmaz (ikisi de github.io'da, aynı köken).
//   4. localStorage anahtarları 'mc2:' yerine 'mc2test:' önekiyle yazılır:
//      tema, panel yerleşimi gibi kişisel ayarlar ana uygulamadan ayrılır.
//
// Engellenen her çağrı konsola yazılır ve sahte bir "başarılı" söz döner;
// uygulama hata vermeden çalışmaya devam eder, sadece bulut değişmez.
(function(){
  'use strict';

  const yazmalar = [];
  window.__testYazmalari = () => yazmalar;

  function engellendi(ne, ayrinti){
    yazmalar.push({ne, ayrinti, zaman: new Date().toISOString()});
    console.warn('[TEST] yazma engellendi:', ne, ayrinti ?? '');
    bildir(ne);
  }

  // Ekranın altında kısa bir uyarı; sessizce yutulmuş gibi görünmesin.
  let kutu = null, zaman = null, sayac = 0;
  function bildir(ne){
    sayac++;
    if(!kutu){
      kutu = document.createElement('div');
      kutu.className = 'test-yazma-uyari';
      document.body && document.body.appendChild(kutu);
    }
    if(!kutu.isConnected && document.body) document.body.appendChild(kutu);
    kutu.textContent = '🔒 Test sürümü — ' + sayac + ' yazma engellendi (son: ' + ne + ')';
    kutu.style.opacity = '1';
    clearTimeout(zaman);
    zaman = setTimeout(() => { if(kutu) kutu.style.opacity = '0'; }, 4000);
  }

  // ---------------- localStorage ayrımı ----------------
  // Uygulama 'mc2:' önekini kullanıyor; test sürümünde 'mc2test:' olsun.
  const gercek = window.localStorage;
  const cevir = k => (typeof k === 'string' && k.startsWith('mc2:')) ? 'mc2test:' + k.slice(4) : k;
  const sahteDepo = {
    getItem: k => gercek.getItem(cevir(k)),
    setItem: (k, v) => gercek.setItem(cevir(k), v),
    removeItem: k => gercek.removeItem(cevir(k)),
    clear: () => gercek.clear(),
    key: i => gercek.key(i),
    get length(){ return gercek.length; }
  };
  try{
    Object.defineProperty(window, 'localStorage', {configurable:true, get: () => sahteDepo});
  }catch(e){ console.warn('[TEST] localStorage ayrılamadı:', e.message); }

  // ---------------- Firestore: okuma serbest, yazma kapalı ----------------
  const YAZMA_METOTLARI = ['set','update','delete','add'];

  function sarmala(nesne, yol){
    if(!nesne || typeof nesne !== 'object') return nesne;
    return new Proxy(nesne, {
      get(hedef, ad){
        const deger = hedef[ad];
        if(typeof deger !== 'function') return deger;

        if(YAZMA_METOTLARI.includes(ad)){
          return function(){
            engellendi(yol + '.' + String(ad));
            return Promise.resolve();
          };
        }
        if(ad === 'batch'){
          return function(){
            // Yığın: ekleme sessizce yutulur, commit hiçbir şey yapmaz.
            let adet = 0;
            const sahteYigin = {
              set(){ adet++; return sahteYigin; },
              update(){ adet++; return sahteYigin; },
              delete(){ adet++; return sahteYigin; },
              commit(){ engellendi('batch.commit', adet + ' işlem'); return Promise.resolve(); }
            };
            return sahteYigin;
          };
        }
        // doc(), collection(), where(), orderBy()… zincirin devamı da sarılır.
        return function(...a){
          const sonuc = deger.apply(hedef, a);
          const ek = a.length && typeof a[0] === 'string' ? '/' + a[0] : '';
          return (sonuc && typeof sonuc === 'object' && !(sonuc instanceof Promise))
            ? sarmala(sonuc, yol + ek) : sonuc;
        };
      }
    });
  }

  // ---------------- Auth: giriş serbest, hesap işlemleri kapalı ----------------
  const AUTH_YAZMA = ['createUserWithEmailAndPassword','sendPasswordResetEmail','sendSignInLinkToEmail'];
  const KULLANICI_YAZMA = ['updatePassword','updateEmail','delete','updateProfile','sendEmailVerification'];

  function kullaniciSar(k){
    if(!k || typeof k !== 'object') return k;
    return new Proxy(k, {
      get(hedef, ad){
        const d = hedef[ad];
        if(typeof d === 'function' && KULLANICI_WRITE_SET.has(String(ad))){
          return function(){ engellendi('user.' + String(ad)); return Promise.resolve(); };
        }
        return typeof d === 'function' ? d.bind(hedef) : d;
      }
    });
  }
  const KULLANICI_WRITE_SET = new Set(KULLANICI_YAZMA);

  function authSar(a){
    if(!a || typeof a !== 'object') return a;
    return new Proxy(a, {
      get(hedef, ad){
        const isim = String(ad);
        if(isim === 'currentUser') return kullaniciSar(hedef.currentUser);
        const d = hedef[ad];
        if(typeof d !== 'function') return d;
        if(AUTH_YAZMA.includes(isim)){
          return function(){
            engellendi('auth.' + isim);
            return Promise.reject(Object.assign(new Error(
              'Test sürümünde hesap açma/şifre işlemleri kapalı.'), {code:'test/salt-okunur'}));
          };
        }
        if(isim === 'onAuthStateChanged'){
          return function(fn, ...k){
            return d.call(hedef, u => fn(u ? kullaniciSar(u) : u), ...k);
          };
        }
        return function(...k){
          const s = d.apply(hedef, k);
          // signInWith… bir kimlik nesnesi döndürür; içindeki user da sarılır.
          if(s && typeof s.then === 'function'){
            return s.then(r => (r && r.user) ? Object.assign({}, r, {user: kullaniciSar(r.user)}) : r);
          }
          return s;
        };
      }
    });
  }

  // ---------------- firebase nesnesini sar ----------------
  function kur(){
    const fb = window.firebase;
    if(!fb || fb.__testKalkani) return !!fb;
    const gercekInit = fb.initializeApp.bind(fb);

    fb.initializeApp = function(cfg, ad){
      // Ana uygulamayla aynı tarayıcıda oturum çakışmasın diye ad değişir.
      const yeniAd = (ad || '[DEFAULT]') + '-test';
      const uyg = gercekInit(cfg, yeniAd);
      return new Proxy(uyg, {
        get(hedef, k){
          if(k === 'firestore') return () => sarmala(hedef.firestore(), 'firestore');
          if(k === 'auth')      return () => authSar(hedef.auth());
          const d = hedef[k];
          return typeof d === 'function' ? d.bind(hedef) : d;
        }
      });
    };

    const eskiApps = Object.getOwnPropertyDescriptor(fb, 'apps');
    Object.defineProperty(fb, 'apps', {
      configurable: true,
      get(){
        const liste = eskiApps && eskiApps.get ? eskiApps.get.call(fb) : [];
        // Uygulama kodu adı 'mc2' diye arıyor; sarılmış adı geri çeviriyoruz.
        return liste.map(u => new Proxy(u, {
          get(hedef, k){
            if(k === 'name') return String(hedef.name).replace(/-test$/, '');
            if(k === 'firestore') return () => sarmala(hedef.firestore(), 'firestore');
            if(k === 'auth')      return () => authSar(hedef.auth());
            const d = hedef[k];
            return typeof d === 'function' ? d.bind(hedef) : d;
          }
        }));
      }
    });

    fb.__testKalkani = true;
    console.info('[TEST] kalkan kuruldu: Firestore yazmaları ve hesap işlemleri kapalı.');
    return true;
  }

  if(!kur()){
    // SDK betikleri henüz yüklenmediyse yüklenir yüklenmez kur.
    const bekle = setInterval(() => { if(kur()) clearInterval(bekle); }, 10);
    setTimeout(() => clearInterval(bekle), 10000);
  }
})();
