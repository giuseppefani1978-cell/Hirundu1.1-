/* A06: decorative only. Use the existing game clock and image coordinates. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.getElementById('sceneryToggle');
  const hint = document.getElementById('sceneryHint');
  let enabled = true;
  const copy = {
    fr: ['Reflets activés', 'Reflets désactivés', 'A06 · Lance le vol, puis maintiens les flèches du pavé pour piloter. Le fond défile automatiquement. ≋ active/désactive les reflets.', 'Reflets coupés : mouvement réduit du téléphone.'],
    it: ['Riflessi attivi', 'Riflessi disattivati', 'A06 · Avvia il volo, poi tieni premute le frecce del pad. Lo sfondo scorre da solo. ≋ attiva/disattiva i riflessi.', 'Riflessi disattivati: movimento ridotto del telefono.'],
    en: ['Reflections on', 'Reflections off', 'A06 · Start the flight, then hold the pad arrows to steer. The scenery scrolls automatically. ≋ toggles reflections.', 'Reflections off: device reduced motion.'],
    es: ['Reflejos activados', 'Reflejos desactivados', 'A06 · Inicia el vuelo y mantén pulsadas las flechas. El fondo se desplaza solo. ≋ activa/desactiva los reflejos.', 'Reflejos desactivados: movimiento reducido del teléfono.'],
  };
  function update() {
    const t = copy[document.documentElement.lang] || copy.fr;
    const active = enabled && !reduced.matches;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', reduced.matches ? t[3] : t[active ? 0 : 1]);
    button.title = button.getAttribute('aria-label');
    button.textContent = active ? '≋' : '≋̸';
    button.disabled = reduced.matches;
    hint.textContent = t[2] + (reduced.matches ? ' ' + t[3] : '');
  }
  button.addEventListener('click', () => { enabled = !enabled; update(); });
  reduced.addEventListener('change', update);
  new MutationObserver(update).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  update();
  // Small verified open-water patches, clear of the coast and Otranto.
  const patches = [[.68,.25],[.69,.40],[.68,.58],[.69,.70],[.68,.84],[.69,.95]];
  window.HirunduScenery = {
    draw(ctx,x,y,w,h,time) {
      if (!enabled || reduced.matches) return;
      ctx.save();
      try {
        const inheritedAlpha = ctx.globalAlpha;
        ctx.strokeStyle = '#dbf6ff';
        ctx.lineWidth = Math.max(.7,w*.001);
        ctx.lineCap = 'round';
        patches.forEach(([px,py],index) => {
          const pulse = .5 + .5*Math.sin(time*.9 + index*1.7);
          for (let line=0;line<7;line++) {
            const width = w*.04 * Math.sin((line+1)*Math.PI/8);
            const cy = y+py*h+(line-3)*h*.002+Math.sin(time*.55+index)*h*.001;
            ctx.globalAlpha = inheritedAlpha*(.035+.11*pulse)*Math.sin((line+1)*Math.PI/8);
            ctx.beginPath();
            ctx.moveTo(x+px*w-width,cy);
            ctx.quadraticCurveTo(x+px*w,cy-h*.0008,x+px*w+width,cy);
            ctx.stroke();
          }
        });
      } finally { ctx.restore(); }
    },
  };
})();
