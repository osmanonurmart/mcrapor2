// Kurumsal hafıza ve araçlar.
//
// Şimdilik boş bir iskelet: bölümler duruyor, içerikleri sonra doldurulacak.
// Not defteri kısmı çalışır durumda — yazılanlar mağaza bazında saklanıyor —
// böylece sayfa boş dururken de bir işe yarıyor.
import * as U from './util.js';
import * as V from './veri.js';

// Sonradan doldurulacak bölümler. Buraya bir madde eklemek yeterli;
// ekran kendiliğinden çizer.
const BOLUMLER = [
  {id:'surecler', simge:'📋', ad:'Süreçler ve talimatlar',
   aciklama:'Kasa kapanışı, sevkiyat kabulü, iade akışı gibi adım adım anlatımlar.'},
  {id:'sablonlar', simge:'📄', ad:'Form ve şablonlar',
   aciklama:'Tutanaklar, gider pusulası örnekleri, çalışma çizelgesi şablonları.'},
  {id:'egitim', simge:'🎓', ad:'Eğitim notları',
   aciklama:'Yeni personel için ürün, sistem ve müşteri iletişimi notları.'},
  {id:'sss', simge:'❓', ad:'Sık sorulanlar',
   aciklama:'Mağazalardan en çok gelen sorular ve cevapları.'},
  {id:'kisiler', simge:'📞', ad:'Kime sorulur',
   aciklama:'Hangi konu hangi departmana gider, kim ne zaman aranır.'},
  {id:'araclar', simge:'🧰', ad:'Araçlar',
   aciklama:'Hesaplayıcılar, dönüştürücüler ve kısayollar. Eski raporun araç kutuları buraya taşınacak.'}
];

export function hafizaEkrani(magazaKey, secenekler = {}){
  const duzenlenebilir = secenekler.duzenlenebilir !== false;
  const profil = V.profilGetir(magazaKey);
  const kok = U.el(`<div class="hafiza-ekran">
    <div class="bolum-ust">
      <h2>Kurumsal hafıza ve araçlar</h2>
      <span class="alt">${U.esc(profil ? profil.ad : '')} — bölümler sonra doldurulacak</span>
    </div>
    <div class="hafiza-izgara">
      ${BOLUMLER.map(b => `<section class="hafiza-kart" data-bolum="${b.id}">
        <div class="h-simge">${b.simge}</div>
        <h3>${U.esc(b.ad)}</h3>
        <p>${U.esc(b.aciklama)}</p>
        <span class="h-rozet">yakında</span>
      </section>`).join('')}
    </div>
    <section class="panel-kutu hafiza-not">
      <h3>📝 Mağaza not defteri</h3>
      <p class="aciklama">Bu mağazaya ait serbest notlar. Yazdıkça kaydedilir;
        bölge müdürü ve kurucu da görür.</p>
      <textarea class="hafiza-alan" placeholder="Not yazın..." ${duzenlenebilir ? '' : 'readonly'}></textarea>
      <span class="hafiza-durum"></span>
    </section>
  </div>`);

  const alan = kok.querySelector('.hafiza-alan');
  const durum = kok.querySelector('.hafiza-durum');
  alan.value = V.notDefteriGetir(magazaKey);
  if(duzenlenebilir){
    let zaman = null;
    alan.addEventListener('input', () => {
      durum.textContent = 'yazılıyor…';
      clearTimeout(zaman);
      // Her tuşta yazmak yerine yazı durunca kaydedilir.
      zaman = setTimeout(() => {
        V.notDefteriYaz(magazaKey, alan.value);
        durum.textContent = 'kaydedildi ✓';
        setTimeout(() => { durum.textContent = ''; }, 2000);
      }, 600);
    });
  }
  return kok;
}
