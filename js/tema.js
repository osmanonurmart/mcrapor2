// Renk temaları.
//
// Bütün renkler css/app.css içindeki :root değişkenlerinden geliyor; tema
// seçmek bu değişkenleri kök öğe üzerinde ezmekten ibaret. Seçim cihaza özel
// bir tercih olduğu için buluta gitmez, localStorage'da durur.

const ANAHTAR = 'mc2:tema';

export const TEMALAR = [
  {
    id:'bej', ad:'Bej', ornek:['#cfc7b6','#f6f2e9','#a87c38'],
    renkler:{
      '--arka':'#cfc7b6','--kagit':'#f6f2e9','--cizgi':'#6f6552','--cizgi-ince':'#9a8e77',
      '--yazi':'#141417','--soluk':'#55555f','--vurgu':'#a87c38','--acik-vurgu':'#f2e6cf',
      '--artis':'#236437','--dusus':'#96302f','--zemin-2':'#e4dcc9','--zemin-3':'#e6dfcc',
      '--zemin-hover':'#ece4d2','--bugun-zemin':'#efe4c8','--dusus-zemin':'#f0d9d9'
    }
  },
  {
    id:'gri', ad:'Gri-mavi', ornek:['#c8cbd0','#f4f5f7','#2f6f9e'],
    renkler:{
      '--arka':'#c8cbd0','--kagit':'#f4f5f7','--cizgi':'#5b6068','--cizgi-ince':'#8f959e',
      '--yazi':'#14161a','--soluk':'#525861','--vurgu':'#2f6f9e','--acik-vurgu':'#dce9f3',
      '--artis':'#1d6b3f','--dusus':'#a32f2f','--zemin-2':'#dfe2e7','--zemin-3':'#e3e6ea',
      '--zemin-hover':'#e9ecf0','--bugun-zemin':'#dbe8f2','--dusus-zemin':'#f2dcdc'
    }
  },
  {
    id:'yesil', ad:'Yeşil-haki', ornek:['#c3ccc1','#f2f5f0','#2f6b45'],
    renkler:{
      '--arka':'#c3ccc1','--kagit':'#f2f5f0','--cizgi':'#4f5c4c','--cizgi-ince':'#8a9786',
      '--yazi':'#141813','--soluk':'#4f5a4d','--vurgu':'#2f6b45','--acik-vurgu':'#dceadf',
      '--artis':'#1d6b3f','--dusus':'#a13230','--zemin-2':'#dbe3d8','--zemin-3':'#e0e7dd',
      '--zemin-hover':'#e7ece4','--bugun-zemin':'#d9e8dd','--dusus-zemin':'#f0dcdb'
    }
  },
  {
    id:'lacivert', ad:'Lacivert', ornek:['#bfc6d4','#f2f4f8','#1f4e8c'],
    renkler:{
      '--arka':'#bfc6d4','--kagit':'#f2f4f8','--cizgi':'#3f4a63','--cizgi-ince':'#828da4',
      '--yazi':'#11141c','--soluk':'#4b5468','--vurgu':'#1f4e8c','--acik-vurgu':'#d8e3f2',
      '--artis':'#1d6b3f','--dusus':'#a32f2f','--zemin-2':'#d8dee9','--zemin-3':'#dde3ee',
      '--zemin-hover':'#e6eaf2','--bugun-zemin':'#d5e2f4','--dusus-zemin':'#f2dcdc'
    }
  },
  {
    id:'koyu', ad:'Koyu', ornek:['#16181c','#22252b','#d2a24c'],
    renkler:{
      '--arka':'#16181c','--kagit':'#22252b','--cizgi':'#4c525c','--cizgi-ince':'#3a3f48',
      '--yazi':'#e8eaee','--soluk':'#9aa1ad','--vurgu':'#d2a24c','--acik-vurgu':'#3a3423',
      '--artis':'#4bb072','--dusus':'#e06a6a','--zemin-2':'#2c3038','--zemin-3':'#2a2e35',
      '--zemin-hover':'#30343c','--bugun-zemin':'#3a3423','--dusus-zemin':'#3d2727',
      '--golge':'0 2px 10px rgba(0,0,0,.5)','--golge-buyuk':'0 12px 40px rgba(0,0,0,.6)'
    }
  }
];

export const VARSAYILAN = 'bej';

export function temaGetir(){
  try{ return localStorage.getItem(ANAHTAR) || VARSAYILAN; }
  catch(e){ return VARSAYILAN; }
}

export function temaUygula(id){
  const tema = TEMALAR.find(t => t.id === id) || TEMALAR.find(t => t.id === VARSAYILAN);
  const kok = document.documentElement;
  // Önce bütün tema değişkenlerini temizle, sonra seçilenleri yaz. Yoksa
  // bir temanın fazladan alanı (koyu temanın gölgeleri) diğerine sızar.
  TEMALAR.forEach(t => Object.keys(t.renkler).forEach(k => kok.style.removeProperty(k)));
  Object.entries(tema.renkler).forEach(([k,v]) => kok.style.setProperty(k,v));
  kok.dataset.tema = tema.id;
  return tema.id;
}

export function temaYaz(id){
  try{ localStorage.setItem(ANAHTAR, id); }catch(e){}
  return temaUygula(id);
}
