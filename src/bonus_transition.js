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
    '.ui-success', '.ui-overlay', '.overlay', '.modal', '.bd', '#overlay', '.dialog', '#bd', '#tarTop'
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

let __ctaAttachedForCurrentSuccess = false;

function showBonusCTA() {
  if (document.getElementById('__bonus_cta')) {
    console.log('[bonus_transition] showBonusCTA: already present');
    return;
  }

  console.log('[bonus_transition] showBonusCTA: creating CTA');
  const btn = createCTAElement();
  const parent = findBestParent() || document.body;

  setTimeout(() => {
    try {
      parent.appendChild(btn);
      __ctaAttachedForCurrentSuccess = true;
      console.log('[bonus_transition] __bonus_cta appended to', parent.tagName || parent.id || parent.className);

      // Watchdog: if removed or hidden by other scripts, re-append / force visibility
      let attempts = 0;
      const maxAttempts = 10;
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
          } catch (e) { /* ignore */ }
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

// MutationObserver : si la bulle / overlay "ui-success" apparaît (ou est rafraîchie), on attache le CTA
const successSelector = '.ui-success, .ui-overlay, .overlay, .modal, .bd';
const mo = new MutationObserver((mutations) => {
  // check présence d'un conteneur de succès
  const container = document.querySelector('.ui-success') ||
                    document.querySelector('.ui-overlay') ||
                    document.querySelector('.overlay') ||
                    document.querySelector('.modal') ||
                    document.querySelector('.bd');

  if (container) {
    console.log('[bonus_transition] MutationObserver: success container detected -> ensure CTA is inside it');

    // si le CTA existe déjà mais n'est pas dans la bulle, on le déplace
    const existing = document.getElementById('__bonus_cta');
    if (existing) {
      try {
        if (existing.parentElement !== container) {
          container.appendChild(existing);
          console.warn('[bonus_transition] moved existing __bonus_cta into the success container');
        }
        // marque que pour cette bulle on a attaché le CTA
        __ctaAttachedForCurrentSuccess = true;
      } catch (e) {
        console.error('[bonus_transition] failed to move existing __bonus_cta into container', e);
      }
      return;
    }

    // sinon on affiche/insère le CTA neuf
    showBonusCTA();
    return;
  }

  // si la bulle a été retirée, reset flag pour la suivante
  if (!document.querySelector('.ui-success')) {
    __ctaAttachedForCurrentSuccess = false;
  }
});
// observe body (ou documentElement si body pas encore présent)
mo.observe(document.body || document.documentElement, { childList: true, subtree: true });