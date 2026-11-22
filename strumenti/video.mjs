// Registra i video da postare (senza audio: la musica si aggiunge dall'app del social). Escono in promo/.
// Uso (dalla cartella del progetto): node strumenti/video.mjs [url]   (predefinito il sito online, in italiano)
//
// Due video di circa 20 secondi, sul sito com'è dopo l'asciugatura del 9/11/2026:
//   video-orizzontale.mp4  1280×720   (LinkedIn, YouTube)
//   video-verticale.mp4     720×1280  (Stato di WhatsApp, Storie, TikTok): layout da telefono (360 px) a doppia densità
// Percorso: la scena 3D dell'hero → la griglia dei progetti (sul desktop una finestra trascinata) → la sezione Prodotti.
// Il Chromium di prova usa la GPU del Mac (Metal): in software la scena 3D si ferma da sola o scatta (?gl=forza la obbliga a girare).
// Se il browser di prova manca (cartella ~/Library/Caches/ms-playwright sparita): cd strumenti && npx playwright install chromium
// In /tmp/<nome>-foglio.jpg resta un foglio con un fotogramma ogni 2 secondi, per controllare a occhio.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const url = process.argv[2] || 'https://maxbuildthings.vercel.app/?lang=it&gl=forza';
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const aspetta = ms => new Promise(r => setTimeout(r, ms));

// size = misura del file (e della finestra del browser di prova); telefono = layout da 360 px a doppia scala dentro 720×1280.
// La registrazione parte solo a pagina pronta (page.screencast): con recordVideo i primi secondi uscivano rimpiccioliti
// in un angolo e, sul telefono, tutto il video restava a un quarto del quadro con il resto grigio.
async function registra(nome, size, telefono) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1, isMobile: telefono, hasTouch: telefono });
  const page = await ctx.newPage();
  if (telefono) {
    // il browser di prova non registra a densità doppia: la pagina si disegna larga 360 px ma ingrandita 2× (meta viewport
    // riscritta solo qui, sul sito non cambia niente), così il quadro è pieno e nitido
    await page.route(u => u.pathname === '/', async route => {
      const r = await route.fetch();
      await route.fulfill({ response: r, body: (await r.text()).replace(/content="width=device-width[^"]*"/, 'content="width=360, initial-scale=2, minimum-scale=2, maximum-scale=2"') });
    });
  }
  await page.goto(url, { waitUntil: 'load' });
  await aspetta(3000);                                     // la scena 3D parte da sola dopo il caricamento: si registra quando c'è
  const sorgente = join(mkdtempSync(join(tmpdir(), 'video-')), nome + '.webm');
  await page.screencast.start({ path: sorgente, size, quality: 90 });
  const sopra = id => page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
  if (!telefono) {
    await aspetta(4000);                                   // hero con la scena 3D
    // la griglia entra: si scorre finché la barra della prima finestra è in alto (l'hero cambia altezza quando cambia il titolo)
    const primaBarra = () => page.evaluate(() => document.querySelector('#grid .win .bar').getBoundingClientRect().top);
    for (let i = 0; i < 15 && (await primaBarra()) > 160; i++) { await page.mouse.wheel(0, 130); await aspetta(420); }
    // una finestra trascinata e rimessa a posto col doppio clic, che è il bello del desktop finto: la barra della prima in vista, nella prima colonna.
    // Se non c'è nessuna barra da prendere il video non esce: così il passaggio non sparisce in silenzio (una volta era sparito).
    const b = await page.evaluate(() => { const r = [...document.querySelectorAll('#grid .win .bar')].map(e => e.getBoundingClientRect()).find(q => q.top > 10 && q.top < innerHeight - 300 && q.left < 500 && q.width > 100); return r && { x: r.x, y: r.y }; });
    if (!b) throw new Error('video.mjs: nessuna barra di finestra da trascinare in vista');
    const x0 = b.x + 60, y0 = b.y + 8;
    await page.mouse.move(x0, y0); await page.mouse.down();
    for (let i = 1; i <= 28; i++) { const t = i / 28, e = t * t * (3 - 2 * t); await page.mouse.move(x0 + 300 * e, y0 + 90 * e); await aspetta(28); }
    await page.mouse.up();
    await aspetta(1100);                                   // la finestra galleggia; al suo posto resta la scritta «finestra spostata…»
    await page.mouse.dblclick(x0 + 300, y0 + 90);          // il doppio clic sulla barra la rimette al suo posto (senza, resterebbe sopra i Prodotti)
    await aspetta(1300);
    for (let i = 0; i < 40 && (await sopra('prodotti')) > 90; i++) { await page.mouse.wheel(0, 130); await aspetta(420); } // giù fino ai Prodotti
    await aspetta(2500);
  } else {
    await aspetta(4000);                                   // hero con la scena 3D
    const cima = await page.evaluate(() => [...document.querySelectorAll('#grid .win')].map(w => Math.round(w.getBoundingClientRect().top + scrollY)));
    for (const y of cima) { await page.evaluate(v => scrollTo({ top: v - 60, behavior: 'smooth' }), y); await aspetta(1250); } // una finestra alla volta
    await page.evaluate(() => scrollTo({ top: document.getElementById('prodotti').getBoundingClientRect().top + scrollY - 20, behavior: 'smooth' }));
    await aspetta(3000);                                   // i Prodotti
  }
  await page.screencast.stop(); await ctx.close();
  // si porta la durata a 20 secondi (di solito un ritocco del 10%)
  const durata = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sorgente]));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', sorgente, '-an', '-vf', `setpts=${(20 / durata).toFixed(3)}*PTS`, '-r', '25', '-c:v', 'libx264', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `promo/${nome}.mp4`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `promo/${nome}.mp4`, '-vf', `fps=1/2,scale=${telefono ? 180 : 320}:-1,tile=5x2`, '-frames:v', '1', `/tmp/${nome}-foglio.jpg`]);
}
await registra('video-orizzontale', { width: 1280, height: 720 }, false);
await registra('video-verticale', { width: 720, height: 1280 }, true);
await browser.close();
console.log(readdirSync('promo').join(', '));
