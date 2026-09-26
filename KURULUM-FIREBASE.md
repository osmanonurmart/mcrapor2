# v2 — Firebase kurulumu

v2 kendi Firebase projesinde çalışır. v1 (`rapor.html`) ayrı projededir;
ikisi hiçbir şey paylaşmaz.

Sıra önemli. Kuralları en sona bırakıyoruz, yoksa kendiniz giremeden
kilitlenir.

## 1. Yeni proje aç

[console.firebase.google.com](https://console.firebase.google.com) → **Add
project** → ad: `mcrapor2` (veya istediğiniz ad) → Google Analytics'e gerek
yok, kapatabilirsiniz.

## 2. Firestore'u aç

Build → **Firestore Database** → **Create database**
→ konum: `eur3 (europe-west)` → **Production mode** ile başlayın.

Kuralları 5. adımda yükleyeceğiz.

## 3. E-posta/şifre girişini aç

Build → **Authentication** → **Get started** → **Email/Password** → Enable
→ Save.

Anonim girişe gerek yok, kapalı kalsın.

> Kullanıcılar e-posta değil kullanıcı adı yazar. Uygulama içeride
> `2307` → `2307@mcrapor.local` çevirisi yapar, bu yüzden Firebase'de
> e-posta/şifre yönteminin açık olması gerekir.

## 4. Kendi hesabınızı oluşturun

Authentication → **Users** → **Add user**

- E-posta: `osmanonurmrt@gmail.com`
- Şifre: kendi belirlediğiniz şifre

Bu adres hem uygulamada hem kurallarda kurucu olarak tanımlı. Değiştirmek
isterseniz iki yerde geçiyor:

- `js/app.js` → `YONETICI_EPOSTALARI`
- `firestore.rules` → `eposta() in [...]`

## 5. Web uygulamasını ekleyin ve ayarları alın

Proje ayarları (⚙) → **Your apps** → **Web** (`</>`) simgesi → takma ad
verin → Register app. Çıkan `firebaseConfig` bloğunu kopyalayın ve bana
verin; `js/bulut.js` içindeki karşılığıyla değiştireceğim.

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 6. Uygulamayı açın ve giriş yapın

https://osmanonurmart.github.io/mcrapor2/

Bulutta veri olmadığı için **ilk kurulum** ekranı çıkar. Düğmeye basınca
20 mağaza, bölge müdürü ve kurucu profilleri, kategoriler ve yaklaşık 10
haftalık örnek veri Firestore'a yazılır.

> Örnek veriyi istemiyorsanız haber verin, boş kurulum yapan bir sürüm veririm.

## 7. Mağaza kullanıcılarını açın

Kurucu → **Ayarlar → Kullanıcılar**. Her mağazanın yanında kullanıcı adı ve
şifre alanı var. **Kullanıcı aç** hem Firebase hesabını açar hem de kullanıcıyı
o mağazaya bağlar. Mağaza bu kullanıcı adı ve şifreyle girer, yalnızca kendi
verisini görür.

Kullanıcı adı yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir —
boşluk ve @ olmaz. İçeride `2307` → `2307@mcrapor.local` adresine çevrilir;
bu yüzden Firebase'de e-posta/şifre girişinin açık olması gerekir, ama
kullanıcı hiçbir zaman e-posta yazmaz.

Aynı bölümde:

- **+ Mağaza ekle** — istediğiniz kadar mağaza açabilirsiniz, her birinin
  verisi kendi anahtarının altında ayrı durur.
- **Şifreyi değiştir** — mevcut şifre + yeni şifre. Tarayıcıdan başkasının
  şifresi ancak mevcut şifresi bilinerek değişir.
- **Kullanıcıyı ayır** — şifre tamamen unutulduysa: ayırın, sonra yeni
  kullanıcı adı ve şifreyle yeniden açın. Aynı kullanıcı adını tekrar
  kullanmak isterseniz önce Console → Authentication → Users'dan eski
  hesabı silin.
- **🗑** — mağazayı ve bütün verisini siler. Geri alınamaz.

Bölge müdürü ve kurucu profilleri için de aynı şekilde kullanıcı açılır.

## 8. Güvenlik kurallarını yükleyin

Firebase Console → **Firestore Database** → **Rules**.
Bu depodaki `firestore.rules` dosyasının içeriğini olduğu gibi yapıştırın
→ **Publish**.

Kurallar yalnızca `mc2_` koleksiyonlarını tanır; başka hiçbir yol açık
değildir.

## 9. Kontrol

- Kurucu hesabıyla girip bütün mağazaları görebiliyor musunuz?
- Bir mağaza hesabıyla girince yalnızca kendi mağazası açılıyor mu?
- v1 (`rapor.html`) ayrı projede olduğu için bundan etkilenmez.

---

## Veri düzeni

| Yol | İçerik |
|---|---|
| `mc2_kullanicilar/{uid}` | e-posta, rol, bağlı mağaza |
| `mc2_ortak/profiller` | mağaza ve rol listesi |
| `mc2_ortak/kategoriler` | ürün kategorileri |
| `mc2_ortak/duyurular` | duyuru listesi |
| `mc2_ortak/talepler` | ürün talepleri |
| `mc2_ortak/ayarlar` | etiketler, toplu satış eşiği, görünüm ayarları |
| `mc2_magazalar/{m}` | mağaza kartı (ad, simge, renk) |
| `mc2_magazalar/{m}/gunler/{tarih}` | günlük KPI kaydı |
| `mc2_magazalar/{m}/hedefler/{hafta}` | haftalık hedef |
| `mc2_magazalar/{m}/urunHafta/{hafta}` | haftalık ürün verisi |
| `mc2_magazalar/{m}/rutinDurum/{hafta}` | rutin işaretleri |
| `mc2_magazalar/{m}/ayarlar/{personel\|kartlar\|rutin}` | mağaza ayarları |

Panel yerleşimi ve açık sekme gibi kişisel tercihler buluta gitmez, cihazda kalır.

Kullanıcı adları Firebase'de `<kullanıcı adı>@mcrapor.local` olarak durur.
Gerçek bir alan adı değildir; oraya posta gönderilemez, bu yüzden şifre
sıfırlama postası bu hesaplarda işe yaramaz. Şifreyi kurucu değiştirir.

## Bilinmesi gerekenler

- Giriş yapıldığında **son 16 haftanın** günlük verisi çekilir. Daha eskisi
  gerekirse `veriYukle` çağrısındaki hafta sayısı artırılır.
- Yazmalar önce ekranda görünür, arkadan buluta gider (400 ms gecikmeli).
  Bağlantı koparsa yazma kaybolur; şu an yeniden deneme yok.
- İki kişi aynı anda aynı güne yazarsa son yazan kazanır, uyarı yok.
- Firebase yüklenemezse (internet yok, tek dosya sürümü) uygulama eski yerel
  deneme moduna düşer ve veriyi tarayıcıda tutar.
