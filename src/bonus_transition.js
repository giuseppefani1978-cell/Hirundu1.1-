// src/bonus_transition.js
// Gère l’affichage du CTA “Victoire : Bonus débloqué” uniquement après la victoire,
// et jamais sur l’accueil. S’attache à l’overlay de victoire dès qu’il existe.

const CTA_ID = '__victory_bonus_btn';
const MAP_PAGE_URL = '/app.html#otranto';

export function removeVictoryCTA() {
  const btn = document.getElementById(CTA_ID);
  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
}

function buildCTA() {
  if (document.getElementById(CTA_ID)) return null;
  const btn = document.createElement('button');
  btn.id = CTA_ID;
  btn.type = 'button';
  btn.textContent = '🌟 Victoire : Bonus débloqué → Carte';
  btn.style.cssText = `
    display:block; width:100%;
    margin-top:12px;
    background:#34d399; color:#0b3c2f;
    border:0; border-radius:14px;
    padding:12px 16px;
    font:700 14px/1 system-ui;
    box-shadow:0 6px 18px rgba(0,0,0,.25);
    cursor:pointer;
  `;
  btn.addEventListener('click', () => {
    try {
      localStorage.setItem('bonus_unlocked', '1');
      localStorage.setItem('bonus_otranto_unlocked', '1');
    } catch {}
    window.location.href = MAP_PAGE_URL;
  });
  return btn;
}

async function waitForOverlayCard(timeoutMs = 4000) {
  const start = performance.now();
  return new Promise((resolve) => {
    const found = () => document.getElementById('overlayCard');
    const immediate = found();
    if (immediate) return resolve(immediate);

    const iv = setInterval(() => {
      const el = found();
      if (el) {
        clearInterval(iv);
        resolve(el);
      } else if (performance.now() - start > timeoutMs) {
        clearInterval(iv);
        resolve(null);
      }
    }, 80);
  });
}

async function attachCTAIntoVictoryOverlay() {
  // Ne JAMAIS afficher sur l’accueil
  const isHome = window.location.pathname.endsWith('/') ||
                 window.location.pathname.endsWith('/index.html') ||
                 window.location.pathname === '/index.html';
  if (isHome) return;

  const overlayCard = await waitForOverlayCard();
  if (!overlayCard) return; // overlay pas présent (pas en mode victoire)

  // Évite doublons
  if (overlayCard.querySelector(`#${CTA_ID}`)) return;

  const cta = buildCTA();
  if (!cta) return;

  // On l’insère à la fin de la carte de victoire
  overlayCard.appendChild(cta);
}

// À appeler au boot pour brancher les listeners
export function setupVictoryCTAHandlers() {
  // Nettoyage de tout résidu (refresh)
  removeVictoryCTA();

  // Quand le jeu signale qu’Otranto est débloqué, on injecte le CTA dans l’overlay
  window.addEventListener('otranto:unlocked', () => {
    attachCTAIntoVictoryOverlay();
  });

  // Si jamais l’overlay arrive un poil après l’évènement, on retente un peu plus tard
  window.addEventListener('hashchange', () => {
    // Si on est encore sur l’écran de victoire (overlay visible), on (ré)essaie.
    const hasOverlay = !!document.getElementById('overlayCard');
    if (hasOverlay) attachCTAIntoVictoryOverlay();
  });
}
