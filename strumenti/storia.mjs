// La storia di Instagram col biglietto (9:16, 1080×1920): il sole della foto del profilo, «Ciao, sono Max.» e lo spazio per l'adesivo col link.
// Uso: node strumenti/storia.mjs <sole.png> <uscita.jpg>   (sole.png: la foto del profilo 1080×1080 di logo-stili.mjs)
// In alto (250 px) e in basso (300 px) Instagram mette nome e barra delle risposte: lì non c'è niente di importante.
// L'adesivo «Link» si aggiunge dall'app del telefono, nello spazio vuoto sotto «tocca qui sotto».
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [sole, uscita] = process.argv.slice(2);
if (!sole || !uscita) { console.error('Uso: node strumenti/storia.mjs <sole.png> <uscita.jpg>'); process.exit(1); }
const f = n => `data:font/woff2;base64,${readFileSync(path.join(radice, 'fonts', n)).toString('base64')}`;
const griglia = [...Array.from({ length: 17 }, (_, i) => i - 8).map(k => `<line x1="${540 + k * 50}" y1="0" x2="${540 + k * 230}" y2="260" stroke-width="3" opacity=".6"/>`),
  ...[8, 24, 46, 76, 116, 168, 236].map((y, i) => `<line x1="0" x2="1080" y1="${y}" y2="${y}" stroke-width="${2 + i * .5}" opacity="${.3 + i * .09}"/>`)].join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:P;font-style:italic;font-weight:800;src:url(${f('playfair-display-800i-latin.woff2')}) format("woff2")}
@font-face{font-family:V;src:url(${f('vt323-latin.woff2')}) format("woff2")}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
body{position:relative;color:#fff;background:linear-gradient(180deg,#0b0220 0%,#140536 40%,#1d0750 75%,#3a0b63 100%)}
.sole{position:absolute;left:50px;top:220px;width:980px;height:980px;-webkit-mask:radial-gradient(circle closest-side,#000 84%,transparent 100%)}
.testo{position:absolute;left:0;right:0;top:1170px;text-align:center}
h1{margin:0;font:italic 800 136px/1 P;letter-spacing:-.02em;background:linear-gradient(180deg,#fff 0%,#e8ebff 30%,#8a94c8 48%,#fff 52%,#ffd4f1 70%,#fff 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(255,95,193,.55)) drop-shadow(6px 7px 0 #2b1680)}
p{margin:30px 0 0;font:62px/1.05 V;color:#ffe27a;text-shadow:0 0 14px rgba(255,190,90,.6)}
.tocca{margin-top:64px;font:52px/1 V;color:#45f0ff;text-shadow:0 0 10px rgba(69,240,255,.8)}
svg{position:absolute;left:0;bottom:0;width:1080px;height:260px}
.orizzonte{position:absolute;left:0;right:0;bottom:258px;height:5px;background:#ffd1ec;box-shadow:0 0 18px 4px rgba(255,95,193,.7)}
body::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 2px,transparent 2px 6px);pointer-events:none}
</style></head><body>
<img class="sole" src="data:image/png;base64,${readFileSync(sole).toString('base64')}">
<div class="testo"><h1>Ciao, sono Max.</h1><p>siti · app · strumenti su misura</p><div class="tocca">↓ tocca qui sotto ↓</div></div>
<div class="orizzonte"></div><svg viewBox="0 0 1080 260"><rect width="1080" height="260" fill="#12042e"/><g stroke="#45f0ff">${griglia}</g></svg>
</body></html>`;
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(async () => { await Promise.all([document.fonts.load('italic 800 100px P'), document.fonts.load('100px V')]); await document.fonts.ready; });
await p.waitForTimeout(200);
await p.screenshot({ path: uscita, type: 'jpeg', quality: 92 });
await browser.close();
console.log('fatto:', uscita);
