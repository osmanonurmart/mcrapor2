// Firebase bağlantısı: kimlik doğrulama ve Firestore.
//
// v1 (rapor.html) aynı projeyi kullanıyor ve kendi koleksiyonlarında çalışıyor.
// Çakışmamak için v2'nin bütün koleksiyonları "mc2_" ile başlar.
export const firebaseConfig = {
  apiKey: "AIzaSyCHkuLl0l90xXjEoeUnbCgxJsi4iIbjmK0",
  authDomain: "mcrapor-e97aa.firebaseapp.com",
  projectId: "mcrapor-e97aa",
  storageBucket: "mcrapor-e97aa.firebasestorage.app",
  messagingSenderId: "788228140989",
  appId: "1:788228140989:web:106c9057fb8f27fe86ecd4"
};

export const KULLANICILAR = 'mc2_kullanicilar';

// Firebase Auth e-posta ister; kullanıcılar ise yalnızca kullanıcı adı yazar.
// İçeride "2307" → "2307@mcrapor.local" olur. İçinde @ varsa dokunulmaz,
// böylece kurucunun gerçek e-postasıyla girişi bozulmaz.
export const KULLANICI_ALANI = 'mcrapor.local';
export function epostaYap(kullaniciAdi){
  const k = String(kullaniciAdi || '').trim().toLowerCase();
  return k.includes('@') ? k : k + '@' + KULLANICI_ALANI;
}
// Ekranda gösterilirken yapay alan adı gizlenir.
export function kullaniciAdiYap(eposta){
  const e = String(eposta || '');
  return e.endsWith('@' + KULLANICI_ALANI) ? e.slice(0, -('@' + KULLANICI_ALANI).length) : e;
}
export const MAGAZALAR   = 'mc2_magazalar';
export const ORTAK       = 'mc2_ortak';

export const bulutVarMi = () => typeof firebase !== 'undefined' && !!firebase.firestore;

let auth = null, db = null;
export function baglan(){
  if(!bulutVarMi()) return false;
  if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  return true;
}
export const authAl = () => auth;
export const dbAl = () => db;

export function girisHatasi(err){
  const kodlar = {
    'auth/invalid-email': 'Kullanıcı adı geçersiz.',
    'auth/user-not-found': 'Böyle bir kullanıcı yok.',
    'auth/wrong-password': 'Şifre yanlış.',
    'auth/invalid-credential': 'Kullanıcı adı veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı, biraz bekleyin.',
    'auth/network-request-failed': 'İnternet bağlantısı kurulamadı.',
    'auth/email-already-in-use': 'Bu kullanıcı adı zaten kullanılıyor.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
    'mc2/eskiSifreYanlis':
      'Mevcut şifre doğru değil. Şifre unutulduysa "Kullanıcıyı ayır" deyip\n' +
      'yeni kullanıcı adı ve şifreyle yeniden açın.',
    'mc2/eslesmedi':
      'Bu kullanıcı adı zaten kayıtlı ama verilen şifreyle girilemedi.\n' +
      'Mağazaya bağlamak için o kullanıcının güncel şifresini yazın.',
    'auth/operation-not-allowed':
      'Firebase\'de e-posta/şifre girişi kapalı görünüyor (kullanıcı adları\n' +
      'içeride e-postaya çevriliyor).\n' +
      'Console → Authentication → Sign-in method → Email/Password → Enable.'
  };
  return kodlar[err && err.code] || ('İşlem tamamlanamadı: ' + (err && err.message ? err.message : err));
}

// Yeni kullanıcı, ikincil bir bağlantıyla açılır; yöneticinin oturumu bozulmaz.
let ikincil = null;
export async function kullaniciOlustur(eposta, sifre){
  if(!ikincil) ikincil = firebase.initializeApp(firebaseConfig, 'kullaniciOlusturucu');
  const ia = ikincil.auth();
  let cred;
  try{
    cred = await ia.createUserWithEmailAndPassword(eposta, sifre);
  }catch(e){
    // Hesap Firebase konsolundan elle açılmışsa yeniden oluşturulamaz.
    // Şifresi verildiyse giriş yapıp uid'sini alır, mağazaya öyle bağlarız.
    if(e.code !== 'auth/email-already-in-use') throw e;
    try{
      cred = await ia.signInWithEmailAndPassword(eposta, sifre);
    }catch(e2){
      const h = new Error('Bu kullanıcı adı zaten kayıtlı ama verilen şifreyle girilemedi. ' +
        'Mağazaya bağlamak için o kullanıcının güncel şifresini yazın.');
      h.code = 'mc2/eslesmedi';
      throw h;
    }
  }
  const uid = cred.user.uid;
  try{ await ia.signOut(); }catch(e){ /* zaten kapanmış olabilir */ }
  return uid;
}

// Şifre değiştirme. Tarayıcıdan başka birinin şifresi ancak mevcut şifresi
// bilinerek değiştirilebilir (Admin SDK olmadan başka yolu yok).
export async function sifreDegistir(eposta, eskiSifre, yeniSifre){
  if(!ikincil) ikincil = firebase.initializeApp(firebaseConfig, 'kullaniciOlusturucu');
  const ia = ikincil.auth();
  let cred;
  try{
    cred = await ia.signInWithEmailAndPassword(eposta, eskiSifre);
  }catch(e){
    const h = new Error('Mevcut şifre doğrulanamadı.');
    h.code = 'mc2/eskiSifreYanlis';
    throw h;
  }
  await cred.user.updatePassword(yeniSifre);
  try{ await ia.signOut(); }catch(e){}
}
