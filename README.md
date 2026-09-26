# Mağaza Performans Takip — v2

Mağaza müdürü, bölge müdürü ve kurucu için haftalık performans takibi.
Veri Firebase'de (Firestore) durur; her mağaza kendi kullanıcı adı ve
şifresiyle girer ve yalnızca kendi verisini görür.

**Canlı:** https://osmanonurmart.github.io/mcrapor2/

v1 (`rapor.html`) ayrı bir depoda:
[osmanonurmart/magazarapor](https://github.com/osmanonurmart/magazarapor).
İki uygulama birbirinden bağımsız çalışır.

## Ne var

- Haftalık KPI tabloları — dört hafta 2×2 (seçili hafta sağ üstte)
- Kaynak siteden yapıştırarak veri girişi, toplu satış eşiğine göre
  fatura sayımı
- İzin ve personel yönetimi, haftalık rutin listesi
- Dün/bugün, ay içi ve ay toplamı sekmeli özet paneli
- Ürün talepleri (not ve mağaza kırılımıyla)
- Bölge müdürü özeti, hedef girişi, duyurular
- Kurucu paneli: mağaza ve kullanıcı yönetimi, kategoriler, eşikler
- Beş renk teması, ölçü modu, sürüm rozeti ve güncelleme kontrolü
- PWA — telefona kurulabilir, çevrimdışı açılır

## Çalıştırma

### Tek dosya

`tek-dosya.html` dosyasını indir ve çift tıkla. Kurulum gerekmez, her şey
o dosyanın içinde. Firebase'e bağlanamadığı için yerel deneme modunda,
örnek veriyle açılır.

### Geliştirirken

```bash
python3 -m http.server 8900
```

Sonra `http://localhost:8900`. `index.html`'e çift tıklamak çalışmaz —
tarayıcı `file://` üzerinden modül dosyalarını okumaz.

### Tek dosyayı yeniden üretme

```bash
npm i -D esbuild
node olustur.mjs
```

`tek-dosya.html`, `surum.json` ve `yer-imi.html` yeniden üretilir.

## Yeni sürüm çıkarma

1. `js/surum.js` içindeki `SURUM` sayısını artır
2. `sw.js` içindeki `SURUM` önbellek adını artır
3. `node olustur.mjs`
4. Commit ve push

Uygulama açılışta ve 30 dakikada bir `surum.json`a bakar; sayı büyükse
ikonun yanındaki rozet "↑" olur, tıklanınca önbellek temizlenip yeni
sürüm yüklenir.

## Firebase

Kurulum adımları: [KURULUM-FIREBASE.md](KURULUM-FIREBASE.md)
Güvenlik kuralları: [firestore.rules](firestore.rules)

## Dosyalar

| Dosya | İş |
|---|---|
| `js/app.js` | İskelet: giriş, üst çubuk, sayfa yönlendirme, tema, sürüm |
| `js/bulut.js` | Firebase bağlantısı, kullanıcı açma, şifre değiştirme |
| `js/veri.js` | Veri katmanı: bellek önbelleği + Firestore'a yazma |
| `js/magaza.js` | Mağaza ekranı, haftalık tablolar, yapıştırma penceresi |
| `js/bolge.js` | Bölge müdürü özeti, hedef girişi, duyurular |
| `js/kurucu.js` | Kurucu paneli: mağaza ve kullanıcı yönetimi |
| `js/talep.js` | Ürün talepleri |
| `js/yapistir.js` | Kaynak sayfanın çıktısını çözümleme |
| `js/yerlesim.js` | Panel yerleşimi |
| `js/tema.js` | Renk temaları |
| `js/surum.js` | Sürüm ve güncelleme kontrolü |
| `yerimi/` | Kaynak siteden veri kopyalayan yer imi |
| `NOTLAR.md` | Çözülen hatalar, kararlar, bilinen eksikler |
