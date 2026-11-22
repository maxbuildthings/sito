(function(){ if(!matchMedia('(pointer:fine)').matches) return; var wins=[].slice.call(document.querySelectorAll('.grid .win')), raf=0, x=0, y=0;
  document.addEventListener('pointermove',function(e){ x=e.clientX; y=e.clientY; if(raf) return; raf=requestAnimationFrame(function(){ raf=0;
    wins.forEach(function(w){ if(w.hidden) return; var r=w.getBoundingClientRect(); if(y<r.top-300||y>r.bottom+300) return; w.style.setProperty('--mx',(x-r.left)+'px'); w.style.setProperty('--my',(y-r.top)+'px'); }); }); },{passive:true}); })();
