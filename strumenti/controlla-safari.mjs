// Prova su Safari (WebKit): il sito su iPhone e su Mac. Sull'iPhone si aprono i link mandati su WhatsApp, e Chromium non è Safari.
// Uso: node strumenti/controlla-safari.mjs [url]   (predefinito il sito online)
// Controlla: nessun errore JS, cinque finestre, niente scorrimento orizzontale, le immagini dei Prodotti caricate; «_» che arrotola
// la finestra e la riapre, «×» che la chiude e il riquadro che la riapre; sul Mac anche trascinamento e doppio clic che la rimette a posto.
// Le foto restano in /tmp/safari-*.jpg. Se il browser manca: cd strumenti && npx playwright install webkit
import { webkit, devices } from 'playwright';

const base = process.argv[2] || 'https://maxbuildthings.vercel.app/';
const browser = await webkit.launch();
const aspetta = ms => new Promise(r => setTimeout(r, ms));
let problemi = 0;
const esito = (ok, testo) => { if (!ok) problemi++; console.log(ok ? '  ok ' : '  NO ', testo); };

async function prova(nome, opzioni, desktop) {
  console.log(`\n${nome}`);
  const ctx = await browser.newContext({ ...opzioni, locale: 'it-IT' });
  // in locale (http) la CSP di vercel.json ha upgrade-insecure-requests, che Safari applica anche a localhost: script e immagini
  // fallirebbero con un errore TLS. Solo in prova la si toglie (e l'HSTS con lei).
  if (new URL(base).protocol === 'http:') await ctx.route('**/*', async route => {
    const r = await route.fetch(), h = r.headers();
    if (h['content-security-policy']) h['content-security-policy'] = h['content-security-policy'].replace(/upgrade-insecure-requests;?\s*/g, '');
    delete h['strict-transport-security'];
    await route.fulfill({ response: r, headers: h });
  });
  const page = await ctx.newPage();
  const errori = [];
  page.on('console', m => { if (m.type() === 'error') errori.push(m.text()); });
  page.on('pageerror', e => errori.push(e.message));
  await page.goto(new URL('?lang=it', base).href, { waitUntil: 'load' });
  await aspetta(3000);
  const file = nome.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  await page.screenshot({ path: `/tmp/safari-${file}-1-cima.jpg`, type: 'jpeg', quality: 70 });

  const info = await page.evaluate(() => ({
    finestre: document.querySelectorAll('#grid .win').length,
    larghezza: document.documentElement.scrollWidth, finestra: innerWidth,
    schede: document.querySelectorAll('#prodotti .pcard').length,
    scena3d: !!document.querySelector('.scene.gl'),
  }));
  esito(info.finestre === 5, `cinque finestre (${info.finestre})`);
  esito(info.larghezza <= info.finestra + 1, `niente scorrimento orizzontale (pagina ${info.larghezza} px, schermo ${info.finestra} px)`);
  esito(info.schede >= 8, `Prodotti: ${info.schede} schede`);
  console.log(`  --  scena 3D ${info.scena3d ? 'accesa' : 'spenta (in prova senza schermo può restare spenta)'}`);

  // le immagini dei Prodotti si caricano tardi: si scorre fin lì e si guarda che siano arrivate
  for (let i = 0; i < info.schede; i++) {
    await page.evaluate(i => document.querySelectorAll('#prodotti .pcard')[i].scrollIntoView({ block: 'center', behavior: 'instant' }), i);
    await aspetta(250);
  }
  await aspetta(1200);
  const rotte = await page.evaluate(() => [...document.querySelectorAll('#prodotti .pcard img')].filter(i => !(i.complete && i.naturalWidth > 0)).length);
  esito(rotte === 0, `immagini dei Prodotti caricate (${rotte} mancanti)`);
  await page.screenshot({ path: `/tmp/safari-${file}-2-prodotti.jpg`, type: 'jpeg', quality: 70 });

  // porta in vista la prima finestra: la barra a 130 px dal bordo alto
  await page.evaluate(() => { const b = document.querySelector('#pibreria .bar').getBoundingClientRect(); scrollBy({ top: b.top - 130, behavior: 'instant' }); });
  await aspetta(1200);
  const stato = () => page.evaluate(() => { const w = document.getElementById('pibreria'); return { arrotolata: w.classList.contains('rolled'), chiusa: w.hidden, libera: w.classList.contains('floating') }; });

  // «_» arrotola la finestra sulla sua barra, un altro «_» la riapre; «×» la chiude e lascia un riquadro che la riapre
  const clic = (sel) => desktop ? page.click(sel) : page.tap(sel);
  await clic('#pibreria [data-act="min"]');
  await aspetta(700);
  esito((await stato()).arrotolata, '«_»: la finestra si arrotola sulla barra del titolo');
  await clic('#pibreria [data-act="min"]');
  await aspetta(700);
  esito(!(await stato()).arrotolata, 'secondo «_»: la finestra si riapre');
  await clic('#pibreria [data-act="close"]');
  await aspetta(700);
  const riquadro = await page.evaluate(() => { const p = document.querySelector('.ph.chiusa'); return p ? p.textContent.trim() : ''; });
  esito((await stato()).chiusa && !!riquadro, `«×»: la finestra si chiude e resta il riquadro «${riquadro}»`);
  await clic('.ph.chiusa');
  await aspetta(700);
  esito(!(await stato()).chiusa && !(await page.$('.ph.chiusa')), 'dal riquadro la finestra torna');

  if (desktop) {
    await page.evaluate(() => { const b = document.querySelector('#pibreria .bar').getBoundingClientRect(); scrollBy({ top: b.top - 130, behavior: 'instant' }); });
    await aspetta(800);
    const b = await page.evaluate(() => { const r = document.querySelector('#pibreria .bar').getBoundingClientRect(); return { x: r.x + 60, y: r.y + 8 }; });
    await page.mouse.move(b.x, b.y); await page.mouse.down();
    await page.mouse.move(b.x + 300, b.y + 90, { steps: 12 });
    await page.mouse.up();
    await aspetta(400);
    esito((await stato()).libera, 'trascinata: la finestra si stacca e galleggia');
    await page.screenshot({ path: `/tmp/safari-${file}-3-trascinata.jpg`, type: 'jpeg', quality: 70 });
    await page.mouse.dblclick(b.x + 300, b.y + 90);
    await aspetta(1200);
    esito(!(await stato()).libera, 'doppio clic sulla barra: torna al suo posto');
  }

  const diversi = [...new Set(errori)];
  esito(diversi.length === 0, 'nessun errore JS' + (diversi.length ? `: ${diversi.length} (${diversi.slice(0, 4).join(' | ')})` : ''));
  await ctx.close();
}

await prova('iPhone 13 (Safari)', { ...devices['iPhone 13'] }, false);
await prova('iPhone piccolo 320 px', { ...devices['iPhone 13'], viewport: { width: 320, height: 568 } }, false);
await prova('Mac (Safari) 1280x800', { viewport: { width: 1280, height: 800 } }, true);
await browser.close();
console.log(problemi ? `\n${problemi} problemi` : '\ntutto a posto');
process.exit(problemi ? 1 : 0);
