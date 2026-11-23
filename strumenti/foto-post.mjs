// Foto per un post social (Instagram 4:5, 1080×1350): la parte alta del sito come la vede un telefono.
// Uso: node strumenti/foto-post.mjs <uscita.jpg> [url] [larghezza css]
//   predefiniti: il sito online in italiano, 480 px di larghezza (più stretto = scritte più grandi)
import { chromium } from 'playwright';

const [uscita, url = 'https://maxbuildthings.com/?lang=it', larga = '480'] = process.argv.slice(2);
if (!uscita) { console.error('Uso: node strumenti/foto-post.mjs <uscita.jpg> [url] [larghezza css]'); process.exit(1); }
const w = Number(larga), h = Math.round(w * 1350 / 1080);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1080 / w, locale: 'it-IT', isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { sessionStorage.setItem('booted', '1'); sessionStorage.setItem('dlg', '1'); });
const pagina = await ctx.newPage();
await pagina.goto(url + (url.includes('?') ? '&' : '?') + 'gl=forza', { waitUntil: 'networkidle' });
await pagina.waitForTimeout(4000); // la scritta in alto si scrive da sola e la scena 3D parte
await pagina.screenshot({ path: uscita, type: 'jpeg', quality: 92 });
await browser.close();
console.log('fatto:', uscita, `${w * 1080 / w}×${Math.round(h * 1080 / w)}`);
