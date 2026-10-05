// Ürün talep sistemi.
// Mağaza ekranı: ürünün yanındaki artıya basınca sepete girer, yerine yeşil tik
// ve kalem çıkar; kalemden ürüne not yazılır ("tek kişilik, siyah" gibi).
// Bölge ekranı: aynı liste, artı yerine kaç mağazanın istediği yazar; tıklayınca
// isteyen mağazalar ve notları açılır.
import * as U from './util.js';
import * as V from './veri.js';

const sepetler = {};   // magazaKey -> {urunId: {adet, not}}

export function haftaninTalebi(magazaKey, pzt){
  const hk = U.haftaKey(pzt);
  return V.taleplerGetir().find(t => t.magazaKey === magazaKey && t.hafta === hk) || null;
}
export function tumUrunler(){
  return V.kategorilerGetir().flatMap(k => (k.urunler || []).map(u => ({...u, kategori:k.ad})));
}
function urunAdi(id){
  const u = tumUrunler().find(x => x.id === id);
  return u ? u.ad : id;
}

// ---------------- Mağaza ekranı ----------------
export function talepEkrani(magazaKey, yenile){
  const pzt = U.pazartesi(U.bugun());
  const mevcut = haftaninTalebi(magazaKey, pzt);
  // Bu haftanın talebi gönderilmişse sepet ondan doldurulur, üzerine eklenir.
  const sepet = sepetler[magazaKey] = sepetler[magazaKey] || {};
  if(mevcut && !Object.keys(sepet).length){
    mevcut.satirlar.forEach(s => { sepet[s.urunId] = {adet: s.adet, not: s.not || ''}; });
  }

  const kok = U.el(`<div class="talep-ekran">
    <div class="talep-sol">
      <div class="bolum-ust">
        <h2>Ürün talebi</h2>
        <span class="alt">${U.haftaBasligi(pzt)} · talep günü pazartesi</span>
      </div>
      <div class="kategori-liste"></div>
    </div>
    <aside class="talep-sag">
      <div class="panel-kutu">
        <h3>🛒 Sepet</h3>
        <div class="sepet-liste"></div>
        <button class="mini birincil gonder">Talebi gönder</button>
        <div class="sepet-not"></div>
      </div>
      <div class="panel-kutu">
        <h3>🕘 Geçmiş talepler</h3>
        <div class="talep-gecmis"></div>
      </div>
    </aside>
  </div>`);

  const katListe = kok.querySelector('.kategori-liste');
  const sepetListe = kok.querySelector('.sepet-liste');
  const not = kok.querySelector('.sepet-not');
  const gonderBtn = kok.querySelector('.gonder');

  function urunleriCiz(){
    katListe.innerHTML = '';
    V.kategorilerGetir().forEach(kat => {
      const blok = U.el(`<div class="kategori"><h4>${U.esc(kat.ad)}</h4><div class="urunler"></div></div>`);
      const kap = blok.querySelector('.urunler');
      (kat.urunler || []).forEach(u => {
        const secili = sepet[u.id];
        const satir = U.el(`<div class="urun-satir ${secili ? 'secili' : ''}">
          <span class="u-ad">${U.esc(u.ad)}</span>
          ${secili ? '<span class="u-tik" title="Sepette">✓</span>' : ''}
          <button class="u-dugme ${secili ? 'kalem' : 'arti'}"
                  title="${secili ? 'Not ekle veya düzenle' : 'Sepete ekle'}">${secili ? '✎' : '+'}</button>
        </div>`);
        if(secili && secili.not){
          satir.appendChild(U.el(`<div class="u-notu">${U.esc(secili.not)}</div>`));
        }
        satir.querySelector('.u-dugme').addEventListener('click', () => {
          if(!sepet[u.id]){
            sepet[u.id] = {adet:1, not:''};
            urunleriCiz(); sepetCiz();
          } else {
            notAlani(satir, u.id);
          }
        });
        kap.appendChild(satir);
      });
      katListe.appendChild(blok);
    });
  }

  // Kalem: satırın altında küçük bir not kutusu açar.
  function notAlani(satir, urunId){
    if(satir.querySelector('.u-not-girdi')) return;
    const eski = satir.querySelector('.u-notu');
    if(eski) eski.remove();
    const kutu = U.el(`<div class="u-not-girdi">
      <input type="text" maxlength="80" placeholder="Detay: tek kişilik, siyah..." value="${U.esc(sepet[urunId].not || '')}">
      <button class="mini birincil">Kaydet</button>
      <button class="mini sil" title="Sepetten çıkar">✕</button>
    </div>`);
    const girdi = kutu.querySelector('input');
    const kaydet = () => { sepet[urunId].not = girdi.value.trim(); urunleriCiz(); sepetCiz(); };
    kutu.querySelector('.birincil').addEventListener('click', kaydet);
    kutu.querySelector('.sil').addEventListener('click', () => { delete sepet[urunId]; urunleriCiz(); sepetCiz(); });
    girdi.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); kaydet(); }
      if(e.key === 'Escape'){ e.preventDefault(); urunleriCiz(); }
    });
    satir.appendChild(kutu);
    girdi.focus();
  }

  function sepetCiz(){
    const idler = Object.keys(sepet);
    sepetListe.innerHTML = idler.length ? '' : '<div class="menu-bos">Sepet boş.</div>';
    idler.forEach(id => {
      const s = sepet[id];
      const satir = U.el(`<div class="sepet-satir">
        <span class="s-ad">${U.esc(urunAdi(id))}${s.not ? `<i class="s-not">${U.esc(s.not)}</i>` : ''}</span>
        <button class="mini" data-eksi="1">−</button>
        <span class="s-adet">${s.adet}</span>
        <button class="mini" data-arti="1">+</button>
        <button class="mini" data-sil="1">✕</button>
      </div>`);
      satir.querySelector('[data-eksi]').addEventListener('click', () => {
        s.adet = Math.max(1, s.adet - 1); sepetCiz();
      });
      satir.querySelector('[data-arti]').addEventListener('click', () => { s.adet++; sepetCiz(); });
      satir.querySelector('[data-sil]').addEventListener('click', () => {
        delete sepet[id]; urunleriCiz(); sepetCiz();
      });
      sepetListe.appendChild(satir);
    });
    gonderBtn.disabled = !idler.length;
  }

  gonderBtn.addEventListener('click', () => {
    const satirlar = Object.keys(sepet).map(id => ({
      urunId: id, ad: urunAdi(id), adet: sepet[id].adet, not: sepet[id].not || ''
    }));
    if(!satirlar.length) return;
    // Nesne kimliğiyle karşılaştırmak işe yaramıyor: taleplerGetir her çağrıda
    // JSON'dan yeni nesneler üretiyor. Mağaza ve hafta ile eleniyor.
    const hk = U.haftaKey(pzt);
    const eski = haftaninTalebi(magazaKey, pzt);
    const liste = V.taleplerGetir().filter(t => !(t.magazaKey === magazaKey && t.hafta === hk));
    liste.push({
      id: 't' + Date.now(), magazaKey, hafta: hk,
      tarih: new Date().toISOString(), durum: 'Gönderildi', satirlar
    });
    V.taleplerYaz(liste);
    gecmisCiz();
    not.textContent = eski ? 'Bu haftanın talebi güncellendi ✓' : 'Talep gönderildi ✓';
    setTimeout(() => { not.textContent = ''; }, 2500);
  });

  const gecmis = kok.querySelector('.talep-gecmis');
  function gecmisCiz(){
    const liste = V.taleplerGetir().filter(t => t.magazaKey === magazaKey)
      .sort((a,b) => b.tarih.localeCompare(a.tarih));
    gecmis.innerHTML = liste.length ? '' : '<div class="menu-bos">Henüz talep yok.</div>';
    liste.slice(0,8).forEach(t => {
      gecmis.appendChild(U.el(`<div class="gecmis-satir">
        <div class="g-ust"><b>${U.esc(t.hafta)}</b><span class="durum ${t.durum === 'Gönderildi' ? 'bekliyor' : ''}">${U.esc(t.durum)}</span></div>
        <div class="g-alt">${t.satirlar.map(s => U.esc(s.ad) + ' ×' + s.adet + (s.not ? ' (' + U.esc(s.not) + ')' : '')).join(', ')}</div>
      </div>`));
    });
  }

  urunleriCiz(); sepetCiz(); gecmisCiz();
  if(mevcut) not.textContent = 'Bu hafta için talep gönderilmiş; değişiklik yapıp tekrar gönderebilirsiniz.';
  return kok;
}

// ---------------- Bölge ekranı ----------------
// Ürün listesi aynı görünümde; artı yerine kaç mağazanın istediği yazar.
export function urunTalepListesi(pzt){
  const hk = U.haftaKey(pzt);
  const talepler = V.taleplerGetir().filter(t => t.hafta === hk);
  const magazaAdi = k => { const p = V.profilGetir(k); return p ? p.ad : k; };

  // urunId -> [{magaza, adet, not}]
  const harita = {};
  talepler.forEach(t => (t.satirlar || []).forEach(s => {
    (harita[s.urunId] = harita[s.urunId] || []).push({magaza: magazaAdi(t.magazaKey), adet: s.adet, not: s.not || ''});
  }));

  const kok = U.el('<div class="kategori-liste"></div>');
  V.kategorilerGetir().forEach(kat => {
    const blok = U.el(`<div class="kategori"><h4>${U.esc(kat.ad)}</h4><div class="urunler"></div></div>`);
    const kap = blok.querySelector('.urunler');
    (kat.urunler || []).forEach(u => {
      const isteyenler = harita[u.id] || [];
      const toplamAdet = isteyenler.reduce((t,x) => t + (x.adet || 0), 0);
      const satir = U.el(`<div class="urun-satir ${isteyenler.length ? 'secili' : ''}">
        <span class="u-ad">${U.esc(u.ad)}</span>
        ${isteyenler.length ? '<span class="u-tik" title="İstenmiş">✓</span>' : ''}
        ${isteyenler.length
          ? `<button class="u-sayac" title="İsteyen mağazaları göster">${isteyenler.length} mağaza · ${toplamAdet} adet</button>`
          : '<span class="u-sayac bos" title="Kimse istemedi">–</span>'}
      </div>`);
      if(isteyenler.length){
        satir.querySelector('.u-sayac').addEventListener('click', () => {
          const acik = satir.querySelector('.u-magazalar');
          if(acik){ acik.remove(); return; }
          satir.appendChild(U.el(`<div class="u-magazalar">
            ${isteyenler.map(x => `<div class="u-magaza">
              <span class="um-ad">${U.esc(x.magaza)}</span>
              <span class="um-adet">×${x.adet}</span>
              <span class="um-not">${x.not ? U.esc(x.not) : ''}</span>
            </div>`).join('')}
          </div>`));
        });
      }
      kap.appendChild(satir);
    });
    kok.appendChild(blok);
  });
  return kok;
}

// Bölge müdürü için pazartesi raporu özeti.
export function talepRaporu(pzt){
  const hk = U.haftaKey(pzt);
  const magazalar = V.magazalar();
  const talepler = V.taleplerGetir().filter(t => t.hafta === hk);
  const gonderen = talepler.map(t => t.magazaKey);
  return {
    hafta: hk,
    gonderenler: magazalar.filter(m => gonderen.includes(m.key)),
    gondermeyenler: magazalar.filter(m => !gonderen.includes(m.key)),
    talepler
  };
}
