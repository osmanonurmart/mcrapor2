# Test sürümü

`https://osmanonurmart.github.io/mcrapor2/test/`

Ana uygulamanın birebir kopyası. **Gerçek veriyi okur, hiçbir şey yazmaz.**
Yeni özellikler ve düzeltmeler önce burada yapılır; onay verilince ana
uygulamaya aktarılır.

## Nasıl çalışıyor

Uygulama kaynağına (`test/js`, `test/css`) test diye tek satır eklenmedi —
ana sürümün aynısıdır. Fark yalnızca iki dosyada:

| Dosya | Ne yapar |
|---|---|
| `test-kalkan.js` | Uygulama kodundan önce yüklenir, global `firebase` nesnesini sarar |
| `index.html` | Kalkanı yükler, üstteki kırmızı şeridi çizer, manifest'i kaldırır |

Kalkanın engelledikleri:

- **Firestore yazmaları** — `set`, `update`, `delete`, `add` ve `batch.commit`.
  Okuma serbest: test sürümü gerçek veriyi görür.
- **Hesap işlemleri** — kullanıcı açma, şifre değiştirme, sıfırlama postası.
  Giriş serbest.

Engellenen her çağrı konsola yazılır, ekranın altında sayaçlı bir uyarı
çıkar ve `window.__testYazmalari()` ile listelenebilir. Uygulama hata
vermeden çalışmaya devam eder; yalnızca bulut değişmez.

Ayrıca çakışma olmasın diye:

- Firebase uygulama adı `mc2` yerine `mc2-test` — aynı tarayıcıda ana
  uygulamanın oturumunu düşürmez (ikisi de `github.io`, aynı köken).
- `localStorage` anahtarları `mc2:` yerine `mc2test:` — tema ve panel
  yerleşimi gibi kişisel ayarlar ayrı tutulur.
- Kendi `sw.js`'i var ve hiçbir şey yapmaz; ana uygulamanın service
  worker'ı bu klasörü yönetmesin diye.

## Bilinen sınır

Bulutta hiç veri yoksa test sürümü kurulum ekranında takılır — örnek veri
üretmek de bir yazma işlemidir ve engellenir. Gerçek projede veri zaten
var, bu durum yalnızca boş bir veritabanında görülür.

## Ana uygulamaya aktarma

Onay verilince:

    node yayinla.mjs

`test/js` ve `test/css` kök dizine kopyalanır, sürüm numarası artırılır ve
`tek-dosya.html` yeniden üretilir. Kalkan ve test `index.html`'i
kopyalanmaz. Kök `index.html` değişmesi gerekiyorsa betik uyarır.
