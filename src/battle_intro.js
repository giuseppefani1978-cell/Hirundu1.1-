// src/battle_intro.js
// Écran d’intro pour le mini-jeu "Bataille de Otranto"
// API attendue par game.js : startBattleIntro({ ammo, onProceed })
//
// ammo = { pasticciottos?, rustico?, caffe?, stars? } — tous optionnels
// onProceed = () => {} — appelé quand on quitte l’intro

export function startBattleIntro({ ammo = {}, onProceed } = {}) {
  const {
    pasticciotto = 0,
    rustico = 0,
    caffe = 0,
    stars = 0,
  } = ammo;

  // Création overlay
  const overlay = document.createElement('div');
  overlay.id = '__battle_intro__';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // Styles de base
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:10005;
    display:flex; align-items:center; justify-content:center;
    background: radial-gradient(1200px 800px at 50% 30%, #1b1b1b 0%, #0d0d0f 60%, #000 100%);
    color:#fff; text-align:center;
    overflow:hidden;
    animation: __bi_fadeIn 300ms ease-out forwards;
  `;

  // Conteneur carte
  const card = document.createElement('div');
  card.style.cssText = `
    width:min(720px, 92vw);
    border-radius:20px;
    padding:20px 18px 16px;
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
    border:1px solid rgba(255,255,255,0.12);
    backdrop-filter: saturate(140%) blur(6px);
    box-shadow: 0 30px 60px rgba(0,0,0,.45);
  `;

  // Titre
  const h = document.createElement('h2');
  h.textContent = '⚔️ Bataille de Otranto';
  h.style.cssText = `
    margin:0 0 10px 0; font:700 28px/1.2 system-ui;
    letter-spacing:.2px;
  `;

  // Sous-titre (orientation paysage)
  const hint = document.createElement('div');
  hint.innerHTML = `
    <div style="opacity:.9;font:600 14px system-ui;margin-bottom:12px">
      Astuce&nbsp;: <b>passe ton téléphone en mode paysage</b> pour jouer plus confort.
    </div>
  `;

  // Munitions
  const ammoBox = document.createElement('div');
  ammoBox.style.cssText = `
    display:flex; justify-content:center; gap:10px; flex-wrap:wrap;
    margin:10px 0 6px 0; font:600 13px system-ui;
  `;
  const chip = (label, n) => {
    const d = document.createElement('div');
    d.textContent = `${label}: ${n|0}`;
    d.style.cssText = `
      padding:8px 12px; border-radius:999px;
      background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
    `;
    return d;
  };
  ammoBox.appendChild(chip('⭐ Étoiles', stars));
  ammoBox.appendChild(chip('🍩 Pasticciotto', pasticciotto));
  ammoBox.appendChild(chip('🥟 Rustico', rustico));
  ammoBox.appendChild(chip('☕ Caffè', caffe));

  // CTA
  const cta = document.createElement('button');
  cta.type = 'button';
  cta.textContent = 'Commencer';
  cta.disabled = true;
  cta.style.cssText = `
    margin-top:12px; padding:12px 16px; border-radius:12px; border:0;
    font:700 16px system-ui; background:#ffd166; color:#4a2a00;
    box-shadow:0 6px 20px rgba(0,0,0,.25); cursor:not-allowed; opacity:.7;
  `;

  // Tipp “tap” (affiché après déblocage)
  const tap = document.createElement('div');
  tap.textContent = '…ou tape n’importe où pour continuer';
  tap.style.cssText = `
    margin-top:8px; font:600 12px system-ui; opacity:0;
    transition:opacity .25s ease;
  `;

  // Credo
  const foot = document.createElement('div');
  foot.innerHTML = `
    <div style="margin-top:12px; font:600 12px/1.3 system-ui; opacity:.7">
      Prépare-toi&nbsp;: Aracne vs. Monstres méduses<br>
      (les commandes apparaîtront en mode paysage)
    </div>
  `;

  // Assemble
  card.appendChild(h);
  card.appendChild(hint);
  card.appendChild(ammoBox);
  card.appendChild(cta);
  card.appendChild(tap);
  card.appendChild(foot);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Empêche le scroll en arrière-plan
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // Keyframes minimalistes
  injectOnceCss(`
    @keyframes __bi_fadeIn { from{opacity:0} to{opacity:1} }
  `);

  // Débloque le CTA après 1.2s (laisser respirer la transition)
  let canProceed = false;
  const unlockDelay = setTimeout(() => {
    canProceed = true;
    cta.disabled = false;
    cta.style.cursor = 'pointer';
    cta.style.opacity = '1';
    tap.style.opacity = '.85';
  }, 1200);

  // Auto-continue après 4s si l’utilisateur ne fait rien
  const autoTimer = setTimeout(continueNow, 4000);

  // Écoutes
  cta.addEventListener('click', () => { if (canProceed) continueNow(); });
  overlay.addEventListener('click', () => { if (canProceed) continueNow(); });
  window.addEventListener('keydown', onKey);

  function onKey(e){
    if (!canProceed) return;
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      continueNow();
    }
  }

  function continueNow(){
    cleanup();
    onProceed && onProceed();
  }

  function cleanup(){
    clearTimeout(unlockDelay);
    clearTimeout(autoTimer);
    window.removeEventListener('keydown', onKey);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.body.style.overflow = prevOverflow;
  }
}

// Injecte du CSS une seule fois (évite doublons si on revient)
function injectOnceCss(css){
  const id = '__battle_intro_css__';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
