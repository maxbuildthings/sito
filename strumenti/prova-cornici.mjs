// Pagina di prova dal vivo delle cornici: il sito vero con le proposte di strumenti/cornici, si cambia con un tasto (0 adesso, 1 B com'era, 2 B grigia, 3 adesso + vetro, L luce).
// Uso: node strumenti/prova-cornici.mjs → prova-cornici.html nella radice (in .gitignore), da aprire su localhost:5182 in una scheda nuova.
import { readFileSync, writeFileSync } from 'node:fs';
const R = '/Users/max/Desktop/Progetti/MAXBUILD/';
const leggi = (f) => readFileSync(R + 'strumenti/cornici/' + f, 'utf8');
let html = readFileSync(R + 'index.html', 'utf8');
const stili = `
<style id="v-b" media="not all">${leggi('b.css')}</style>
<style id="v-g" media="not all">${leggi('b-grigio.css')}</style>
<style id="v-a" media="not all">${leggi('adesso-vetro.css')}</style>
<style id="v-luce">${leggi('luce.css')}</style>
<style>
#provino{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;display:flex;gap:6px;align-items:center;
  padding:7px 8px;border-radius:14px;background:rgba(10,3,30,.92);border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.6);
  font:600 13px/1 system-ui,-apple-system,sans-serif;color:#fff}
#provino b{font-weight:600;opacity:.6;padding:0 6px 0 4px}
#provino button{font:inherit;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:9px;padding:8px 11px;cursor:pointer}
#provino button[aria-pressed=true]{background:#ff5fc1;border-color:#ff5fc1;color:#1d0631}
#provino kbd{opacity:.55;font:inherit;margin-right:5px}
</style>
</head>`;
const barra = `
<div id="provino" role="toolbar" aria-label="Prova cornici"><b>Cornici</b>
<button data-v="0"><kbd>0</kbd>Adesso</button><button data-v="a"><kbd>3</kbd>Adesso + vetro</button><button data-v="b"><kbd>1</kbd>B com'era</button><button data-v="g"><kbd>2</kbd>B grigia</button>
<button data-l><kbd>L</kbd>Luce</button></div>
<script>${leggi('luce.js')}</script>
<script>(function(){
  var vs=['b','g','a'], cur='a', luce=sessionStorage.getItem('prova-l')!=='0';
  function metti(){ vs.forEach(function(v){ document.getElementById('v-'+v).media = v===cur?'all':'not all'; });
    document.getElementById('v-luce').media = (luce && cur!=='0')?'all':'not all';
    document.querySelectorAll('#provino [data-v]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.v===cur); });
    document.querySelector('#provino [data-l]').setAttribute('aria-pressed', luce && cur!=='0');
    sessionStorage.setItem('prova-l',luce?'1':'0'); }
  document.getElementById('provino').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return;
    if(b.dataset.v) cur=b.dataset.v; else luce=!luce; metti(); });
  addEventListener('keydown',function(e){ if(e.target.closest('input,textarea')) return; var k={'0':'0','1':'b','2':'g','3':'a'}[e.key];
    if(k){ cur=k; metti(); } else if(e.key==='l'||e.key==='L'){ luce=!luce; metti(); } });
  metti(); })();</script>
</body>`;
html = html.replace('</head>', stili).replace('</body>', barra);
writeFileSync(R + 'prova-cornici.html', html);
console.log('ok', Math.round(html.length / 1024) + ' KB');
