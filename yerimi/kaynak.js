// "Veri Kopyala" yer imi — kaynak kod.
// Tek satırlık sürümü olustur.mjs üretip yer-imi.html içine gömer.
//
// Davranış: sayfadaki tabloları, alanları, seçimleri ve açılır listeleri JSON
// olarak toplar, doğrudan panoya kopyalar ve kısa bir bildirim gösterir.
// Kopyalama engellenirse metni bir kutuda gösterip elle kopyalatır.
(() => {
  const BUYUK_FATURA_ESIGI = 2700;   // uygulamadaki eşikle aynı olmalı

  const T = s => (s || '').replace(/\s+/g, ' ').trim();
  const V = e => {
    if(!e || !e.getClientRects().length) return false;
    const s = getComputedStyle(e);
    return s.visibility !== 'hidden' && s.display !== 'none';
  };
  const L = e => T(
    (e.labels && e.labels[0] && e.labels[0].innerText) ||
    e.getAttribute('aria-label') || e.getAttribute('title') ||
    e.placeholder || e.name || e.id ||
    (e.closest('tr,li,label,div') || {}).innerText || ''
  ).slice(0, 120);

  const belgeler = [document];
  document.querySelectorAll('iframe').forEach(f => {
    try{ if(f.contentDocument) belgeler.push(f.contentDocument); }catch(x){}
  });

  const cikti = {
    url: location.href, baslik: document.title, zaman: new Date().toISOString(),
    ozet: {}, tablolar: [], secimler: [], alanlar: [], listeler: [], anahtarlar: []
  };

  belgeler.forEach(d => {
    d.querySelectorAll('table').forEach(t => cikti.tablolar.push({
      no: cikti.tablolar.length + 1, gorunur: V(t),
      satirlar: [...t.rows].map(r => [...r.cells].map(c => T(c.innerText)))
    }));
    d.querySelectorAll('input[type=checkbox],input[type=radio]').forEach(e =>
      cikti.secimler.push({etiket: L(e), tur: e.type, acik: e.checked, gorunur: V(e)}));
    d.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=button]):not([type=submit]),textarea')
      .forEach(e => cikti.alanlar.push({etiket: L(e), deger: e.value, gorunur: V(e)}));
    d.querySelectorAll('select').forEach(e => cikti.listeler.push({
      etiket: L(e),
      secili: [...e.selectedOptions].map(o => T(o.text)),
      secenekler: [...e.options].map(o => T(o.text)),
      gorunur: V(e)
    }));
    d.querySelectorAll('[aria-checked],[aria-pressed],[aria-expanded],[aria-selected]').forEach(e => {
      const a = ['aria-checked','aria-pressed','aria-expanded','aria-selected'].find(k => e.hasAttribute(k));
      if(!a) return;
      cikti.anahtarlar.push({
        etiket: T(e.getAttribute('aria-label') || e.innerText).slice(0, 120),
        durum: a.replace('aria-','') + '=' + e.getAttribute(a),
        gorunur: V(e)
      });
    });
  });

  cikti.ozet = {
    acik_secim: cikti.secimler.filter(x => x.acik).length,
    kapali_secim: cikti.secimler.filter(x => !x.acik).length,
    tablo: cikti.tablolar.length, alan: cikti.alanlar.length,
    liste: cikti.listeler.length, anahtar: cikti.anahtarlar.length
  };

  // --- Bildirim için küçük özet: tarih, bugünkü ciro, büyük fatura sayısı ---
  const sayi = s => {
    let t = String(s ?? '').replace(/[^\d.,\-]/g, '');
    if(!t) return null;
    if(t.includes(',')) t = t.replace(/\./g,'').replace(',', '.');
    else if(/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g,'');
    const n = parseFloat(t);
    return isNaN(n) ? null : n;
  };
  const basligaGore = f => cikti.tablolar.find(t => t.satirlar.length && f(t.satirlar[0].map(T)));

  const tarihAlani = cikti.alanlar.find(a => /^tarih$/i.test(T(a.etiket)));
  const tarih = tarihAlani ? T(tarihAlani.deger) : '';

  const kpiTablosu = basligaGore(b => /^bug[uü]n$/i.test(b[1] || ''));
  let bugunCiro = null, dunCiro = null;
  if(kpiTablosu){
    const satir = kpiTablosu.satirlar.find(r => /^ciro$/i.test(T(r[0])));
    if(satir){ bugunCiro = sayi(satir[1]); dunCiro = sayi(satir[2]); }
  }

  const gruplama = cikti.listeler.find(l => /gruplama/i.test(T(l.etiket)));
  const faturaBazli = gruplama && /fatura/i.test(T((gruplama.secili || [])[0] || ''));
  const grupTablosu = basligaGore(b => /^grup$/i.test(b[0] || ''));
  let buyukFatura = null, faturaAdedi = null;
  if(faturaBazli && grupTablosu){
    const baslik = grupTablosu.satirlar[0].map(T);
    const toplamSutun = baslik.findIndex(h => /^toplam$/i.test(h));
    if(toplamSutun > -1){
      const tutarlar = grupTablosu.satirlar.slice(1).map(r => sayi(r[toplamSutun])).filter(v => v !== null);
      faturaAdedi = tutarlar.length;
      buyukFatura = tutarlar.filter(v => v >= BUYUK_FATURA_ESIGI).length;
    }
  }

  const json = JSON.stringify(cikti, null, 2);

  // --- Bildirim ---
  const bildir = (basarili, ek) => {
    document.querySelectorAll('.__mcKopyaBildirim').forEach(x => x.remove());
    const k = document.createElement('div');
    k.className = '__mcKopyaBildirim';
    k.style.cssText = 'position:fixed;top:18px;right:18px;z-index:2147483647;max-width:340px;' +
      'background:' + (basarili ? '#1d1d1f' : '#7d2b2b') + ';color:#fff;border-radius:12px;' +
      'padding:13px 16px;font:13px/1.5 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35)';
    k.innerHTML = '<b style="font-size:14px">' + (basarili ? '✓ Panoya kopyalandı' : '⚠ Kopyalanamadı') + '</b>' +
      '<div style="margin-top:5px;opacity:.85">' + ek + '</div>';
    document.body.appendChild(k);
    setTimeout(() => k.remove(), 6000);
    k.addEventListener('click', () => k.remove());
  };

  const satirlar = [];
  if(tarih) satirlar.push('Tarih: ' + tarih);
  const para = v => v.toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' ₺';
  if(bugunCiro !== null) satirlar.push('Bugün: ' + para(bugunCiro));
  if(dunCiro !== null) satirlar.push('Dün (kesinleşti): ' + para(dunCiro));
  if(buyukFatura !== null){
    satirlar.push(buyukFatura + ' büyük fatura' + (faturaAdedi ? ' / ' + faturaAdedi : '') +
      ' (' + BUYUK_FATURA_ESIGI.toLocaleString('tr-TR') + ' ₺ üstü)');
  } else if(gruplama){
    satirlar.push('Gruplama: ' + T((gruplama.secili || [])[0] || '-') + ' — büyük fatura için "Fatura No" seçin');
  }
  const ozetMetni = satirlar.join('<br>');

  const elleKopyala = () => {
    const ta = document.createElement('textarea');
    ta.value = json;
    ta.style.cssText = 'position:fixed;inset:20px;z-index:2147483646;font:12px monospace;padding:10px';
    document.body.appendChild(ta);
    ta.select();
    let tamam = false;
    try{ tamam = document.execCommand('copy'); }catch(e){ tamam = false; }
    if(tamam){ ta.remove(); bildir(true, ozetMetni); }
    else bildir(false, 'Kutudaki metni Ctrl+A, Ctrl+C ile kopyalayın.<br>Kutuyu kapatmak için bu bildirime tıklayın.');
  };

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(json).then(() => bildir(true, ozetMetni), elleKopyala);
  } else {
    elleKopyala();
  }
})();
