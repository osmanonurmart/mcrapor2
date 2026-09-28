# Notlar — hatalar, riskler, yapılabilecekler

Bu dosya v2 için tutulan açık liste. Yapıldıkça satırlar silinir.

---

## 1. Bulunup düzeltilen hatalar

| # | Hata | Durum |
|---|---|---|
| 1.1 | Türkçe binlik ayıracı yanlış okunuyordu: `98.000` → `98`. Tablodaki bir hücreye tekrar girilince değer bine bölünüyordu. | ✅ düzeltildi |
| 1.2 | Devam eden yarım hafta, geçen haftanın tamamıyla kıyaslanıyordu. Bölge özetinde 20 mağazanın hepsi "%60 düştü" görünüyordu. Artık aynı sayıdaki ilk günle kıyaslanıyor. | ✅ düzeltildi |
| 1.3 | Haftalık tablodaki ciro formülü de aynı sorundaydı; artık "(ilk 3 gün)" diye belirtiyor. | ✅ düzeltildi |
| 1.4 | Favicon adresi ham `<` `>` içeriyordu; tek dosya üreticisi onu ortasından kesiyor ve sayfanın üstünde `🏪 " >` kalıntısı görünüyordu. | ✅ düzeltildi |
| 1.5 | Para birimi ekli sayılarda binlik ayıracı kontrolü çalışmıyordu: `23.411 TRY` → `23.411`. Gerçek kaynak verisiyle test edilirken çıktı. Artık harfler önce ayıklanıyor. | ✅ düzeltildi |
| 1.10 | **Aynı haftaya ikinci talep gönderince eski kayıt silinmiyordu.** Eski talep nesne kimliğiyle eleniyordu, ama `taleplerGetir` her çağrıda JSON'dan yeni nesneler üretiyor; karşılaştırma hiç tutmuyordu. Bölge raporunda aynı mağaza iki kez görünüyordu. Artık mağaza ve hafta ile eleniyor. | ✅ düzeltildi |
| 1.9 | **Mobilde sayfa yana taşıyordu.** Gövde esnek yapıya çevrilince dikey dizilişte `align-items:flex-start` çocukları içerik genişliğine büyütüyordu. Mobilde `stretch` yapıldı. | ✅ düzeltildi |
| 1.8 | **Hafta şeridinde yanlış hafta seçiliyordu.** Ay, haftanın pazartesisine bakılarak belirleniyordu; 31 Ağustos'ta başlayan hafta tıklanınca ay Ağustos'a geçip şerit tamamen değişiyor, kullanıcı "yanındakini seçti" sanıyordu. Artık hafta, perşembesinin düştüğü aya ait (ISO kuralı) ve şerit hafta seçince değişmiyor. | ✅ düzeltildi |
| 1.7 | **Panel sürükleme ilk adımda kesiliyordu.** Panel DOM'da yer değiştirince tarayıcı pointer yakalamasını düşürüyor, kalan hareket olayları gelmiyordu. Olaylar artık pencereden dinleniyor. | ✅ düzeltildi |
| 1.6 | **İzin seçimi hiç kaydetmiyordu.** Satır bir `<label>` idi ve içindeki onay kutusuna tıklamak olayı iki kez tetikleyip seçimi anında geri alıyordu. Üstelik menü ilk tıklamada kapandığı için birden fazla kişi işaretlenemiyordu. Satır artık `<div>`, tıklamayı kendisi ele alıyor ve menü yalnızca dışına tıklanınca kapanıyor. | ✅ düzeltildi |

## 2. Bilinen açık hatalar

| # | Hata | Etki | Zorluk |
|---|---|---|---|
| 2.1 | Kurucu veya bölge müdürü mağaza seçmeden "Mağaza Ekranı"na basarsa listedeki **ilk mağazanın** verisi açılıyor, ama üstteki rozet hâlâ "Kurucu" yazıyor. Kimin verisine bakıldığı belli olmuyor. | Yüksek — yanlış mağazaya veri girilebilir | Düşük |
| 2.2 | Aynı uygulamayı iki sekmede açarsan biri diğerinin yazdığını görmez; son kapatan üzerine yazar. `storage` olayı dinlenmiyor. | Orta | Düşük |
| 2.3 | Simüle tarihi sayfa yenilenince sıfırlanıyor. Kullanıcı geçmiş güne veri girerken sayfayı yenilerse farkında olmadan bugüne yazmaya başlar. | Orta | Düşük |
| 2.4 | Sağ paneldeki elle girilen kartlara (Halı satışı vb.) **yalnızca bugün** değer yazılabiliyor. Geçmiş bir günün kart değeri düzeltilemiyor. | Orta | Orta |
| 2.5 | Bölge panelinde mağazaya tıklayıp detaya inince geri dönmek için üstteki "Özet"e basmak gerekiyor; ekranda geri butonu yok. | Düşük | Düşük |
| 2.9 | Tuvalde bir satırdaki bloklar en uzun bloğun boyuna uzuyor; kısa blokların altında boşluk kalıyor. Notion da böyle davranıyor, blok yüksekliği elle ayarlanabiliyor. | Kozmetik | Orta |
| 2.6 | Kategori silinince o kategorideki ürünlerin id'leri boşta kalıyor. Eski taleplerde ürün **adı** saklandığı için görüntü bozulmuyor, ama id kırık. | Düşük | Düşük |
| 2.7 | Hafta hedefi kutusu ham sayı gösteriyor (`265000`), tablodaki diğer sayılar biçimli (`265.000`). | Kozmetik | Düşük |
| 2.8 | `bolgeGorunum.kiyas` ayarı veride duruyor ama hiçbir yerde kullanılmıyor — ölü alan. Tanımdaki "Kıyas: Dün vs Bugün ▾" seçimi yapılmadı. | Düşük | Orta |

## 3. Veri kaybı riskleri — en kritik başlık

| # | Risk | Açıklama |
|---|---|---|
| 3.1 | **Veri yalnızca tarayıcıda.** Tarayıcı verisi temizlenirse, gizli sekmede açılırsa veya başka cihaza geçilirse her şey gider. | Firebase'e geçilene kadar gerçek kullanıma açılmamalı |
| 3.2 | **Yedek / dışa aktarım yok.** v1'de JSON + Excel yedeği vardı, v2'de henüz yok. | Firebase'den önce bile eklenmeli |
| 3.3 | **localStorage ~5 MB.** 20 mağaza × birkaç yıl veri bu sınırı zorlar; dolunca yazma sessizce başarısız olur. | Firebase bunu çözer |
| 3.4 | **Geri al (undo) yok.** v1'de vardı. Yanlış yapıştırılan veri geri alınamıyor. | Orta zorluk |
| 3.5 | **Profil şifreleri düz metin** olarak tarayıcıda duruyor. Yerel prototip için sorun değil, yayına çıkarsa değil. | Firebase Authentication çözer |

## 4. Veri doğrulama eksikleri

- MDO'ya `%150`, ciroya negatif sayı girilebiliyor; hiçbir uyarı yok.
- FBÜ'ye `3000` yazılabiliyor (makul aralık 2–10).
- Hedef `0` girilirse oran hesabı boş dönüyor, uyarı yok.
- Yapıştırılan veride aynı alan iki kez geçerse **ilki** alınıyor; hangisinin doğru olduğu sorulmuyor.
- Aynı güne ikinci kez yapıştırma yapılırsa eski değerlerin üzerine sessizce yazılıyor; öncesi/sonrası gösterilmiyor.

## 5. Tanımda olup henüz yapılmayanlar

| # | Madde | Not |
|---|---|---|
| 5.1 | **Firebase** (Authentication + veritabanı) | `js/veri.js` bunun için ayrı tutuldu; yalnızca o dosyanın içi değişecek |
| 5.2 | **Bildirimler** — veri girişi hatırlatması, pazartesi talep hatırlatması, duyuru bildirimi | Firebase Cloud Messaging gerekiyor |
| 5.3 | **Araçlar sayfası** | v1'deki araç kutuları taşınmadı |
| 5.4 | **Etiket → kart otomatik doldurma** | Etiket tanımlanıyor ama ürün satırlarından karta aktarma bağlı değil |
| 5.5 | **Talep onay/ret** | Tanımda açık bırakılmıştı |
| 5.6 | **Günlük ve aylık hedef** | Şu an yalnızca haftalık hedef var |
| 5.7 | **Bölge tablosunda sıralama seçimi** (`Sıra ⇅`) | Şu an sabit: ciro değişimine göre |
| 5.8 | **Kurucu panelinin bölge panelinden farkı** | Tanımda açık bırakılmıştı |
| 5.9 | **FBS formül sütunu** | Şimdilik haftalık ortalama; karar senin |
| 5.10 | **Mobil alt bölümün kesin içeriği** | Şimdilik kartlar + yorum + duyuru |

## 6. Geliştirme önerileri — öncelik sırasıyla

### Yüksek değer, düşük maliyet
1. **Akşam mesajı üreteci.** v1'in en çok kullanılan özelliğiydi: günün verisinden Türkçe metin üretip panoya kopyalıyordu. v2'de yok. Bölge müdürüne gönderilen mesaj bununla saniyeler sürüyordu.
2. **Yedek al / geri yükle.** JSON dışa aktarım + içe aktarım. Firebase gelene kadarki tek güvenlik ağı.
3. **Geri al (undo).** Özellikle yapıştırma sonrası.
4. **Klavyeyle tablo gezinme.** Ok tuşları ve Tab ile hücreler arası geçiş; veri girişini belirgin hızlandırır.
5. **Rapor fotoğrafı.** Haftalık tablonun PNG'si — WhatsApp'a atmak için. v1'de vardı.
6. **Mağaza seçili değilken uyarı** (madde 2.1'in çözümü).

### Orta
7. **Gerçek `.xlsx` yükleme.** Şu an kopyala-yapıştır; SheetJS ile dosya sürükle-bırak yapılabilir.
8. **Ciro trendi grafiği.** Her mağaza için son 10 haftanın küçük çizgi grafiği; bölge tablosunda satır sonunda sparkline.
9. **Mağaza karşılaştırma ekranı.** İki mağazayı yan yana koyup aynı metrikleri kıyaslama.
10. **Değişiklik kaydı.** Kim, ne zaman, hangi alanı değiştirdi. Rol ayrımı gelince değeri artar.
11. **Hedef hafta içi / hafta sonu ağırlığı.** Şu an haftalık hedef yediye bölünüyor; cumartesi ile salı aynı hedefi alıyor, oran yanıltıcı çıkıyor.
12. **İzin türleri düzenlenebilir olsun.** Şu an kodda sabit.
13. **Arama ve filtre.** Bölge tablosunda mağaza arama, "hedefin altındakiler" filtresi.

### Düşük / ileride
14. Karanlık tema.
15. Yazdırma / PDF çıktısı.
16. Erişilebilirlik: form alanlarına `label`, klavye odak sırası, ekran okuyucu etiketleri.
17. Çevrimdışı veri girişi + bağlantı gelince senkron (Firebase'den sonra anlamlı).
18. Mağaza bazlı hedef geçmişi grafiği.

## 7. Firebase'e geçerken dikkat edilecekler

- `js/veri.js` şu an **senkron** çalışıyor (`oku`/`yaz`). Firebase asenkron. Her çağrıyı `await` yapmak yerine v1'deki yöntem daha uygun: açılışta bir kez bellek önbelleğine yükle, ekranı ondan çiz, yazmaları arka planda gönder. Böylece çağıran kodun hiçbiri değişmez.
- Koleksiyon düzeni: `stores/{magaza}/gunler/{tarih}`, `stores/{magaza}/hedefler/{hafta}`, ortak `talepler`, `duyurular`, `kategoriler`, `kullanicilar`.
- Güvenlik kuralları rol bazlı olmalı: mağaza müdürü yalnızca kendi mağazası; bölge müdürü hepsini okur, hedef ve duyuru yazar; kurucu tam yetki.
- Talepler ve duyurular ortak koleksiyonda; mağaza müdürü kendi talebini yazabilmeli ama başkasınınkini okuyamamalı.
- `onSnapshot` ile canlı dinleme kurulursa madde 2.2 (iki sekme sorunu) kendiliğinden çözülür.

## 8. Kaynak sayfa (ciro takip) — çözümlenen yapı

Yer imi çıktısı üç tablo veriyor. Çözümleyici (`js/yapistir.js`) bunları tanıyor:

| Tablo | İçerik | Ne yapılıyor |
|---|---|---|
| 1 | `KPI \| BUGÜN \| DÜN \| GEÇEN HAFTA \| ...değişim` | Bugün ve dün sütunları yazılıyor. Ürün adedi ve fatura sayısı yalnızca burada var. |
| 2 | `KPI \| Pazartesi..Pazar \| 38.HAFTA \| 39.HAFTA \| aylar` | **Asıl kaynak.** Haftanın bütün günleri tek yapıştırmada yazılıyor. Hafta ve ay toplamları yalnızca kıyas için gösteriliyor. |
| 3 | `GRUP \| FATURA SAYISI \| ADET \| TOPLAM \| DURUM` | Gruplama "Fatura No" ise eşiğin üzerindeki faturalar toplanıp toplu satış hesaplanıyor. "Satış Danışmanı" ise kullanıcıya gruplamayı değiştirmesi söyleniyor. Eşik Kurucu panelinden ayarlanıyor (varsayılan 2.200 ₺). |

`Tarih` alanı raporun gününü veriyor; bilgisayarın saatine güvenilmiyor.
Rapor tarihinden sonraki günler kaynakta 0 geldiği için yazılmıyor.

Eşleşen KPI adları: Ciro/Satış, MDO, MGS, FBS, FBU, Ürün Adedi, Fatura Sayısı.
**Hafta tablosu ciroyu yuvarlıyor** (3.599,84 → 3.600); KPI tablosu bugün ve dün
için tam değeri veriyor. Bu yüzden o iki günde KPI tablosu esas alınıyor,
diğer günlerde hafta tablosu. Doğrulama: dört günün toplamı 84.867,34 çıkıyor,
kaynağın "39.HAFTA" sütunu 84.867 — fark yalnızca kaynağın kendi yuvarlaması.

### Buradan çıkan işler

- **Toplu satış** için kaynak sayfada gruplama "Fatura No" olmalı. İki ayrı
  yapıştırma gerekiyor; ileride tek adımda toplanması istenirse kaynak sayfadan
  iki çıktı alınıp birleştirilebilir.
- **Satış danışmanı kırılımı** (3. tablo) şu an kullanılmıyor. Personel bazlı
  performans ekranı için hazır veri.
- **Ürün Adedi** ve **Fatura Sayısı** KPI satırları eklendi, varsayılanda kapalı;
  kurucu panelinden açılabilir.

## 2026-09-25 — tuş denetimi

Her rolün (kurucu, mağaza, bölge) her sayfasındaki bütün tuşlar tek tek
tıklandı (226 tuş). Sonuç:

- JS hatası veren tuş yok.
- Hiçbir şey yapmayan tuş kalmadı. Boş alanla basılan "ekle/gönder"
  tuşları artık alanı kırmızı çerçeveyle vurguluyor (`util.bosUyar`).
- **Araçlar** sayfası menüden kaldırıldı; içi boş bir yer tutucuydu.
  v1'deki araç kutuları taşındığında `app.js` içindeki menü satırlarına
  `['araclar','Araçlar']` geri eklenip sayfa gövdesi yazılacak.

### Şifre yönetimi
Firebase'in `sendOobCode` ucu var olmayan adresler için de HTTP 200
dönüyor, bu yüzden "şifre sıfırla" hiçbir zaman hata vermiyor ama gerçek
posta kutusu olmayan adreslerde de hiçbir şey yapmıyor. Tarayıcıdan
başkasının şifresi ancak mevcut şifresi bilinerek değiştirilebilir
(Admin SDK olmadan başka yol yok). Bu yüzden kullanıcı satırında üç yol
var: **Şifreyi değiştir** (mevcut + yeni), **Sıfırlama postası**,
**Bağlantıyı kaldır** (konsoldan silip yeniden açmak için).

## 2026-09-25 — kullanıcı adıyla giriş

Giriş ekranı artık e-posta değil **kullanıcı adı** soruyor. Firebase Auth
e-posta zorunlu tuttuğu için içeride `2307` → `2307@mcrapor.local` çevrimi
yapılıyor (`bulut.js` → `epostaYap` / `kullaniciAdiYap`). Kurucunun gerçek
e-postası içinde @ olduğu için olduğu gibi geçiyor, eski girişi bozulmadı.

`mcrapor.local` gerçek bir alan adı değil; oraya posta gitmez. Bu yüzden
"şifremi unuttum" bu hesaplarda kapalı ve kullanıcı satırındaki
"Sıfırlama postası" tuşu kaldırıldı. Şifreyi kurucu değiştirir.

Kurucu → Ayarlar → Kullanıcılar bölümüne eklenenler: **+ Mağaza ekle**,
mağaza satırında **🗑** (mağaza ve bütün verisi), **Kullanıcıyı ayır**.
`veri.js` içine `magazaEkle`, `magazaSil`, genel `sil`/`anahtarlar`
yardımcıları ve `buluttanSil` girdi.

## 2026-09-25 — tema koyulaştırıldı

`css/app.css` değişkenleri: `--arka` #f0ede8 → #cfc7b6, `--kagit` #fff →
#f6f2e9, `--cizgi` #c9c1b3 → #6f6552, `--cizgi-ince` #ddd6c9 → #9a8e77.
Yazı ve soluk renkler de koyulaştı. İki yeni kalınlık değişkeni:
`--cerceve` (panel/blok çerçeveleri, 2px) ve `--hucre-cizgi` (tablo
hücreleri, 2px). Tablo başlık altları 4px.

Eski açık zeminler (#f1efe9, #faf9f6, #fdfbf6 …) yeni temaya uyacak
şekilde toplu değiştirildi.

Kullanıcılar paneli ızgarada tam satır kaplıyor (`.panel-kutu.genis`) ve
ızgaranın başına alındı; satır artık taşmadan sığıyor.

## 2026-09-25 — tema seçimi, ölçü modu, sürüm rozeti

**Tema seçimi** (`js/tema.js`): 5 hazır tema (bej, gri-mavi, yeşil-haki,
lacivert, koyu). Sağ üstteki profil menüsünden seçiliyor, anında
uygulanıyor. Seçim cihaza özel bir tercih olduğu için `localStorage`da
(`mc2:tema`), buluta gitmiyor. Tema = CSS değişkenlerini kök öğede ezmek.
Koyu tema için giriş alanlarına `background:var(--kagit)` eklendi, yoksa
tarayıcı beyaz bırakıyordu.

**Ölçü modu** (profil menüsü → 📐): her bloğun piksel ölçüsünü ve sağ altta
100 px'lik referans kareyi gösterir. Ekran görüntüsü üzerinden ölçü
konuşurken zoom/ekran oranı farkını ortadan kaldırır.

**Sürüm rozeti**: `js/surum.js` içindeki `SURUM` sayısı elle artırılır;
`olustur.mjs` aynı sayıyı `v2/surum.json`a yazar (ikisi ayrı düşmesin).
Uygulama açılışta ve 30 dakikada bir `surum.json`a bakar, sunucudaki sayı
büyükse rozet "v3 ↑" olur; tıklanınca servis çalışanı ve bütün önbellekler
silinip sayfa yeniden yüklenir. `sw.js` `surum.json`u hiç önbelleklemez.

**Yeni sürüm çıkarırken:** `js/surum.js` içindeki sayıyı artır, `sw.js`
içindeki `SURUM` önbellek adını da artır, `node olustur.mjs` çalıştır.

## 2026-09-25 — haftalık tablolar 2×2

Dört hafta aynı anda görünüyor. Yerleşim (`yerlesim.js`):

      sol üst : 2 hafta önce      sağ üst : seçili hafta
      sol alt : 3 hafta önce      sağ alt : 1 hafta önce

Yeni paneller `haftaOnceki2` ve `haftaOnceki3` (`magaza.js`).

Okunurluk: tablo yazısı .76 → .82rem, gün adı/tarihi ve KPI sütunu
büyütüldü. İzin etiketi gibi uzun içerik sütunu şişirip Formüller
sütununu dışarı itmesin diye `table-layout:fixed`; KPI 118px,
Formüller 132px, gün sütunları eşit bölünüyor. Formül metni kırpılmak
yerine sarıyor.

Genişlik eşikleri: 1750px altında özet sütunu alta iner, hafta
sütunları ekranın yarısını alır; 1340px altında hepsi tek sütun.
1920 / 1600 / 1440 / 1280 / 1100 / 900'de tablo içi yatay kaydırma yok.

## 2026-09-25 — hafta seçimi kutuları

Hafta kutusu artık iki bilgiyi birden gösteriyor: üstte büyük punto **ay
içi sıra** (Eylül'ün 1., 2., 3. haftası) ve yanında küçük gri **yılın
haftası** (H36). Altında tarih aralığı. Kutu iki satır kaldığı için boyu
eskisiyle aynı (98 × 38 px, genişlik sabit).

Üzerine gelince tam açıklama çıkıyor: "Eyl ayının 1. haftası — yılın 36.
haftası".

Ay şeridi ve yıl seçimi yerinde kaldı. Hafta satırı artık kendi
çerçevesinin içinde (`--cerceve` kalınlığında).

## 2026-09-26 — v1 ile oturum çakışması (önemli)

Belirti: v2 ekranı birkaç saniyede bir "Veriler yükleniyor…"a düşüyordu,
v1 de sürekli yenileniyordu.

Sebep: ikisi de aynı alan adında (`osmanonurmart.github.io`), aynı
Firebase projesinde ve **aynı varsayılan uygulama adıyla** (`[DEFAULT]`)
çalışıyordu. Firebase Auth oturumu `firebase:authUser:<apiKey>:<appName>`
anahtarıyla saklıyor ve aynı alan adındaki sekmeler arasında eşitliyor.
v1 sekmesi anonim giriş yapınca v2'nin oturumunu eziyordu, v2 e-posta
girişi yapınca v1'inkini. İki sekme birbirini sürekli yeniden
tetikliyordu.

Çözüm: v2 kendi uygulama adıyla bağlanıyor (`bulut.js` → `UYGULAMA_ADI =
'mc2'`), kullanıcı açarken kullandığı ikincil uygulama da `mc2Olusturucu`.
Oturum kayıtları artık ayrı; `rapor.html` değişmedi.

**Not:** Ayrı repo açmak bunu çözmez — aynı kullanıcının bütün GitHub
Pages siteleri `osmanonurmart.github.io` altında, yani aynı alan adında.
Çözüm uygulama adının ayrılması; o da yapıldı.


## 2026-09-26 — v1 ve v2 tamamen ayrıldı

v2 kendi deposuna (`osmanonurmart/mcrapor2`) taşındı, geçmişiyle birlikte.
`magazarapor` deposunda yalnızca v1 (`rapor.html`) kaldı.

Firebase de ayrıldı: v2 kendi projesinde çalışıyor. Bu yüzden
`firestore.rules` artık yalnızca `mc2_` koleksiyonlarını tanıyor, v1'in
yolları (settings, stores, entries, weekgoals, tools, ghbhr*) buradan
çıkarıldı.

`bulut.js` içindeki `UYGULAMA_ADI = 'mc2'` yerinde kaldı. Ayrı proje ayrı
apiKey demek olduğu için oturum çakışması artık mümkün değil, ama iki
uygulama aynı alan adında yayınlandığı sürece bu ad ayrımı ucuz bir
güvence.

## 2026-09-26 — kurucu şifreleri görebiliyor

Firebase şifreyi geri okunamaz biçimde saklıyor; "şifreyi göster" için
başka yol yok, şifrenin bir kopyasını biz tutuyoruz. Kopya
`mc2_sifreler/{magazaKey}` belgesinde düz metin duruyor ve kurallar bu
koleksiyonu **yalnızca kurucuya** açıyor — bölge müdürü de göremez.

Kurucu → Ayarlar → Kullanıcılar:
- Her satırda kayıtlı şifre `••••••••` olarak duruyor, "👁 Şifreleri
  göster" ile açılıyor.
- Şifre değiştirme tek alana indi: mevcut şifre kayıttan okunuyor.
  Kayıt yoksa (bu özellikten önce açılmış hesap) bir kez soruluyor,
  sonrasında kayıtlı kalıyor.
- Kullanıcı ayrılınca ve mağaza silinince şifre kaydı da siliniyor.

Taviz: şifreler veritabanında düz metin. İç kullanım için kabul edildi.
Vazgeçilirse `SIFRELER` koleksiyonunu ve kuraldaki `mc2_sifreler`
bloğunu silmek yeterli; giriş ve şifre değiştirme çalışmaya devam eder
(mevcut şifre yine sorulur).

## 2026-09-26 — tek tık yapıştırma ve yer imi bildirimi

**Yer imi bildirimi** üç duruma ayrıldı (`yerimi/kaynak.js`):
- yeşil: tarih + "N büyük fatura · toplam X ₺"
- kırmızı: kaynak sayfada gruplama "Fatura No" değil, büyük fatura okunamadı
- turuncu ⚠: KPI tablosu ya da tarih alanı bulunamadı → "Güncelleme gerekli".
  Kaynak sayfanın yapısı değiştiğinde bu çıkar.

**Yapıştır / Veri Ekle** artık pencere açmıyor: panoyu okuyup doğrudan
işliyor (`magaza.js` → `hizliYapistir`). Yalnızca **rapor tarihi (bugün)
ve bir önceki gün (dün)** yazılıyor; haftanın geri kalanına dokunulmuyor.
Pazartesi basıldığında dün geçen haftanın pazarı olur, o da yazılır.

`navigator.clipboard.readText()` izin penceresi açıkken hiç
sonuçlanmıyor — süresiz asılı kalmasın diye 8 sn sınır kondu. Sınır
dolarsa, izin reddedilirse ya da pano boşsa eski yapıştırma penceresi
açılıyor.

Uygulama içi bildirim: `util.bildir(tur, baslik, govde)`; sağ üstte
çıkar, tıklanınca kapanır.

**Yer imi adı** `🏪 Veri Kopyala` oldu. Chrome `javascript:` ile başlayan
yer imlerine site simgesi koymuyor; simgeyi ada yazmak çubukta ayırt
etmenin tek yolu.

## 2026-09-26 — tema, düzen ve sürüm otomatiği

- **Çizgiler grileştirildi.** `--cizgi` #6f6552 → #a09689, `--cizgi-ince`
  #9a8e77 → #bdb4a6; `--cerceve` ve `--hucre-cizgi` 2px → 1px, tablo
  başlık altları 4px → 2px. Siyaha yakın kontrast gitti, çizgiler belli
  ama yormuyor.
- **Sayfa artık hiç kaymıyor.** `body` 100dvh + `overflow:hidden`, içerik
  `#kok` içinde kayıyor. Alt bilgi her zaman ekranda.
- **Aynı satırdaki bloklar eşit boyda** (hafta seçimi ↔ duyurular).
- **Giriş ekranı**: alanların çerçevesi gri ve belirgin, odaklanınca
  çerçeve açılıyor, hafif gölge ve 1px yukarı kayma.
- **Hafta başlığı** blok başlığından alınıp Hedef satırının soluna
  taşındı; her tabloda bir satır yer kazanıldı. `yerlesim.js` →
  `BASLIKSIZ` listesindeki paneller için tuval başlık çizmiyor.
- **Özet paneli** ikiye bölündü: solda dün/bugün kartları, sağında ay içi
  kıyası, üstte iki başlık. **Ay toplamı** kendi kutusuna alındı
  (`ayToplam` paneli, sağ yığında özet ile yorum arasında).
  Sağ sütunun üstünde **Ay içi / Ay toplamı** geçişi var (`ozet-sekme`);
  seçim cihazda saklanıyor (`ozetSekme:` anahtarı). Ayrı "Ay toplamı"
  kutusu kaldırıldı.
  Kart satırları üç sütunlu ızgara (etiket | değer | değişim); değişim
  sütunu ilk satırda boş kalsa da yer tutuyor, böylece iki satırın
  sayıları aynı hizada duruyor.
  Sağ sütun sabit ölçüt listesi değil, **kullanıcının kartlarını** izliyor:
  aynı sıra, aynı sayı, satırlar birebir hizalı. Elle girilen kartların ay
  içi karşılığı için `ayToplami` artık `gun.kartlar` değerlerini de
  topluyor (`kartlar` alanı).

### Sürüm otomatiği
`js/surum.js` artık elle değiştirilmiyor. `olustur.mjs` sürümü
`git rev-list --count HEAD` + 1'den üretip üç yere birden yazıyor:
`js/surum.js`, `sw.js` önbellek adı ve `surum.json`. Sıra önemli —
sürüm yazımı paketlemeden önce çalışır, yoksa `tek-dosya.html` eski
numarayı taşır.

Yayın öncesi tek komut: `node olustur.mjs`.

## 2026-09-26 — arayüz ölçeği %90'a sabitlendi

Kullanıcı tarayıcıda Ctrl+- ile %90'a çekince her şeyin yerli yerine
oturduğunu söyledi. Aynısı varsayılan yapıldı: `body { zoom: var(--olcek) }`
ve `--olcek: 0.9`.

`zoom` Ctrl+- ile birebir aynı işi yapar (yalnız yazıyı değil, kenar
boşluklarını ve çizgileri de küçültür), o yüzden tek tek px değerlerini
elden geçirmeye gerek kalmadı. Gövde yüksekliği `calc(100dvh /
var(--olcek))` — bölme olmazsa gövde ekrandan taşar.

Ölçeği değiştirmek isteyen tek satırı düzeltir: `:root { --olcek }`.

Kontrol edildi (1920, 1600, 1440, 1366, 1280, 390): hiçbirinde sayfa
kayması ya da yatay taşma yok, alt bilgi hep ekranda. 1600 ve 1440'ta
haftalık tablolar da artık kaymıyor — %90 ölçek yer açtı.

**Not:** Tarayıcı yakınlaştırması %100 olmalı (Ctrl+0). Kullanıcı ayrıca
%90 yaparsa toplam %81 olur.

## 2026-09-26 — tablo görünümü v1'e yaklaştırıldı

- **Simüle tarihi** sayfanın altından alınıp ay şeridinin sağ ucundaki
  boşluğa kondu; küçük bir kutu (🕒 + tarih + açıkken ✕). Açıkken altın
  renginde. Ay düğmelerinin ve yıl seçicinin iç boşluğu biraz kısıldı ki
  tek satıra sığsın.
- **Çerçeve içinde çerçeve kalktı.** Hafta tablolarında dış tuval kartının
  çerçevesi kaldırıldı (`:has(> .hafta-blok)`), çerçeve artık yalnızca
  tablonun kendisinde. Tablo tek bir dikdörtgen olarak okunuyor.
- **Başlık satırı koyu** (v1'deki gibi): `--koyu` zemin, beyaz yazı, KPI
  hücresi de dahil. Bugün sütunu koyu altın tonda. İzin düğmeleri koyu
  zeminde okunacak şekilde açıldı.
- KPI sütunu gövdede büyütüldü (.77 → .82rem), başlık hücresi dikey
  ortalandı.
- **Haftalık rutin maddeleri** artık her biri kendi kutusunda; önce
  yalnız üzerine gelince çerçeve çıkıyordu.

## 2026-09-26 — tema dosyası CSS'i eziyordu

`js/tema.js` içindeki tema tanımları `css/app.css`'teki `:root`'u ezer;
açılışta `temaUygula` çalışıp bütün renkleri kök öğeye yazıyor. Çizgileri
grileştirme değişikliği yalnızca app.css'te yapılmıştı, bej teması eski
koyu değeri (`#6f6552`) taşımaya devam ettiği için uygulamada hiç
görünmemişti.

Beş temanın da çizgi renkleri kendi tonlarında açıldı. Bundan sonra
app.css'te bir renk değiştirirken karşılığını tema.js'te de güncellemek
gerekiyor; dosyanın başına uyarı kondu.

## 2026-09-26 — tablo başlığı ayrı değişkene alındı

Başlık satırı `--koyu` (#1d1d1f) kullanıyordu, siyaha yakın olduğu için
göz yoruyordu. Üç yeni değişken: `--baslik-zemin`, `--baslik-yazi`,
`--baslik-bugun`. Varsayılan yumuşak koyu kahve (#4a4136).

Değiştirmek için `css/app.css` içindeki `:root` bloğundaki üç satır
yeter; tema başına ayrı ton istenirse `js/tema.js`'e de eklenir
(orası app.css'i ezer, bkz. yukarıdaki not).

## 2026-09-26 — açık başlık, beyaz zemin

- Başlık satırı **açık** oldu (`--baslik-zemin:#eae4d6`, koyu yazı).
  Siyah başlık göz yoruyordu.
- `--kagit` beyaza çekildi (app.css **ve** bej teması).
- Blok köşesindeki bozulma: başlık hücrelerine elle verilen
  `border-top-*-radius` kaldırıldı, `.hafta-blok`a `overflow:hidden`
  kondu; köşeyi artık kutu kırpıyor.
- İzin düğmelerindeki kesik çizgi düz çizgiye çevrildi.

## 2026-09-26 — mobilde iki hafta

900px altında `haftaOnceki2` ve `haftaOnceki3` gizleniyor; telefonda
yalnızca seçili hafta ve bir önceki görünüyor. Paneller silinmiyor,
yalnızca `display:none` — ekran büyüyünce dördü de geri geliyor.

Mobil ve masaüstü görünümü birbirinden tamamen ayırmak mümkün: her panel
`data-panel` ile işaretli, medya sorgusuyla hangi genişlikte hangisinin
görüneceği ayrı ayrı belirlenebiliyor.

## 2026-09-26 — mobil üst çubuk

Telefonda üst çubuk tek satır: logo, sürüm rozeti, menü, mağaza seçici,
profil. Menü sığmazsa kendi içinde yatay kayıyor (kaydırma çubuğu gizli),
satır alta taşmıyor. Yükseklik masaüstüyle aynı (43–44px).

"Yapıştır / Veri Ekle" telefonda gizli — veri orada girilmiyor.

Masaüstüne dokunulmadı; bütün değişiklikler 900px medya sorgusunun
içinde.

## 2026-09-26 — dışa/içe aktarma ve örnek verilerin temizlenmesi

**Dışa aktar** (üst çubuk, seçili mağaza): iki dosya iner.
`…-<mağaza>-<tarih>.json` bütün veriyi taşır (günler, haftalık hedefler,
ürün Excel'leri, rutin işaretleri, personel, kartlar). `.csv` yalnızca
günlük satırlardır; Excel Türkçe yerelde noktalı virgülle ayırdığı ve
BOM'suz Türkçe karakteri bozduğu için ikisi de veriliyor. v1'deki gibi
XLSX üretmedik: tek bir dışa aktarma için CDN'den kütüphane çekmeye
değmiyor, CSV'yi Excel doğrudan açıyor.

**İçe aktar** iki biçimi tanıyor:

- **v2 yedeği** — bu ekranın kendi dosyası, `uygulama:"mcrapor"` alanından
  anlaşılıyor.
- **v1 yedeği** — eski raporun "⬇ Dışa Aktar" çıktısı. Orada her gün
  `entry:YYYY-AA-GG` anahtarında **JSON metni** olarak duruyor.

v1 → v2 eşlemesinde dikkat edilenler:

| v1 | v2 | not |
|---|---|---|
| `toplu_satis` | `toplu` | ikisi de bin (K) cinsinden, doğrudan geçiyor |
| `mdo` (`"% 28,50"` metni) | `mdo` (sayı) | metin sayıya çevriliyor |
| `final` | `kesin` | |
| `izinli` (personel **adı**) | `izinler:[{personelId,tur}]` | ad, mağazanın personel listesiyle eşleşiyor; listede yoksa listeye ekleniyor. v1'de izin **türü** yok, `Haftalık` yazılıyor. |
| `weekgoal:YYYY-Www` | `hedef:<mağaza>:<hafta>` | yoksa o haftanın günlük `hedef` değerleri toplanıyor |

Dosya **seçili mağazaya** yükleniyor (v1 yedeği zaten tek profilin
verisi). Aynı güne ait mevcut kayıt korunup üzerine biniyor, diğer
günlere dokunulmuyor. Yüzlerce kayıt tek tek yazılmasın diye
`topluAnahtarYaz` 400'lük Firestore yığınlarıyla gönderiyor.

**Örnek verileri temizle** (Kurucu ayarları → Veri): kurulumda üretilen
sahte kayıtları siler — bütün mağazaların `gunler`, `hedefler`,
`urunHafta`, `rutinDurum` koleksiyonları, `ayarlar/personel` ve
`ayarlar/kartlar` belgeleri, ayrıca ortak `talepler` ve `duyurular`.
**Silmediği:** mağaza profilleri, kullanıcı hesapları, şifreler,
kategoriler, etiketler, KPI satır ayarı, toplu satış eşiği.

Firestore'da koleksiyon tek istekle silinemiyor; 300'lük sayfalarla
listeleyip yığın halinde siliniyor. Test kurulumunda 20 mağazada 1822
kayıt sildi, arkasından bütün ekranlar hatasız açıldı.

## 2026-09-27 — rutin kutusu

Panel başlığı ("✓ Haftalık rutin") kaldırıldı; `rutin` artık `BASLIKSIZ`
listesinde, gün adları en üstte. `0/8` sayacı sağ üst köşeye mutlak
konumlandı, kendine satır açmıyor; altına denk gelen `Paz` başlığına
sağ boşluk verildi.

Kutu sabit boyda (`.tablo-sar{height:180px}`). Bir güne madde eklenince
kutu uzayıp altındaki satırı itmiyor; bunun yerine en kalabalık gündeki
madde sayısına göre yazı küçülüyor (`--rutin-olcek`, js'te hesaplanıyor).
Ölçekler ölçülerek seçildi: 5'e kadar tam boy, 6 → 0.9, 7 → 0.8,
8+ → 0.72. Sekizden sonrası kutunun içinde kayıyor, düzen yine oynamıyor.

1920px'de satırdaki hafta ve duyuru blokları zaten 179px olduğu için
sabit boy hiçbir şey büyütmedi.

## 2026-09-27 — kendi onay pencereleri, şifre görünürlüğü, boş rutin

**Tarayıcı kutuları kalktı.** `confirm` ve `prompt` yerine `pencere.js`
içinde söz (Promise) döndüren `onay()` ve `soru()` var; siteyle aynı
görünüyorlar. Escape ve pencerenin dışına tıklama iptal sayılıyor
(`kapat()` artık `pencere-kapandi` olayı yayıyor, yoksa söz asılı
kalırdı). Sekiz çağrının hepsi değişti; kodda `confirm/prompt/alert`
kalmadı.

**Şifreler baştan açık.** Kurucu panelini yalnızca kurucu görebiliyor,
o yüzden `sifreGorunur` varsayılanı `true`. Göz düğmesi "Kullanıcılar"
kutusunun başlığına taşındı (altta, mağaza ekleme satırında kayboluyordu).
Şifreye tıklayınca panoya kopyalanıyor.

Şifre kutusunun neden var olduğu: Firebase kayıtlı şifreyi **hiçbir
şekilde geri vermiyor**. Kurucunun şifreyi görebilmesi için ayrı bir düz
metin kopyası (`mc2_sifreler`) tutmak şart. Kurallar bu koleksiyonu
yalnızca kurucuya açıyor.

Tarayıcıdan başkasının şifresini değiştirmenin tek yolu o hesaba
mevcut şifresiyle girip `updatePassword` çağırmak — bu yüzden mevcut
şifre gerekiyor. Panelden açılan her hesabın şifresi kayıtlı olduğu için
soru çıkmıyor; yalnızca bu özellikten önce açılmış hesaplarda bir kez
soruluyor. Admin SDK (Cloud Functions) ile mevcut şifre gerekmeden
değiştirilebilir ama Blaze (faturalı) plan istiyor.

**Yeni mağaza boş açılıyor.** `rutinGetir` varsayılanı artık `[]`;
hazır rutin listesi (Örneklem, Stok sayımı…) yalnızca örnek veri
üretilirken yazılıyor. Yeni mağazada gün tablosu, personel, rutin ve
hedefler boş.

## 2026-09-28 — denetim checklist'i

Menüye "Denetim" sayfası eklendi. 2026 Mağaza Denetim Kitapçığından
üretilmiş liste: 7 grup (A–G), 46 başlık, 168 madde, toplam 100 puan.

Metin `js/denetim-veri.js` içinde ve **elle yazılmadı** — kaynak markdown
bir betikle bu dosyaya çevrildi. Kitapçık güncellenince dosya yeniden
üretilir, elle düzenlenmez.

İşaretler mağaza bazında (`denetim:<magaza>` → `ayarlar/denetim`) tutuluyor
ve buluta gidiyor; bölge müdürü ve kurucu aynı durumu görüyor. Bölge
müdürü işaretleyemiyor (işaretleme mağazanın işi).

Üstteki özet dört sayı gösteriyor: işaretli madde, tamamlanma yüzdesi,
**risk altındaki puan** (en az bir maddesi eksik olan başlıkların puan
toplamı — kaybedilebilecek puanın üst sınırı) ve eksiği olan başlık
sayısı. "Yeni denetim" düğmesi işaretleri sıfırlıyor.

Dışa/içe aktarmaya da girdi: yedek dosyası denetim işaretlerini taşıyor.
