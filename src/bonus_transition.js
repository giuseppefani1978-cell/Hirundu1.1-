// Robust bonus CTA / transition for Otranto
const LS = {
  OTRANTO_BONUS_UNLOCKED: 'otranto_bonus_unlocked',
  OTRANTO_BONUS_SEEN:     'otranto_bonus_seen',
};

function isUnlocked() {
  try {
    const v = localStorage.getItem(LS.OTRANTO_BONUS_UNLOCKED);
    return v === 'true' || (v !== null && JSON.parse(v) === true);
  } catch {
    return false;
  }
}

function openBonusMap() {
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  location.assign(`${base}app.html?embed=1#/poi/otranto/realmap`);
}

function findBestParent() {
  const selectors = [
    '.ui-overlay', '.overlay', '.modal', '.bd', '#overlay', '.ui-success', '.dialog', '#bd', '#tarTop'
  ];
  for (const s of selectors) {
    try {
      const el = document.querySelector(s);
      if (el) return el;
    } catch {}
  }
  return document.body;
}

function createCTAElement() {
  const btn = document.createElement('button');
  btn.id = '__bonus_cta';
  btn.type = 'button';
  btn.textContent = '🌟 Victoire ! Carte bonus débloquée — Ouvrir';
  btn.style.cssText = `
    position:fixed;
    left:50%;
    transform:translateX(-50%);
    bottom:86px;
    z-index:20010 !important;
    background:linear-gradient(180deg, #34d399, #10b981);
    color:white;
    border:0;
    border-radius:999px;
    padding:12px 18px;
    font:700 14px system-ui;
    box-shadow:0 8px 18px rgba(0,0,0,.2);
    pointer-events:auto;
    opacity:1;
    visibility:visible;
  `;
  btn.addEventListener('click', () => {
    try { localStorage.setItem(LS.OTRANTO_BONUS_SEEN, 'true'); } catch {}
    openBonusMap();
  });
  return btn;
}

function showBonusCTA() {
  if (document.getElementById('__bonus_cta')) {
    console.log('[bonus_transition] showBonusCTA: already present');
    return;
  }

  console.log('[bonus_transition] showBonusCTA: creating CTA');
  const btn = createCTAElement();
  const parent = findBestParent() || document.body;

  // Append after a short delay to avoid races with modals/overlays
  setTimeout(() => {
    try {
      parent.appendChild(btn);
      console.log('[bonus_transition] __bonus_cta appended to', parent.tagName || parent.id || parent.className);

      // Watchdog: if removed or hidden by other scripts, re-append / force visibility
      let attempts = 0;
      const maxAttempts = 8;
      const watchdog = setInterval(() => {
        attempts++;
        const existing = document.getElementById('__bonus_cta');
        if (!existing) {
          try {
            parent.appendChild(btn);
            console.warn('[bonus_transition] __bonus_cta missing — re-appended (attempt', attempts, ')');
          } catch (e) { console.error('[bonus_transition] re-append failed', e); }
        } else {
          try {
            const cs = window.getComputedStyle(existing);
            if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.zIndex || 0) < 10000) {
              existing.style.visibility = 'visible';
              existing.style.display = 'block';
              existing.style.zIndex = '20010';
              console.warn('[bonus_transition] __bonus_cta visibility/z-index enforced');
            }
          } catch (e) { /* ignore compute errors */ }

          const curParent = existing.parentElement;
          if (curParent !== parent) {
            try { parent.appendChild(existing); console.warn('[bonus_transition] moved __bonus_cta back to preferred parent'); } catch {}
          }
        }
        if (attempts >= maxAttempts) clearInterval(watchdog);
      }, 300);
    } catch (e) {
      console.error('[bonus_transition] append __bonus_cta failed', e);
    }
  }, 260);
}

// Si déjà débloqué au chargement, afficher CTA
if (isUnlocked()) {
  console.log('[bonus_transition] isUnlocked -> showing CTA on load');
  showBonusCTA();
}

// Écoute l'événement déclenché par game.js lors de la victoire
document.addEventListener('otranto:unlocked', () => {
  console.log('[bonus_transition] otranto:unlocked received — showing CTA');
  showBonusCTA();
});