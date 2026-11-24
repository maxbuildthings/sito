// Foto per i post (4:5, 1080×1350): il sito dentro un telefono, davanti alla scena 3D del sito. Tutto dritto e centrato.
// Uso: node strumenti/post-telefono.mjs <cartella-uscita> [url]
//   fa: telefono.jpg (un telefono grande), titolo.jpg (il titolo sopra, il telefono sotto), tre.jpg (tre telefoni: sito, finestre, contatti)
//   e i pezzi: sfondo.jpg (la scena senza scritte) e schermo-*.png (le tre schermate del telefono)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cartella, url = 'https://maxbuildthings.com/?lang=it'] = process.argv.slice(2);
if (!cartella) { console.error('Uso: node strumenti/post-telefono.mjs <cartella-uscita> [url]'); process.exit(1); }
mkdirSync(cartella, { recursive: true });
const indirizzo = url + (url.includes('?') ? '&' : '?') + 'gl=forza';
const dentro = n => path.join(cartella, n);
const uri = (file, tipo) => `data:${tipo};base64,${readFileSync(file).toString('base64')}`;
const f = n => uri(path.join(radice, 'fonts', n), 'font/woff2');
const browser = await chromium.launch();
const senzaAvvio = ctx => ctx.addInitScript(() => { sessionStorage.setItem('booted', '1'); sessionStorage.setItem('dlg', '1'); });

// 1. lo sfondo: la scena 3D del sito (cielo, sole, griglia, oggetti cromati) senza finestre né scritte.
//    Si fotografa quadrata e si taglia al centro: con la pagina quadrata gli oggetti cromati stanno ai lati, non tagliati in fondo
{
  const ctx = await browser.newContext({ viewport: { width: 1350, height: 1350 }, locale: 'it-IT' });
  await senzaAvvio(ctx);
  const p = await ctx.newPage();
  await p.goto(indirizzo, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'body>*:not(#scene){visibility:hidden!important}' });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: dentro('sfondo.jpg'), type: 'jpeg', quality: 92, clip: { x: 135, y: 0, width: 1080, height: 1350 } });
  await ctx.close();
}

// 2. le schermate del telefono (390 px come un iPhone, la parte che resta tra la barra in alto e quella di Safari in basso)
const ALTO = 47, SAFARI = 80, W = 390, H = 844;
const schermate = { sito: null, finestre: '#pibreria', contatti: '#contatti' };
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H - ALTO - SAFARI }, deviceScaleFactor: 3, locale: 'it-IT', isMobile: true, hasTouch: true });
  await senzaAvvio(ctx);
  for (const [nome, dove] of Object.entries(schermate)) {
    const p = await ctx.newPage();
    await p.goto(indirizzo, { waitUntil: 'networkidle' });
    await p.waitForTimeout(3500); // la scritta in alto si scrive da sola e la scena 3D parte
    if (dove) {
      await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 14); }, dove);
      await p.waitForTimeout(2000);
    }
    await p.screenshot({ path: dentro(`schermo-${nome}.png`) });
    await p.close();
  }
  await ctx.close();
}

// 3. il telefono: cornice, isola, barra in alto (ora, rete, batteria) e la barra di Safari con l'indirizzo
const telefono = nome => `<div class="tel"><div class="vetro">
  <div class="stato"><b>9:41</b><span class="isola"></span><svg viewBox="0 0 70 14" width="70" height="14"><g fill="#fff"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/>
    <path d="M30 4.5a10 10 0 0 1 13 0l-1.6 1.7a7.6 7.6 0 0 0-9.8 0z M33 8a5.5 5.5 0 0 1 7 0l-1.6 1.7a3.2 3.2 0 0 0-3.8 0z M35.3 11.3a2 2 0 0 1 2.4 0L36.5 13z"/>
    <rect x="49" y="1" width="18" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><rect x="51" y="3" width="13" height="8" rx="2"/><rect x="68" y="5" width="1.6" height="4" rx=".8" fill-opacity=".5"/></g></svg></div>
  <img src="${uri(dentro(`schermo-${nome}.png`), 'image/png')}">
  <div class="safari"><div class="pillola"><span>aA</span><b>maxbuildthings.com</b><span>↻</span></div><i></i></div>
</div></div>`;
const css = `
@font-face{font-family:P;font-style:italic;font-weight:800;src:url(${f('playfair-display-800i-latin.woff2')}) format("woff2")}
@font-face{font-family:V;src:url(${f('vt323-latin.woff2')}) format("woff2")}
html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:#140536}
body{position:relative;font-family:-apple-system,"SF Pro Text","Helvetica Neue",sans-serif}
.sfondo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.velo{position:absolute;inset:0;background:radial-gradient(ellipse 60% 55% at 50% 52%,rgba(11,2,32,.55),rgba(11,2,32,0) 75%)}
.posto{position:absolute;left:50%;transform-origin:50% 0}
.tel{width:${W + 28}px;height:${H + 28}px;box-sizing:border-box;padding:14px;border-radius:66px;position:relative;
  background:linear-gradient(135deg,#4a4560,#1b1826 30%,#0d0b14 70%,#3b3650);
  box-shadow:0 0 0 2px #6d6688 inset,0 0 70px rgba(255,95,193,.55),0 0 140px rgba(69,240,255,.25),0 50px 90px rgba(0,0,0,.6)}
.tel::before,.tel::after{content:"";position:absolute;width:5px;border-radius:3px;background:#2a2638}
.tel::before{left:-4px;top:190px;height:64px;box-shadow:0 84px 0 #2a2638}.tel::after{right:-4px;top:230px;height:100px}
.vetro{position:relative;width:${W}px;height:${H}px;border-radius:52px;overflow:hidden;background:#140536}
.vetro>img{position:absolute;left:0;top:${ALTO}px;width:${W}px;height:${H - ALTO - SAFARI}px}
.stato{position:absolute;left:0;right:0;top:0;height:${ALTO}px;display:flex;align-items:center;justify-content:space-between;padding:4px 30px 0 46px;box-sizing:border-box;color:#fff;font-size:17px}
.isola{position:absolute;left:50%;top:11px;width:124px;height:36px;margin-left:-62px;border-radius:20px;background:#000}
.safari{position:absolute;left:0;right:0;bottom:0;height:${SAFARI}px;background:rgba(28,22,44,.96);border-top:1px solid rgba(255,255,255,.08)}
.pillola{margin:9px 12px 0;height:44px;border-radius:13px;background:rgba(255,255,255,.13);display:flex;align-items:center;justify-content:space-between;padding:0 14px;color:#fff;font-size:17px}
.pillola span{opacity:.75;font-size:16px}.pillola b{font-weight:500}
.safari i{position:absolute;left:50%;bottom:8px;width:134px;height:5px;margin-left:-67px;border-radius:3px;background:#fff}
h1{position:absolute;left:0;right:0;top:70px;margin:0;text-align:center;font:italic 800 92px/1.02 P;letter-spacing:-.02em;
  background:linear-gradient(180deg,#fff 0%,#e8ebff 30%,#8a94c8 48%,#fff 52%,#ffd4f1 70%,#fff 100%);-webkit-background-clip:text;color:transparent;
  filter:drop-shadow(0 0 18px rgba(255,95,193,.55)) drop-shadow(5px 6px 0 #2b1680)}
.dietro .tel{filter:brightness(.72) saturate(.9)}`;
const pagina = corpo => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<img class="sfondo" src="${uri(dentro('sfondo.jpg'), 'image/jpeg')}"><div class="velo"></div>${corpo}</body></html>`;
// un telefono al centro: k = scala, top = dove comincia
const posto = (nome, k, top, dx = 0, classe = '') => `<div class="posto ${classe}" style="top:${top}px;transform:translateX(calc(-50% + ${dx}px)) scale(${k})">${telefono(nome)}</div>`;
const alto = k => (H + 28) * k;
const foto = {
  telefono: pagina(posto('sito', 1.2, (1350 - alto(1.2)) / 2)),
  titolo: pagina(`<h1>Siti, app e strumenti<br>su misura.</h1>${posto('sito', .98, 1350 - alto(.98) - 40)}`),
  tre: pagina(posto('finestre', .9, (1350 - alto(.9)) / 2, -318, 'dietro') + posto('contatti', .9, (1350 - alto(.9)) / 2, 318, 'dietro') + posto('sito', 1.08, (1350 - alto(1.08)) / 2)),
};
const p = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [nome, html] of Object.entries(foto)) {
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(async () => { await document.fonts.load('italic 800 100px P'); await document.fonts.ready; });
  await p.waitForTimeout(200);
  await p.screenshot({ path: dentro(`${nome}.jpg`), type: 'jpeg', quality: 92 });
  console.log('fatto:', dentro(`${nome}.jpg`));
}
await browser.close();
