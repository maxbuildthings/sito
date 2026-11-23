// Foto del profilo in più stili, per sceglierne uno: ogni stile è una pagina 1080×1080 fotografata.
// Instagram e GitHub tagliano a cerchio: tutto quello che conta sta nel cerchio centrale.
// Uso: node strumenti/logo-stili.mjs <cartella-uscita> [stile...]   (senza stili: tutti)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cartella, ...scelti] = process.argv.slice(2);
if (!cartella) { console.error('Uso: node strumenti/logo-stili.mjs <cartella-uscita> [stile...]'); process.exit(1); }
// caratteri incorporati: letti da file:// in una pagina fatta con setContent non sempre arrivano
const f = n => `data:font/woff2;base64,${readFileSync(path.join(radice, 'fonts', n)).toString('base64')}`;
const base = `
@font-face{font-family:P;font-style:italic;font-weight:800;src:url(${f('playfair-display-800i-latin.woff2')}) format("woff2")}
@font-face{font-family:V;src:url(${f('vt323-latin.woff2')}) format("woff2")}
html,body{margin:0;width:1080px;height:1080px;overflow:hidden}
body{display:grid;place-items:center;position:relative}`;

// colori del sito
const ROSA = '#ff5fc1', CIANO = '#45f0ff', NOTTE = '#140536';
// il cursore a freccia di Windows, pixel per pixel (N nero, B bianco)
const FRECCIA = ['N', 'NN', 'NBN', 'NBBN', 'NBBBN', 'NBBBBN', 'NBBBBBN', 'NBBBBBBN', 'NBBBBBBBN', 'NBBBBBBBBN', 'NBBBBBBBBBN',
  'NBBBBBBNNNNN', 'NBBBNBBN', 'NBBN NBBN', 'NBN  NBBN', 'NN    NBBN', 'N     NBBN', '       NBBN', '       NBBN', '        NN'];
const freccia = FRECCIA.flatMap((r, y) => [...r].map((c, x) => c === ' ' ? '' : `<rect x="${x}" y="${y}" width="1" height="1" fill="${c === 'N' ? '#000' : '#fff'}"/>`)).join('');
const righe = `body::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 3px,transparent 3px 8px);pointer-events:none}`;

const STILI = {
  // la finestra Windows 98 del sito, con la M dentro
  finestra: `<style>${base}
body{background:linear-gradient(160deg,#3a0ca3 0%,${NOTTE} 70%)}
.w{width:740px;background:#c0c0c0;padding:8px;box-shadow:inset 6px 6px 0 #fff,inset -6px -6px 0 #404040,40px 40px 0 rgba(0,0,0,.35);transform:translateY(-10px)}
.t{height:96px;background:linear-gradient(90deg,#000080,#1084d0);display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:0 14px}
.b{width:58px;height:50px;background:#c0c0c0;box-shadow:inset 4px 4px 0 #fff,inset -4px -4px 0 #404040;font:700 40px/50px V;text-align:center;color:#000}
.c{height:500px;background:${NOTTE};margin-top:8px;display:grid;place-items:center;box-shadow:inset 6px 6px 0 #404040,inset -6px -6px 0 #fff}
.c span{font:italic 800 470px/1 P;color:${ROSA};text-shadow:14px 14px 0 ${CIANO};margin-top:-40px}
</style><div class="w"><div class="t"><div class="b">_</div><div class="b">×</div></div><div class="c"><span>M</span></div></div>`,

  // una M a pixel, come il carattere da terminale del sito
  pixel: `<style>${base}${righe}
body{background:radial-gradient(circle at 50% 45%,#2a0a5e 0%,#0b0220 75%)}
span{font:1150px/1 V;color:${ROSA};text-shadow:0 0 30px ${ROSA},0 0 90px rgba(255,95,193,.6),22px 22px 0 #3a0ca3;margin-top:-80px}
</style><span>M</span>`,

  // il cursore di Windows: «clicca, si costruisce»
  cursore: `<style>${base}
body{background:linear-gradient(150deg,${ROSA} 0%,#9b3cf0 100%)}
svg{width:${12 * 34}px;height:${20 * 34}px;transform:translate(50px,10px);filter:drop-shadow(28px 28px 0 rgba(20,5,54,.45))}
</style><svg viewBox="0 0 12 20" shape-rendering="crispEdges">${freccia}</svg>`,

  // M piatta, moderna: si legge anche piccolissima
  piatta: `<style>${base}
body{background:${ROSA}}
span{font:italic 800 640px/1 P;color:${NOTTE};margin:-90px 0 0 -40px}
span b{color:#fff;font-weight:800}
</style><span>M<b>.</b></span>`,

  // max_ da terminale
  terminale: `<style>${base}${righe}
body{background:${NOTTE}}
span{font:520px/1 V;color:#fff;text-shadow:0 0 24px rgba(69,240,255,.55);margin-top:-30px;letter-spacing:-6px}
i{font-style:normal;color:${CIANO}}
</style><span>max<i>_</i></span>`,
};

mkdirSync(cartella, { recursive: true });
const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
for (const nome of scelti.length ? scelti : Object.keys(STILI)) {
  if (!STILI[nome]) { console.error('stile sconosciuto:', nome, '— ci sono:', Object.keys(STILI).join(', ')); continue; }
  await pagina.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${STILI[nome]}</body></html>`, { waitUntil: 'load' });
  // i caratteri si caricano solo quando servono: li si chiede esplicitamente, poi si aspetta
  const ok = await pagina.evaluate(async () => { await Promise.all([document.fonts.load('italic 800 100px P'), document.fonts.load('100px V')]); await document.fonts.ready; return document.fonts.check('100px V') && document.fonts.check('italic 800 100px P'); });
  if (!ok) console.error('caratteri non caricati per', nome);
  const file = path.join(cartella, `${nome}.png`);
  await pagina.screenshot({ path: file });
  console.log('fatto:', file);
}
await browser.close();
