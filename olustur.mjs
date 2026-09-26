// Tek dosyalık sürümü üretir: v2/tek-dosya.html
// index.html'i okuyup stili ve paketlenmiş betiği içine gömer; böylece dosya
// çift tıklanarak (file:// ile) açılabilir, yerel sunucu gerekmez.
// İki ayrı HTML şablonu tutulmaz, kaynak her zaman index.html'dir.
//
// Çalıştırma:  npm i -D esbuild && node olustur.mjs
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

// Sürüm numarası elle artırılmaz: commit sayısından üretilir. Bu betik her
// yayından önce çalıştığı için sayı her yayında kendiliğinden büyür.
// Aynı sayı üç yere yazılır: js/surum.js (uygulama), surum.json (tarayıcının
// baktığı dosya) ve sw.js önbellek adı (eski dosyalar düşsün diye).
let surumNo;
try{
  surumNo = Number(execSync('git rev-list --count HEAD', {encoding:'utf8'}).trim()) + 1;
}catch(e){
  const eski = await readFile('js/surum.js', 'utf8');
  surumNo = Number((eski.match(/export const SURUM = (\d+);/) || [])[1] || 0) + 1;
}

const surumKaynak = await readFile('js/surum.js', 'utf8');
await writeFile('js/surum.js',
  surumKaynak.replace(/export const SURUM = \d+;/, 'export const SURUM = ' + surumNo + ';'), 'utf8');

const swKaynak = await readFile('sw.js', 'utf8');
await writeFile('sw.js',
  swKaynak.replace(/const SURUM = 'mc2-v\d+';/, "const SURUM = 'mc2-v" + surumNo + "';"), 'utf8');

await writeFile('surum.json', JSON.stringify({surum: surumNo}) + '\n', 'utf8');
console.log('sürüm v' + surumNo + ' — js/surum.js, sw.js ve surum.json güncellendi');

const paket = await build({
  entryPoints: ['js/app.js'],
  bundle: true,
  format: 'iife',
  target: ['chrome100','firefox100','safari15'],
  charset: 'utf8',
  write: false
});
const js  = paket.outputFiles[0].text;
const css = await readFile('css/app.css', 'utf8');
const ikon = await readFile('icon.svg', 'utf8');

let html = await readFile('index.html', 'utf8');
html = html
  .replace('<link rel="manifest" href="./manifest.webmanifest">\n', '')
  .replace('href="./icon.svg"', `href="data:image/svg+xml;base64,${Buffer.from(ikon).toString('base64')}"`)
  .replace('<link rel="stylesheet" href="./css/app.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./js/app.js"></script>', `<script>\n${js}\n</script>`);

await writeFile('tek-dosya.html', html, 'utf8');
console.log('tek-dosya.html yazıldı — ' + Math.round(html.length/1024) + ' KB');


// --- Yer imi: kaynaktan tek satırlık sürüm üretip kurulum sayfasına göm ---
const yerimi = await build({
  entryPoints: ['yerimi/kaynak.js'],
  bundle: true, format: 'iife', minify: true,
  target: ['chrome100','firefox100','safari15'], charset: 'utf8', write: false
});
const yerimiKodu = 'javascript:' + yerimi.outputFiles[0].text.trim().replace(/;?\s*$/, ';');
let kurulum = await readFile('yer-imi.html', 'utf8');
kurulum = kurulum.replace(
  /(<script type="text\/plain" id="yerimiKodu">)[\s\S]*?(<\/script>)/,
  (_, a, b) => a + yerimiKodu + b
);
await writeFile('yer-imi.html', kurulum, 'utf8');
console.log('yer-imi.html güncellendi — kod ' + yerimiKodu.length + ' karakter');
