// Tutti i testi del sito in una lingua: testo visibile, aria-label, alt, title, meta, titolo della pagina, e i testi che il JS
// mette dopo (ingrandimento di una foto, finestra chiusa). Serve per confrontare prima/dopo una pulizia: se il file non cambia,
// niente di quello che legge un visitatore (o un motore) è cambiato.
// Uso: node strumenti/testi.mjs [it|en] [url] > uscita.txt      (url di default: http://localhost:5182/, serve node strumenti/serve.mjs)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [lingua = 'it', base = 'http://localhost:5182/'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: lingua === 'en' ? 'en-US' : 'it-IT' });
await ctx.addInitScript(() => { sessionStorage.setItem('booted', '1'); });
const p = await ctx.newPage();
await p.goto(base + '?lang=' + lingua, { waitUntil: 'load' }); await p.waitForTimeout(1200);
const leggi = () => p.evaluate(() => {
  const out = ['TITOLO ' + document.title, 'LANG ' + document.documentElement.lang];
  document.querySelectorAll('meta[name],meta[property],link[rel=canonical],link[rel=alternate]').forEach(m => out.push('META ' + (m.name || m.getAttribute('property') || m.rel + ' ' + (m.hreflang || '')) + ' = ' + (m.content || m.href)));
  out.push(document.body.innerText);
  document.querySelectorAll('[aria-label],[alt],[title],[placeholder]').forEach(el => ['aria-label', 'alt', 'title', 'placeholder'].forEach(a => { const v = el.getAttribute(a); if (v) out.push('ATTR ' + a + ' = ' + v); }));
  return out.join('\n');
});
console.log(await leggi());
const shot = await p.$('.shot'); if (shot) { await shot.click(); await p.waitForTimeout(500); console.log('--- ingrandimento\n' + await leggi()); await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
const chiudi = await p.$('.win [data-act="close"]'); if (chiudi) { await chiudi.click(); await p.waitForTimeout(600); console.log('--- finestra chiusa\n' + await leggi()); }
await b.close();
