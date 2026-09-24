// Tek dosyalık sürümü üretir: v2/tek-dosya.html
// index.html'i okuyup stili ve paketlenmiş betiği içine gömer; böylece dosya
// çift tıklanarak (file:// ile) açılabilir, yerel sunucu gerekmez.
// İki ayrı HTML şablonu tutulmaz, kaynak her zaman index.html'dir.
//
// Çalıştırma:  npm i -D esbuild && node olustur.mjs
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

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
