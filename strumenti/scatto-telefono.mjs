// Foto di una pagina vista dal telefono, per le finestre col telefono disegnato (come cantkeep): 420×909 JPEG sotto i 50 KB.
// Uso: node strumenti/scatto-telefono.mjs <url> <nome> [--attesa=ms]  → screenshot/<nome>.jpg
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const radice = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), [url, nome] = args.filter(a => !a.startsWith('--'));
const attesa = Number((args.find(a => a.startsWith('--attesa=')) || '=0').split('=')[1]) || 0;
if (!url || !/^[\w.-]+$/.test(nome || '')) { console.error('Uso: node strumenti/scatto-telefono.mjs <url> <nome> [--attesa=ms]'); process.exit(1); }
const b = await chromium.launch();
try {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT' })).newPage();
  await p.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(2000 + attesa);
  const png = await p.screenshot();
  let buf, q; for (q of [82, 76, 70, 64, 58]) { buf = await sharp(png).resize(420, 909, { fit: 'fill' }).jpeg({ quality: q, mozjpeg: true }).toBuffer(); if (buf.length < 50 * 1024) break; }
  mkdirSync(join(radice, 'screenshot'), { recursive: true }); writeFileSync(join(radice, 'screenshot', nome + '.jpg'), buf);
  console.log(`screenshot/${nome}.jpg: 420×909, ${(buf.length / 1024).toFixed(1)} KB, qualità ${q}`);
} finally { await b.close(); }
