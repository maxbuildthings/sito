// Avvisa Bing e gli altri motori IndexNow (Yandex, Seznam, Naver…) che il sito è cambiato. Da lanciare dopo ogni deploy.
// Uso: node strumenti/indexnow.mjs [url del sito]   (predefinito: quello della sitemap)
// La chiave non è segreta: sta sul sito come <chiave>.txt nella cartella principale (il file .txt di 32 caratteri esadecimali).
import fs from 'node:fs';

const file = fs.readdirSync('.').find(f => /^[0-9a-f]{32}\.txt$/.test(f));
if (!file) { console.error('Manca il file della chiave (<32 caratteri esadecimali>.txt) nella cartella del sito.'); process.exit(1); }
const chiave = file.slice(0, -4);
const urls = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const sito = (process.argv[2] || new URL(urls[0]).origin).replace(/\/$/, '');

// la chiave deve rispondere online, altrimenti IndexNow rifiuta tutto
const online = await fetch(`${sito}/${file}`).then(r => r.text()).catch(() => '');
if (online.trim() !== chiave) { console.error(`La chiave non è online su ${sito}/${file}: prima il deploy.`); process.exit(1); }

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(sito).host, key: chiave, keyLocation: `${sito}/${file}`, urlList: urls.map(u => u.replace(new URL(u).origin, sito)) }),
});
console.log(`${new URL(sito).host}: ${urls.length} indirizzi → ${r.status} ${r.statusText}`);
if (r.status >= 400) { console.log(await r.text()); process.exitCode = 1; }
