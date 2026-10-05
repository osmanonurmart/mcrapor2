// Test sürümünü ana uygulamaya aktarır.
//
//   node yayinla.mjs          → ne değişeceğini gösterir, dokunmaz
//   node yayinla.mjs --uygula → kopyalar ve tek-dosya.html'i üretir
//
// test/js ve test/css kök dizine kopyalanır. test/index.html ve
// test-kalkan.js kopyalanmaz: onlar yalnızca test sürümüne ait.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

const UYGULA = process.argv.includes('--uygula');
const KLASORLER = ['js', 'css'];

async function dosyalar(kok){
  const cikti = [];
  for(const girdi of await readdir(kok, {withFileTypes:true})){
    const yol = path.join(kok, girdi.name);
    if(girdi.isDirectory()) cikti.push(...await dosyalar(yol));
    else cikti.push(yol);
  }
  return cikti;
}

const oku = async y => { try{ return await readFile(y, 'utf8'); }catch(e){ return null; } };

let yeni = 0, degisen = 0, aynı = 0;
for(const klasor of KLASORLER){
  for(const kaynak of await dosyalar(path.join('test', klasor))){
    const hedef = kaynak.replace(/^test[\\/]/, '');
    const a = await oku(kaynak), b = await oku(hedef);
    if(a === b){ aynı++; continue; }
    if(b === null){ yeni++; console.log('  YENİ     ' + hedef); }
    else { degisen++; console.log('  DEĞİŞTİ  ' + hedef); }
    if(UYGULA){
      await mkdir(path.dirname(hedef), {recursive:true});
      await writeFile(hedef, a, 'utf8');
    }
  }
}

// index.html test tarafında elle değiştirilmiş olabilir; betik ona dokunmaz.
const testHtml = await oku('test/index.html');
const kokHtml  = await oku('index.html');
const sadeTest = testHtml
  .replace(/<script src="\.\/test-kalkan\.js"><\/script>\n/, '')
  .replace('<title>TEST — ', '<title>')
  .replace(/<style>[\s\S]*?<\/style>\n/, '')
  .replace(/ {2}<div class="test-serit">[\s\S]*?<\/div>\n/, '');
if(sadeTest.replace(/<link rel="manifest"[^>]*>\n/, '') !== kokHtml.replace(/<link rel="manifest"[^>]*>\n/, '')){
  console.log('\n  ⚠ test/index.html ile kök index.html farklı. Değişikliği elle taşıyın.');
}

console.log('\n' + (UYGULA ? 'Aktarıldı' : 'Önizleme') +
            ': ' + yeni + ' yeni, ' + degisen + ' değişen, ' + aynı + ' aynı dosya.');
if(!UYGULA){ console.log('Uygulamak için: node yayinla.mjs --uygula'); process.exit(0); }
if(!yeni && !degisen){ console.log('Aktarılacak bir şey yok, sürüm artırılmadı.'); process.exit(0); }

console.log('\ntek-dosya.html üretiliyor…');
execSync('node olustur.mjs', {stdio:'inherit'});
