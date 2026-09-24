// Bölge müdürü paneli: özet tablo, hedef girişi, duyuru, talep raporu.
import * as U from './util.js';
import * as V from './veri.js';
import { haftaOzeti } from './hafta.js';
import { talepRaporu } from './talep.js';

const METRIKLER = [
  {id:'ciro', ad:'Ciro',  al:o=>o.ciroToplam, bicim:U.fmtTL},
  {id:'mdo',  ad:'MDO',   al:o=>o.mdoOrt,     bicim:v=>U.fmtYuzde(v,1)},
  {id:'fbu',  ad:'FBÜ',   al:o=>o.fbuOrt,     bicim:v=>U.fmtSayi(v,2)},
  {id:'fbs',  ad:'FBS',   al:o=>o.fbsOrt,     bicim:U.fmtTL},
  {id:'mgs',  ad:'MGS',   al:o=>o.mgsToplam,  bicim:v=>U.fmtSayi(v,0)},
  {id:'toplu',ad:'Toplu', al:o=>o.topluToplam,bicim:v=>U.fmtSayi(v,0)}
];

export function bolgePaneli(pzt, yenile){
  const gorunum = V.bolgeGorunumGetir();
  const secili = METRIKLER.filter(m => gorunum.metrikler.includes(m.id));
  const magazalar = V.magazalar();
  const oncekiPzt = U.haftaEkle(pzt, -1);

  const satirlar = magazalar.map(m => {
    const bu = haftaOzeti(m.key, pzt);
    // Devam eden hafta, geçen haftanın aynı sayıdaki ilk günüyle kıyaslanır.
    const gecen = haftaOzeti(m.key, oncekiPzt, bu.doluGun || undefined);
    return {magaza:m, bu, gecen, yorum:sonYorum(m.key)};
  });
  // Kaç gün üzerinden kıyaslandığını başlıkta söyle.
  const kiyasGun = Math.max(...satirlar.map(s => s.bu.doluGun || 0), 0);
  // Ciro değişimine göre sırala: en çok düşen en üstte görünsün.
  satirlar.sort((a,b) => (U.yuzdeDegisim(a.gecen.ciroToplam, a.bu.ciroToplam) ?? 0)
                       - (U.yuzdeDegisim(b.gecen.ciroToplam, b.bu.ciroToplam) ?? 0));

  const kok = U.el(`<div class="bolge-panel">
    <div class="bolum-ust">
      <h2>Özet — ${U.haftaBasligi(pzt)}</h2>
      <span class="alt">${magazalar.length} mağaza · geçen haftanın ${kiyasGun && kiyasGun < 7 ? 'ilk ' + kiyasGun + ' günü' : 'tamamı'} ile kıyas</span>
    </div>

    <div class="gorunum-cubugu">
      <span>Görünüm:</span>
      ${METRIKLER.map(m => `<button class="mini metrik ${gorunum.metrikler.includes(m.id)?'secili':''}" data-metrik="${m.id}">${m.ad}</button>`).join('')}
    </div>

    <div class="tablo-sar">
      <table class="ozet-tablo">
        <thead><tr>
          <th>Mağaza</th>
          ${secili.map(m => `<th colspan="3">${m.ad}</th>`).join('')}
          <th>Hedef%</th><th>Yorum</th>
        </tr>
        <tr class="alt-baslik">
          <th></th>
          ${secili.map(() => '<th>Geçen H.</th><th>Bu Hafta</th><th>Fark</th>').join('')}
          <th></th><th></th>
        </tr></thead>
        <tbody>
          ${satirlar.map(s => {
            const hucreler = secili.map(m => {
              const g = m.al(s.gecen), b = m.al(s.bu);
              const d = U.yuzdeDegisim(g, b);
              return `<td>${g===null?'–':m.bicim(g)}</td><td>${b===null?'–':m.bicim(b)}</td>
                      <td class="${U.degisimSinifi(d)}">${U.fmtDegisim(d)}</td>`;
            }).join('');
            const hedefOran = s.bu.oran;
            return `<tr data-magaza="${s.magaza.key}">
              <td class="magaza-ad"><span class="nokta" style="background:${s.magaza.renk}"></span>${U.esc(s.magaza.ad)}</td>
              ${hucreler}
              <td class="${hedefOran >= 100 ? 'artis' : (hedefOran !== null && hedefOran < 80 ? 'dusus' : '')}">${hedefOran===null?'–':U.fmtYuzde(hedefOran,0)}</td>
              <td class="yorum-hucre">${U.esc(s.yorum || '')}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="bolge-alt">
      <div class="panel-kutu hedef-kutu">
        <h3>Hedef girişi — ${U.haftaKey(pzt)}</h3>
        <div class="hedef-tur">
          <label><input type="radio" name="hedefTur" value="elle" checked> Elle</label>
          <label><input type="radio" name="hedefTur" value="yapistir"> Excel’den yapıştır</label>
          <label><input type="radio" name="hedefTur" value="kural"> Kural</label>
        </div>
        <div class="hedef-icerik"></div>
      </div>

      <div class="panel-kutu">
        <h3>Ürün talepleri — pazartesi raporu</h3>
        <div class="talep-rapor"></div>
      </div>

      <div class="panel-kutu">
        <h3>Duyuru</h3>
        <textarea class="duyuru-alan" placeholder="Bugün deterjan hedefi mağaza başı 20 adet"></textarea>
        <button class="mini birincil duyuru-gonder">Gönder 🔔</button>
        <div class="duyuru-gecmis"></div>
      </div>
    </div>
  </div>`);

  // --- Görünüm metrikleri ---
  kok.querySelectorAll('[data-metrik]').forEach(b => b.addEventListener('click', () => {
    const g = V.bolgeGorunumGetir();
    const id = b.dataset.metrik;
    g.metrikler = g.metrikler.includes(id) ? g.metrikler.filter(x => x !== id) : g.metrikler.concat(id);
    if(!g.metrikler.length) g.metrikler = ['ciro'];
    V.bolgeGorunumYaz(g);
    yenile();
  }));
  kok.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', () => {
    yenile({magazaDetay: tr.dataset.magaza});
  }));

  // --- Hedef girişi ---
  const hedefIcerik = kok.querySelector('.hedef-icerik');
  const hedefCiz = tur => {
    if(tur === 'elle'){
      hedefIcerik.innerHTML = `<div class="hedef-elle">${magazalar.map(m =>
        `<label class="hedef-satir"><span>${U.esc(m.ad)}</span>
          <input type="text" inputmode="numeric" data-hedef="${m.key}" value="${V.haftaHedefGetir(m.key, pzt) ?? ''}"></label>`).join('')}</div>`;
      hedefIcerik.querySelectorAll('[data-hedef]').forEach(i => i.addEventListener('change', () => {
        V.haftaHedefYaz(i.dataset.hedef, pzt, U.metniSayiyaCevir(i.value));
      }));
    } else if(tur === 'yapistir'){
      hedefIcerik.innerHTML = `<textarea class="hedef-yapistir" placeholder="Mağaza 2307&#9;150000&#10;magaza 2314&#9;180.000"></textarea>
        <button class="mini birincil hedef-isle">Eşleştir ve yaz</button><div class="hedef-sonuc"></div>`;
      hedefIcerik.querySelector('.hedef-isle').addEventListener('click', () => {
        const satirlar = hedefIcerik.querySelector('.hedef-yapistir').value.split('\n').map(s => s.trim()).filter(Boolean);
        const log = [];
        satirlar.forEach(satir => {
          const p = satir.split(/\t|;|\s{2,}/).map(x => x.trim());
          const ad = p[0], hedef = U.metniSayiyaCevir(p[1]);
          // Esnek eşleştirme: büyük/küçük harf, boşluk, Türkçe karakter farkı tolere edilir.
          const bulunan = magazalar.find(m => U.normalizeAd(m.ad) === U.normalizeAd(ad))
            || magazalar.find(m => U.normalizeAd(m.ad).includes(U.normalizeAd(ad)) || U.normalizeAd(ad).includes(U.normalizeAd(m.ad)));
          if(!bulunan || hedef === null){ log.push(`<div class="kotu">✕ ${U.esc(satir)} — eşleşmedi</div>`); return; }
          V.haftaHedefYaz(bulunan.key, pzt, hedef);
          log.push(`<div class="iyi">✓ ${U.esc(bulunan.ad)} → ${U.fmtSayi(hedef,0)}</div>`);
        });
        hedefIcerik.querySelector('.hedef-sonuc').innerHTML = log.join('');
      });
    } else {
      hedefIcerik.innerHTML = `<label class="kural-satir">Geçen haftanın cirosu
        <input type="number" class="kural-yuzde" value="25" step="5"> % üstü</label>
        <button class="mini birincil kural-uygula">Bütün mağazalara uygula</button><div class="hedef-sonuc"></div>`;
      hedefIcerik.querySelector('.kural-uygula').addEventListener('click', () => {
        const y = Number(hedefIcerik.querySelector('.kural-yuzde').value) || 0;
        let sayac = 0;
        magazalar.forEach(m => {
          const h = V.kuralHedefi(m.key, pzt, y);
          if(h !== null){ V.haftaHedefYaz(m.key, pzt, h); sayac++; }
        });
        hedefIcerik.querySelector('.hedef-sonuc').innerHTML = `<div class="iyi">${sayac} mağazaya hedef yazıldı.</div>`;
      });
    }
  };
  hedefCiz('elle');
  kok.querySelectorAll('[name=hedefTur]').forEach(r => r.addEventListener('change', () => hedefCiz(r.value)));

  // --- Talep raporu ---
  const rapor = talepRaporu(pzt);
  kok.querySelector('.talep-rapor').innerHTML = `
    <div class="rapor-ust">Gönderen: <b>${rapor.gonderenler.length}</b> · Göndermeyen: <b>${rapor.gondermeyenler.length}</b></div>
    ${rapor.talepler.map(t => {
      const m = V.profilGetir(t.magazaKey);
      return `<div class="rapor-satir"><b>${U.esc(m ? m.ad : t.magazaKey)}</b>: ${t.satirlar.map(s =>
        U.esc(s.ad) + ' ×' + s.adet + (s.not ? ' <i class="s-not">' + U.esc(s.not) + '</i>' : '')).join(', ')}</div>`;
    }).join('') || '<div class="menu-bos">Bu hafta talep gelmedi.</div>'}
    ${rapor.gondermeyenler.length ? `<div class="rapor-eksik">Göndermeyen: ${rapor.gondermeyenler.map(m => U.esc(m.ad)).join(', ')}</div>` : ''}`;

  // --- Duyuru ---
  const duyuruAlan = kok.querySelector('.duyuru-alan');
  const gecmisKutu = kok.querySelector('.duyuru-gecmis');
  const duyuruCiz = () => {
    const liste = V.duyurularGetir();
    gecmisKutu.innerHTML = liste.length ? '' : '<div class="menu-bos">Duyuru yok.</div>';
    liste.slice(0,5).forEach(d => {
      const satir = U.el(`<div class="duyuru"><span>${U.esc(d.metin)}</span><button class="mini" title="Sil">✕</button></div>`);
      satir.querySelector('button').addEventListener('click', () => { V.duyuruSil(d.id); duyuruCiz(); });
      gecmisKutu.appendChild(satir);
    });
  };
  duyuruCiz();
  kok.querySelector('.duyuru-gonder').addEventListener('click', () => {
    const m = duyuruAlan.value.trim();
    if(!m) return;
    V.duyuruEkle(m);
    duyuruAlan.value = '';
    duyuruCiz();
  });

  return kok;
}

function sonYorum(magazaKey){
  for(let i=0;i<7;i++){
    const d = new Date(U.bugun()); d.setDate(d.getDate()-i);
    const k = V.gunGetir(magazaKey, U.dateStr(d));
    if(k && k.yorum) return k.yorum;
  }
  return '';
}
