// Foto della griglia dei progetti, sul computer (1440) e sul telefono (390), per controllare ordine e impaginazione.
// Uso: node strumenti/foto-griglia.mjs <cartella> [url]   (di base il server locale: node strumenti/serve.mjs)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [cartella, url = 'http://localhost:5182/?lang=it'] = process.argv.slice(2);
if (!cartella) { console.log('Uso: node strumenti/foto-griglia.mjs <cartella> [url]'); process.exit(1); }
mkdirSync(cartella, { recursive: true });
const formati = { computer: { viewport: { width: 1440, height: 900 } }, telefono: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const browser = await chromium.launch();
try {
  for (const [nome, opzioni] of Object.entries(formati)) {
    const ctx = await browser.newContext({ ...opzioni, locale: 'it-IT' });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2500);
    const ordine = await page.$$eval('#grid > article', a => a.map(x => x.id));
    await page.locator('#grid').screenshot({ path: `${cartella}/griglia-${nome}.jpg`, type: 'jpeg', quality: 70 });
    console.log(nome, ordine.join(' → '), `${cartella}/griglia-${nome}.jpg`);
    await ctx.close();
  }
} finally { await browser.close(); }
