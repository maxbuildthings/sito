// Cambia il dominio del sito in tutti i file (canonical, anteprima, sitemap, README, indirizzi di base degli strumenti).
// Uso: node strumenti/dominio.mjs maxbuildthings.com
import { readFileSync, writeFileSync } from 'node:fs';
const nuovo = process.argv[2];
if (!nuovo) throw new Error('manca il dominio');
const vecchi = /https:\/\/maxbuildthings\.(com|vercel\.app)/g;
const file = ['index.html', 'sitemap.xml', 'robots.txt', 'README.md', 'profilo-github/README.md',
  'strumenti/video.mjs', 'strumenti/controlla-safari.mjs', 'strumenti/cruscotto.mjs'];
for (const f of file) {
  const s = readFileSync(f, 'utf8');
  writeFileSync(f, s.replace(vecchi, `https://${nuovo}`).replace(/\[maxbuildthings\.(com|vercel\.app)/g, `[${nuovo}`));
}
console.log('dominio:', nuovo);
