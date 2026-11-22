// La foto della finestra unica dei siti Pezzanera: in alto pezzanera.it dal computer (la parte blu), sotto i quattro marchi
// visti dal telefono. 800×774 JPEG sotto i 50 KB → screenshot/pezzanera-siti.jpg
// Uso: node strumenti/collage-pezzanera.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const radice = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARCHI = ['https://cassazen.it/', 'https://cassasicura.it/', 'https://studioperativo.it/', 'https://reteveloce.it/'];
// banner del consenso: si sceglie il rifiuto (o "solo necessari") se c'è
async function senzaBanner(p) {
  await p.evaluate(() => {
    const re = /rifiut|solo.{0,20}necessari|^\s*necessari|reject/i;
    const b = [...document.querySelectorAll('button,a,[role=button]')].find(e => re.test(e.innerText || '') && e.getBoundingClientRect().width > 0);
    if (b) b.click();
  });
  await p.waitForTimeout(700);
  // via i bottoni fissi in basso (chat di assistenza): in foto coprono la pagina
  await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' && e.getBoundingClientRect().top > innerHeight * .4) e.style.setProperty('visibility', 'hidden', 'important'); } });
}
const b = await chromium.launch();
try {
  const pc = await (await b.newContext({ viewport: { width: 1280, height: 544 }, locale: 'it-IT' })).newPage();
  await pc.goto('https://pezzanera.it/', { waitUntil: 'networkidle' }).catch(() => {});
  await pc.waitForTimeout(2200); await senzaBanner(pc);
  const alto = await sharp(await pc.screenshot()).resize(800, 340, { fit: 'cover', position: 'top' }).toBuffer();
  const tel = await b.newContext({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT' });
  const pezzi = [{ input: alto, left: 0, top: 0 }];
  for (const [i, u] of MARCHI.entries()) {
    const p = await tel.newPage(); await p.goto(u, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(2200); await senzaBanner(p);
    pezzi.push({ input: await sharp(await p.screenshot()).resize(194, 428, { fit: 'cover', position: 'top' }).toBuffer(), left: i * 202, top: 346 });
    console.log('preso', u);
  }
  const base = sharp({ create: { width: 800, height: 774, channels: 3, background: '#140536' } }).composite(pezzi);
  const raw = await base.png().toBuffer();
  let buf, q; for (q of [80, 74, 68, 62, 56, 50]) { buf = await sharp(raw).jpeg({ quality: q, mozjpeg: true }).toBuffer(); if (buf.length < 50 * 1024) break; }
  writeFileSync(join(radice, 'screenshot', 'pezzanera-siti.jpg'), buf);
  console.log(`screenshot/pezzanera-siti.jpg: 800×774, ${(buf.length / 1024).toFixed(1)} KB, qualità ${q}`);
} finally { await b.close(); }
