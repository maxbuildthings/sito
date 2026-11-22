// Foto della prova delle cornici (strumenti/prova-cornici.mjs) in WebKit, come il browser di MAX·OS sul Mac, o in Chromium.
// Uso: node strumenti/foto-cornici.mjs [webkit|chromium] [0|b|g]  → /tmp/pv-<motore>-<versione>-{alto,griglia,fondo,dettaglio,tel}.jpg (serve node strumenti/serve.mjs acceso)
import { createRequire } from 'node:module';
const require = createRequire('/Users/max/Desktop/Progetti/MAXBUILD/strumenti/');
const pw = require('playwright');
const [motore='webkit', v='g'] = process.argv.slice(2);
const b = await pw[motore].launch();
async function apri(viewport, mobile, dpr=1){
  const ctx = await b.newContext({ viewport, deviceScaleFactor:dpr, isMobile: motore!=='firefox' && mobile, hasTouch:mobile, locale:'it-IT' });
  await ctx.addInitScript(()=>{ sessionStorage.setItem('booted','1'); sessionStorage.setItem('dlg','1'); });
  const p = await ctx.newPage(); const err=[]; p.on('pageerror',e=>err.push(e.message));
  await p.goto('http://localhost:5182/prova-cornici.html',{waitUntil:'load'}); await p.waitForTimeout(1500);
  await p.keyboard.press({b:'1',g:'2','0':'0'}[v]); await p.waitForTimeout(300);
  return {ctx,p,err};
}
const scorri = (p,s,d)=>p.evaluate(([s,d])=>{const e=document.querySelector(s); scrollTo(0,e.getBoundingClientRect().top+scrollY-d);},[s,d]);
{ const {ctx,p,err}=await apri({width:1440,height:900},false);
  console.log('font VT323:', await p.evaluate(()=>document.fonts.check('20px VT323')), '| errori:', err.length?err:'nessuno');
  await p.screenshot({path:`/tmp/pv-${motore}-${v}-alto.jpg`,type:'jpeg',quality:70});
  await scorri(p,'.toolbar',20); await p.waitForTimeout(500); await p.mouse.move(250,330); await p.waitForTimeout(700);
  await p.screenshot({path:`/tmp/pv-${motore}-${v}-griglia.jpg`,type:'jpeg',quality:70});
  await scorri(p,'#contatti',60); await p.waitForTimeout(500);
  await p.screenshot({path:`/tmp/pv-${motore}-${v}-fondo.jpg`,type:'jpeg',quality:70}); await ctx.close(); }
{ const {ctx,p}=await apri({width:1440,height:900},false,2);
  await scorri(p,'#lamora',30); await p.waitForTimeout(500); const r=await (await p.$('#lamora')).boundingBox();
  await p.mouse.move(r.x+r.width*.7,r.y+60); await p.waitForTimeout(700);
  await p.screenshot({path:`/tmp/pv-${motore}-${v}-dettaglio.jpg`,type:'jpeg',quality:75,clip:{x:r.x-30,y:r.y-30,width:r.width+60,height:Math.min(r.height+60,900-r.y+30)}}); await ctx.close(); }
{ const {ctx,p}=await apri({width:390,height:844},true,2);
  await scorri(p,'#pibreria',16); await p.waitForTimeout(500); await p.screenshot({path:`/tmp/pv-${motore}-${v}-tel.jpg`,type:'jpeg',quality:65}); await ctx.close(); }
await b.close(); console.log('ok');
