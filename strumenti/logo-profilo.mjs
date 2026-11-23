// Foto del profilo per i social (Instagram, GitHub…): il sole di promo/instagram/profilo.svg,
// con sopra, se vuoi, una lettera nello stile della scritta MAX BUILD THINGS del sito (Playfair corsivo cromato).
// Uso: node strumenti/logo-profilo.mjs <uscita.png> [lettera] [chiaro|azzurro]
//   senza lettera: solo il sole (come profilo.png)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [uscita, lettera = '', tono = 'chiaro'] = process.argv.slice(2);
if (!uscita) { console.error('Uso: node strumenti/logo-profilo.mjs <uscita.png> [lettera] [chiaro|azzurro]'); process.exit(1); }

// il disegno va dentro la pagina: un <img> file:// da setContent non si carica
const sole = readFileSync(path.join(radice, 'promo/instagram/profilo.svg'), 'utf8').replace(/<svg /, '<svg class="sole" ');
const font = pathToFileURL(path.join(radice, 'fonts/playfair-display-800i-latin.woff2')).href;
// le stesse sfumature della scritta del sito: «MAX» chiaro, «BUILD» azzurro
const riempi = tono === 'azzurro'
  ? 'linear-gradient(180deg,#45f0ff 0%,#fff 50%,#45f0ff 100%)'
  : 'linear-gradient(180deg,#fff 0%,#e8ebff 30%,#8a94c8 48%,#fff 52%,#ffd4f1 70%,#fff 100%)';
const ombra = tono === 'azzurro' ? '#073a47' : '#2b1680';
const passi = Array.from({ length: 26 }, (_, i) => `${i + 1}px ${i + 1}px ${ombra}`).join(',');

const html = `<!doctype html><html><head><style>
@font-face{font-family:P;font-style:italic;font-weight:800;src:url(${font}) format("woff2")}
html,body{margin:0;width:1080px;height:1080px;overflow:hidden;background:#140536}
svg.sole{position:absolute;inset:0;width:1080px;height:1080px}
.l{position:absolute;left:0;right:0;top:170px;text-align:center;font:italic 800 500px/1 P;letter-spacing:0}
.l span{position:relative;display:inline-block;isolation:isolate;padding:0 .12em}
.l span::before{content:attr(data-t);position:absolute;inset:0;padding:inherit;z-index:-2;color:${ombra};
  transform:translate(.03em,.035em);text-shadow:${passi},40px 40px 60px rgba(0,0,0,.7)}
.l i{font-style:inherit;display:block;position:relative;background:${riempi};-webkit-background-clip:text;background-clip:text;
  color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 40px rgba(255,95,193,.55));padding:0 .12em;margin:0 -.12em}
.l i::before,.l i::after{content:attr(data-t);position:absolute;inset:0;padding:inherit;z-index:-1;mix-blend-mode:screen;opacity:.9}
.l i::before{-webkit-text-fill-color:#ff5fc1;transform:translate(-14px,7px)}
.l i::after{-webkit-text-fill-color:#45f0ff;transform:translate(14px,-7px)}
</style></head><body>${sole}${lettera ? `<div class="l"><span data-t="${lettera}"><i data-t="${lettera}">${lettera}</i></span></div>` : ''}</body></html>`;

const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: uscita });
await browser.close();
console.log('fatto:', uscita);
