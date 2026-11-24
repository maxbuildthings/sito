// Foto del profilo in più stili, per sceglierne uno: ogni stile è una pagina 1080×1080 fotografata.
// Instagram e GitHub tagliano a cerchio: tutto quello che conta sta nel cerchio centrale.
// Uso: node strumenti/logo-stili.mjs <cartella-uscita> [stile...]   (senza stili: tutti)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cartella, ...scelti] = process.argv.slice(2);
if (!cartella) { console.error('Uso: node strumenti/logo-stili.mjs <cartella-uscita> [stile...]'); process.exit(1); }
// caratteri incorporati: letti da file:// in una pagina fatta con setContent non sempre arrivano
const f = n => `data:font/woff2;base64,${readFileSync(path.join(radice, 'fonts', n)).toString('base64')}`;
const base = `
@font-face{font-family:P;font-style:italic;font-weight:800;src:url(${f('playfair-display-800i-latin.woff2')}) format("woff2")}
@font-face{font-family:V;src:url(${f('vt323-latin.woff2')}) format("woff2")}
html,body{margin:0;width:1080px;height:1080px;overflow:hidden}
body{display:grid;place-items:center;position:relative}`;

// colori del sito
const ROSA = '#ff5fc1', CIANO = '#45f0ff', NOTTE = '#140536';
// il cursore a freccia di Windows, pixel per pixel (N nero, B bianco)
const FRECCIA = ['N', 'NN', 'NBN', 'NBBN', 'NBBBN', 'NBBBBN', 'NBBBBBN', 'NBBBBBBN', 'NBBBBBBBN', 'NBBBBBBBBN', 'NBBBBBBBBBN',
  'NBBBBBBNNNNN', 'NBBBNBBN', 'NBBN NBBN', 'NBN  NBBN', 'NN    NBBN', 'N     NBBN', '       NBBN', '       NBBN', '        NN'];
const freccia = FRECCIA.flatMap((r, y) => [...r].map((c, x) => c === ' ' ? '' : `<rect x="${x}" y="${y}" width="1" height="1" fill="${c === 'N' ? '#000' : '#fff'}"/>`)).join('');
const righe = `body::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 3px,transparent 3px 8px);pointer-events:none}`;

// --- pezzi per le varianti del sole ---
const svg = (corpo, defs = '', vb = '0 0 1080 1080') => `<svg viewBox="${vb}" style="position:absolute;inset:0;width:1080px;height:1080px"><defs>${defs}</defs>${corpo}</svg>`;
const SOLE = `<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".45" stop-color="#ff8fa8"/><stop offset="1" stop-color="#ff3fb4"/></linearGradient>`;
const CIELO = `<radialGradient id="cielo" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#3a0b63"/><stop offset=".55" stop-color="${NOTTE}"/><stop offset="1" stop-color="#0b0220"/></radialGradient>`;
const ALONE = `<filter id="alone" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>`;
const NEON = `<filter id="neon" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
// le bande scure del sole (come nella favicon): si allargano verso il basso
const strisce = (id, cy, r) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><rect x="-3000" y="-3000" width="6000" height="6000" fill="#fff"/>${
  [[.11, .045], [.30, .06], [.48, .075], [.65, .09], [.80, .105]].map(([t, h]) => `<rect x="-3000" y="${cy + t * r}" width="6000" height="${h * r}" fill="#000"/>`).join('')}</mask>`;
// stelle sempre nello stesso posto (numeri pseudo-casuali con un seme fisso)
const stelle = (n, seme = 7) => { let s = seme; const c = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return `<g fill="#fff">${Array.from({ length: n }, () => `<circle cx="${(c() * 1080).toFixed(0)}" cy="${(c() * 1080).toFixed(0)}" r="${(1.5 + c() * 2).toFixed(1)}" opacity="${(.4 + c() * .5).toFixed(2)}"/>`).join('')}</g>`; };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mescola = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const scala = (pal, t) => { t = Math.min(1, Math.max(0, t)); const x = t * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(x)); return mescola(pal[i], pal[i + 1], x - i); };
const IRIDE = ['#45f0ff', '#6f8cff', '#9b5cff', '#c13cf0', '#ff5fc1', '#ff8a8a', '#ffc46b', '#ffe27a'];

// Compenetrazione iridescente (Balla, 1912): triangoli allungati a zig-zag, ognuno un passo della sfumatura
const triangoli = (() => { const W = 62, H = 216; let s = '';
  for (let y = 0; y < 1080; y += H) for (let x = 0; x < 1080; x += W) {
    const giu = ((x / W) + (y / H)) % 2 === 0, t = ((x - 170) * .6 + (y - 170)) / 1180;
    const a = giu ? `${x},${y} ${x + W},${y} ${x},${y + H}` : `${x},${y} ${x + W},${y} ${x + W},${y + H}`;
    const b = giu ? `${x + W},${y} ${x + W},${y + H} ${x},${y + H}` : `${x},${y} ${x + W},${y + H} ${x},${y + H}`;
    s += `<polygon points="${a}" fill="${mescola(scala(IRIDE, t), '#ffffff', .18)}"/><polygon points="${b}" fill="${mescola(scala(IRIDE, t + .1), NOTTE, .3)}"/>`;
  } return s; })();

// Dinamismo (Balla, Boccioni): il sole ripetuto lungo la corsa, dal ciano al rosa, con le linee-forza dietro
const corsa = [[400, 650, 238, '#45f0ff', .22], [445, 605, 246, '#6f8cff', .32], [490, 560, 254, '#9b5cff', .45], [535, 515, 262, '#c13cf0', .6]];
const lineeForza = [0, 1, 2, 3, 4, 5].map(i => `<polygon points="-200,${1250 - i * 40} 1280,${-120 + i * 150} 1280,${-40 + i * 150}" fill="${i % 2 ? '#3a0ca3' : '#24085a'}" opacity=".8"/>`).join('');
const scie = [[150, 900, 520, 380], [210, 980, 600, 460], [120, 760, 430, 300], [300, 1010, 700, 520]].map(([x1, y1, x2, y2], i) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="${6 - i}" stroke-linecap="round" opacity=".35"/>`).join('');

// HUD: tacche sull'anello
const tacche = Array.from({ length: 72 }, (_, i) => { const a = i * 5 * Math.PI / 180, lungo = i % 6 === 0, r1 = 452, r2 = lungo ? 486 : 470;
  return `<line x1="${(540 + r1 * Math.cos(a)).toFixed(1)}" y1="${(540 + r1 * Math.sin(a)).toFixed(1)}" x2="${(540 + r2 * Math.cos(a)).toFixed(1)}" y2="${(540 + r2 * Math.sin(a)).toFixed(1)}" stroke="${CIANO}" stroke-width="${lungo ? 5 : 2.5}" opacity="${lungo ? .9 : .5}"/>`; }).join('');
const arco = (r, da, a, colore, w) => { const p = g => [540 + r * Math.cos(g * Math.PI / 180), 540 + r * Math.sin(g * Math.PI / 180)].map(v => v.toFixed(1)).join(' ');
  return `<path d="M${p(da)} A${r} ${r} 0 ${a - da > 180 ? 1 : 0} 1 ${p(a)}" stroke="${colore}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`; };
const profilo = readFileSync(path.join(radice, 'promo/instagram/profilo.svg'), 'utf8');
// Dinamismo, varianti (24/11): gli «echi» del sole stanno dietro, e dentro le strisce del sole si vede il cielo, non l'eco
const fuori = (id, cx, cy, r) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1080"><rect width="1080" height="1080" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/></mask>`;
const soleCorre = (cx, cy, r, id) => `<circle cx="${cx}" cy="${cy}" r="${r + 20}" fill="${ROSA}" opacity=".45" filter="url(#alone)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sg)" mask="url(#${id})"/>`;
// Balla, «Velocità astratta»: i soli crescono lungo la curva, trasparenti uno nell'altro, e le linee-forza a cuneo partono dall'angolo
const crescono = [[250, 820, 110, '#45f0ff'], [322, 718, 150, '#6f8cff'], [410, 622, 192, '#9b5cff'], [510, 532, 236, '#c13cf0']];
const cunei = [-62, -55, -48, -41, -34, -27].map((g, i) => { const p = a => `${(-150 + 2200 * Math.cos(a * Math.PI / 180)).toFixed(0)},${(1250 + 2200 * Math.sin(a * Math.PI / 180)).toFixed(0)}`;
  return `<polygon points="-150,1250 ${p(g)} ${p(g + 3.2)}" fill="${['#2a0a6b', '#3a0ca3', '#5a1aa0'][i % 3]}" opacity=".75"/>`; }).join('');

const STILI = {
  // la finestra Windows 98 del sito, con la M dentro
  finestra: `<style>${base}
body{background:linear-gradient(160deg,#3a0ca3 0%,${NOTTE} 70%)}
.w{width:740px;background:#c0c0c0;padding:8px;box-shadow:inset 6px 6px 0 #fff,inset -6px -6px 0 #404040,40px 40px 0 rgba(0,0,0,.35);transform:translateY(-10px)}
.t{height:96px;background:linear-gradient(90deg,#000080,#1084d0);display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:0 14px}
.b{width:58px;height:50px;background:#c0c0c0;box-shadow:inset 4px 4px 0 #fff,inset -4px -4px 0 #404040;font:700 40px/50px V;text-align:center;color:#000}
.c{height:500px;background:${NOTTE};margin-top:8px;display:grid;place-items:center;box-shadow:inset 6px 6px 0 #404040,inset -6px -6px 0 #fff}
.c span{font:italic 800 470px/1 P;color:${ROSA};text-shadow:14px 14px 0 ${CIANO};margin-top:-40px}
</style><div class="w"><div class="t"><div class="b">_</div><div class="b">×</div></div><div class="c"><span>M</span></div></div>`,

  // una M a pixel, come il carattere da terminale del sito
  pixel: `<style>${base}${righe}
body{background:radial-gradient(circle at 50% 45%,#2a0a5e 0%,#0b0220 75%)}
span{font:1150px/1 V;color:${ROSA};text-shadow:0 0 30px ${ROSA},0 0 90px rgba(255,95,193,.6),22px 22px 0 #3a0ca3;margin-top:-80px}
</style><span>M</span>`,

  // il cursore di Windows: «clicca, si costruisce»
  cursore: `<style>${base}
body{background:linear-gradient(150deg,${ROSA} 0%,#9b3cf0 100%)}
svg{width:${12 * 34}px;height:${20 * 34}px;transform:translate(50px,10px);filter:drop-shadow(28px 28px 0 rgba(20,5,54,.45))}
</style><svg viewBox="0 0 12 20" shape-rendering="crispEdges">${freccia}</svg>`,

  // M piatta, moderna: si legge anche piccolissima
  piatta: `<style>${base}
body{background:${ROSA}}
span{font:italic 800 640px/1 P;color:${NOTTE};margin:-90px 0 0 -40px}
span b{color:#fff;font-weight:800}
</style><span>M<b>.</b></span>`,

  // max_ da terminale
  terminale: `<style>${base}${righe}
body{background:${NOTTE}}
span{font:520px/1 V;color:#fff;text-shadow:0 0 24px rgba(69,240,255,.55);margin-top:-30px;letter-spacing:-6px}
i{font-style:normal;color:${CIANO}}
</style><span>max<i>_</i></span>`,

  // --- varianti del sole (23/11, secondo giro) ---
  // solo il sole a strisce, senza griglia: il più leggibile in piccolo (scheda del browser)
  'sole-solo': `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#cielo)"/>${stelle(16)}
     <circle cx="540" cy="540" r="390" fill="${ROSA}" opacity=".5" filter="url(#alone)"/>
     <circle cx="540" cy="540" r="365" fill="url(#sg)" mask="url(#s1)"/>`,
    SOLE + CIELO + ALONE + strisce('s1', 540, 365)),

  // <☀/>: il sole dentro un tag, da sviluppatore
  tag: `<style>${base}${righe}
body{background:radial-gradient(circle at 50% 50%,#2a0a5e 0%,#0b0220 75%)}
.t{display:flex;align-items:center;font:470px/1 V;color:${CIANO};text-shadow:0 0 26px rgba(69,240,255,.75),0 0 70px rgba(69,240,255,.35)}
.t svg{width:330px;height:330px;margin:0 4px;filter:drop-shadow(0 0 30px rgba(255,95,193,.6))}
</style><div class="t"><span>&lt;</span><svg viewBox="0 0 300 300"><defs>${SOLE}${strisce('s2', 150, 145)}</defs><circle cx="150" cy="150" r="145" fill="url(#sg)" mask="url(#s2)"/></svg><span>/&gt;</span></div>`,

  // la finestra Windows 98 del sito, col tramonto dentro
  'finestra-sole': `<style>${base}
body{background:linear-gradient(160deg,#3a0ca3 0%,${NOTTE} 70%)}
.w{width:760px;background:#c0c0c0;padding:8px;box-shadow:inset 6px 6px 0 #fff,inset -6px -6px 0 #404040,40px 40px 0 rgba(0,0,0,.35);transform:translateY(-10px)}
.t{height:90px;background:linear-gradient(90deg,#000080,#1084d0);display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:0 14px}
.b{width:58px;height:50px;background:#c0c0c0;box-shadow:inset 4px 4px 0 #fff,inset -4px -4px 0 #404040;font:700 40px/50px V;text-align:center;color:#000}
.c{height:520px;margin-top:8px;overflow:hidden;box-shadow:inset 6px 6px 0 #404040,inset -6px -6px 0 #fff;position:relative}
.c svg{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px)}
</style><div class="w"><div class="t"><div class="b">_</div><div class="b">×</div></div><div class="c">${profilo.replace(/<svg [^>]*>/, '<svg viewBox="0 160 1080 700" preserveAspectRatio="xMidYMid slice">')}</div></div>`,

  // --- con un tocco di futurismo ---
  // Futurismo italiano: la «Compenetrazione iridescente» di Balla dentro il sole a strisce
  compenetrazione: `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#cielo)"/>${stelle(12, 3)}
     <circle cx="540" cy="540" r="400" fill="#9b5cff" opacity=".45" filter="url(#alone)"/>
     <g clip-path="url(#disco)" mask="url(#s3)">${triangoli}</g>
     <circle cx="540" cy="540" r="370" fill="none" stroke="#fff" stroke-width="3" opacity=".25" mask="url(#s3)"/>`,
    CIELO + ALONE + strisce('s3', 540, 370) + `<clipPath id="disco"><circle cx="540" cy="540" r="370"/></clipPath>`),

  // Futurismo italiano: il sole che corre, ripetuto come nei quadri di Balla, con le linee-forza
  dinamismo: `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="${NOTTE}"/>${lineeForza}${scie}
     ${corsa.map(([cx, cy, r, c, o], i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${o}" mask="url(#c${i})"/>`).join('')}
     <circle cx="580" cy="470" r="270" fill="${ROSA}" opacity=".5" filter="url(#alone)"/>
     <circle cx="580" cy="470" r="270" fill="url(#sg)" mask="url(#c9)"/>`,
    SOLE + ALONE + corsa.map(([, cy, r], i) => strisce('c' + i, cy, r)).join('') + strisce('c9', 470, 270)),

  // Dinamismo più pulito: niente fasce e niente scie, solo tre echi pieni dietro il sole, dal buio al viola
  'dinamismo-pulito': `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#cielo)"/>${stelle(14, 5)}
     <g mask="url(#fp)">${[[400, 670, '#2a1470'], [470, 600, '#5b2bbf'], [540, 530, '#a83ad8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="260" fill="${c}"/>`).join('')}</g>
     ${soleCorre(610, 460, 260, 'd1')}`,
    SOLE + CIELO + ALONE + strisce('d1', 460, 260) + fuori('fp', 610, 460, 260)),

  // Dinamismo che sorge: il sole sale dritto, gli echi restano sotto a spicchi (ciano in fondo); centrato, regge il cerchio
  'dinamismo-sorge': `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#cielo)"/>${stelle(14, 9)}
     <g mask="url(#fs)">${[[640, CIANO], [565, '#6f5cff'], [492, '#c13cf0']].map(([y, c]) => `<circle cx="540" cy="${y}" r="290" fill="${c}"/>`).join('')}</g>
     ${soleCorre(540, 420, 290, 'd2')}`,
    SOLE + CIELO + ALONE + strisce('d2', 420, 290) + fuori('fs', 540, 420, 290)),

  // Dinamismo al neon: gli echi sono anelli luminosi, dal rosa al ciano, sempre più deboli
  'dinamismo-neon': `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#cielo)"/>${stelle(14, 13)}
     <g mask="url(#fn)" fill="none" filter="url(#neon)">${[[390, 680, CIANO, .4], [460, 610, '#9b5cff', .65], [530, 540, ROSA, .9]].map(([x, y, c, o]) => `<circle cx="${x}" cy="${y}" r="260" stroke="${c}" stroke-width="9" opacity="${o}"/>`).join('')}</g>
     ${soleCorre(605, 465, 260, 'd3')}`,
    SOLE + CIELO + ALONE + NEON + strisce('d3', 465, 260) + fuori('fn', 605, 465, 260)),

  // Dinamismo più Balla: i soli crescono lungo la curva, trasparenti uno nell'altro, coi cunei delle linee-forza
  'dinamismo-balla': `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="${NOTTE}"/>${cunei}
     ${[0, 1, 2].map(i => `<path d="M${120 + i * 60} ${960 - i * 10} Q ${300 + i * 40} ${560 - i * 30} ${720 + i * 20} ${300 - i * 40}" stroke="#fff" stroke-width="${5 - i}" fill="none" stroke-linecap="round" opacity=".3"/>`).join('')}
     <g style="mix-blend-mode:screen">${crescono.map(([x, y, r, c], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".55" mask="url(#b${i})"/>`).join('')}</g>
     ${soleCorre(620, 450, 280, 'd4')}`,
    SOLE + ALONE + crescono.map(([, y, r], i) => strisce('b' + i, y, r)).join('') + strisce('d4', 450, 280)),

  // Fantascienza anni '80: il sole diventato una sfera cromata che riflette il tramonto e la griglia
  cromo: `<style>${base}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#cielo)"/>${stelle(18, 11)}
     <circle cx="540" cy="540" r="410" fill="${ROSA}" opacity=".35" filter="url(#alone)"/>
     <circle cx="540" cy="540" r="380" fill="url(#cromo)"/>
     <g clip-path="url(#palla)">
       <path d="M420 540 A120 120 0 0 1 660 540Z" fill="url(#sg)" mask="url(#s4)" opacity=".95"/>
       <g stroke="${CIANO}" fill="none" filter="url(#neon)" opacity=".85">
         ${[6, 14, 25, 38, 54, 72].map((g, i) => `<line x1="100" x2="980" y1="${(540 + 380 * Math.sin(g * Math.PI / 180)).toFixed(0)}" y2="${(540 + 380 * Math.sin(g * Math.PI / 180)).toFixed(0)}" stroke-width="${3 + i}"/>`).join('')}
         ${[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(k => `<line x1="${540 + k * 28}" y1="542" x2="${540 + k * 230}" y2="1000" stroke-width="4"/>`).join('')}
       </g>
       <rect x="100" y="537" width="880" height="5" fill="#fff"/>
     </g>
     <circle cx="540" cy="540" r="380" fill="url(#ombra)"/>
     <ellipse cx="420" cy="360" rx="150" ry="95" fill="url(#luce)" transform="rotate(-35 420 360)"/>
     <circle cx="540" cy="540" r="379" fill="none" stroke="#fff" stroke-width="3" opacity=".4"/>
     <path d="M820 230 l10 -40 l10 40 l40 10 l-40 10 l-10 40 l-10 -40 l-40 -10z" fill="#fff" opacity=".9"/>`,
    SOLE + CIELO + ALONE + NEON + strisce('s4', 540 - 120, 120) +
    `<clipPath id="palla"><circle cx="540" cy="540" r="380"/></clipPath>
     <linearGradient id="cromo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0330"/><stop offset=".22" stop-color="#3d1a8f"/><stop offset=".42" stop-color="#c58cff"/><stop offset=".49" stop-color="#ffe0f4"/><stop offset=".5" stop-color="#fff"/><stop offset=".505" stop-color="#1a0533"/><stop offset=".6" stop-color="#2c0b5e"/><stop offset=".8" stop-color="#7a2fc0"/><stop offset=".93" stop-color="${ROSA}"/><stop offset="1" stop-color="#ffd1ec"/></linearGradient>
     <radialGradient id="ombra" cx=".5" cy=".5" r=".5"><stop offset=".72" stop-color="#0a001e" stop-opacity="0"/><stop offset=".94" stop-color="#0a001e" stop-opacity=".5"/><stop offset="1" stop-color="#0a001e" stop-opacity=".85"/></radialGradient>
     <radialGradient id="luce"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`),

  // Fantascienza: il sole come ologramma dentro un mirino, con le tacche e le scritte da terminale
  ologramma: `<style>${base}${righe}</style>` + svg(
    `<rect width="1080" height="1080" fill="url(#buio)"/>
     <circle cx="540" cy="540" r="505" fill="none" stroke="${CIANO}" stroke-width="2" stroke-dasharray="4 14" opacity=".45"/>
     ${tacche}
     ${arco(505, -150, -95, ROSA, 12)}${arco(505, 25, 75, ROSA, 12)}${arco(425, 160, 215, CIANO, 6)}
     <circle cx="540" cy="540" r="300" fill="url(#sg)" opacity=".28" mask="url(#s5)"/>
     <g stroke="${CIANO}" fill="none" filter="url(#neon)">
       <circle cx="540" cy="540" r="300" stroke-width="7"/>
       ${[0.35, 0.7].map(f => `<ellipse cx="540" cy="540" rx="${300 * f}" ry="300" stroke-width="3" opacity=".6"/>`).join('')}
       <line x1="540" y1="240" x2="540" y2="840" stroke-width="3" opacity=".6"/>
       ${[-.6, -.3, 0].map(t => { const y = 540 + t * 300, w = Math.sqrt(1 - t * t) * 300; return `<line x1="${(540 - w).toFixed(0)}" x2="${(540 + w).toFixed(0)}" y1="${y}" y2="${y}" stroke-width="3" opacity=".6"/>`; }).join('')}
     </g>
     <g font-family="V" font-size="54" fill="${CIANO}" opacity=".9"><text x="200" y="290">MBT/01</text><text x="660" y="850">43°N 12°E</text></g>
     <g fill="${ROSA}"><rect x="535" y="180" width="10" height="36"/><rect x="535" y="864" width="10" height="36"/><rect x="180" y="535" width="36" height="10"/><rect x="864" y="535" width="36" height="10"/></g>`,
    SOLE + NEON + strisce('s5', 540, 300) + `<radialGradient id="buio" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#170650"/><stop offset=".6" stop-color="#090224"/><stop offset="1" stop-color="#040112"/></radialGradient>`),
};

mkdirSync(cartella, { recursive: true });
const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
for (const nome of scelti.length ? scelti : Object.keys(STILI)) {
  if (!STILI[nome]) { console.error('stile sconosciuto:', nome, '— ci sono:', Object.keys(STILI).join(', ')); continue; }
  await pagina.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${STILI[nome]}</body></html>`, { waitUntil: 'load' });
  // i caratteri si caricano solo quando servono: li si chiede esplicitamente, poi si aspetta
  const ok = await pagina.evaluate(async () => { await Promise.all([document.fonts.load('italic 800 100px P'), document.fonts.load('100px V')]); await document.fonts.ready; return document.fonts.check('100px V') && document.fonts.check('italic 800 100px P'); });
  if (!ok) console.error('caratteri non caricati per', nome);
  const file = path.join(cartella, `${nome}.png`);
  await pagina.screenshot({ path: file });
  console.log('fatto:', file);
}
await browser.close();
