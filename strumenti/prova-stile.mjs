// Prova uno stile senza toccare il sito: aggiunge un CSS alla pagina (server locale) e fa le stesse foto ogni volta,
// così le proposte si confrontano con «com'è adesso» a parità di tutto.
// Uso: node strumenti/prova-stile.mjs <nome> [stile.css] [script.js] [url]
// Foto in /tmp/stile-<nome>-*.jpg: alto (1440×900), griglia, dettaglio (una finestra a 2×), fondo (Contatti), tel (390×844).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [nome, ...resto] = process.argv.slice(2);
if (!nome) { console.error('uso: node strumenti/prova-stile.mjs <nome> [stile.css] [script.js] [url]'); process.exit(1); }
const url = resto.find((a) => /^https?:/.test(a)) || 'http://localhost:5182/';
const cssFile = resto.find((a) => a.endsWith('.css'));
const jsFile = resto.find((a) => a.endsWith('.js'));
const css = cssFile ? readFileSync(cssFile, 'utf8') : '';
const js = jsFile ? readFileSync(jsFile, 'utf8') : '';
const out = (s) => `/tmp/stile-${nome}-${s}.jpg`;

const browser = await chromium.launch();
async function apri(viewport, mobile, dpr = 1) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, locale: 'it-IT', bypassCSP: true });
  await ctx.addInitScript(() => { sessionStorage.setItem('booted', '1'); sessionStorage.setItem('dlg', '1'); });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  if (css) await page.addStyleTag({ content: css });
  if (js) await page.addScriptTag({ content: js });
  await page.waitForTimeout(1800);
  return { ctx, page };
}
async function scorriA(page, sel, sopra = 40) {
  await page.evaluate(([s, d]) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - d); }, [sel, sopra]);
  await page.waitForTimeout(700);
}

// computer
{
  const { ctx, page } = await apri({ width: 1440, height: 900 }, false);
  await page.mouse.move(300, 700);
  await page.screenshot({ path: out('alto'), type: 'jpeg', quality: 74 });
  await scorriA(page, '.toolbar', 20);
  await page.mouse.move(240, 330);               // il mouse sopra la prima finestra (per gli effetti al passaggio)
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('griglia'), type: 'jpeg', quality: 74 });
  await scorriA(page, '#contatti', 60);
  await page.screenshot({ path: out('fondo'), type: 'jpeg', quality: 74 });
  await ctx.close();
}
// dettaglio: una finestra a 2×, con il mouse sopra
{
  const { ctx, page } = await apri({ width: 1440, height: 900 }, false, 2);
  await scorriA(page, '#lamora', 30);
  const r = await (await page.$('#lamora')).boundingBox();
  await page.mouse.move(r.x + r.width * .7, r.y + 40);
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('dettaglio'), type: 'jpeg', quality: 78, clip: { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: Math.min(r.height + 40, 900 - r.y + 20) } });
  await ctx.close();
}
// telefono
{
  const { ctx, page } = await apri({ width: 390, height: 844 }, true, 2);
  await scorriA(page, '#pibreria', 16);
  await page.screenshot({ path: out('tel'), type: 'jpeg', quality: 70 });
  await scorriA(page, '#contatti', 16);
  await page.screenshot({ path: out('tel-fondo'), type: 'jpeg', quality: 70 });
  await ctx.close();
}
await browser.close();
console.log('foto in /tmp/stile-' + nome + '-*.jpg');
