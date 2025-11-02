const url = new URL(window.location.href);
const hashLevel = (window.location.hash === '#l2') ? '2' : null;
const paramLevel = url.searchParams.get('level');
const level = paramLevel || hashLevel || '1';

const boots = import.meta.glob('./{game.js,levels/level2/level2_game.js,levels/level3/level3_game.js}');

const BOOTS = {
  '1': boots['./game.js'],
  '2': boots['./levels/level2/level2_game.js'],
  '3': boots['./levels/level3/level3_game.js'],
};

const START = {
  '1': (m) => m.boot?.() || m.startLevel1?.() || m.start?.(),
  '2': (m) => m.startLevel2?.() || m.boot?.() || m.start?.(),
  '3': (m) => m.startLevel3?.() || m.boot?.() || m.start?.(),
};

try {
  localStorage.setItem('otranto_bonus_unlocked', 'true');
} catch {}

const fallbackLoader = boots['./game.js'];

async function bootLevel() {
  try {
    const loader = BOOTS[level] || fallbackLoader;
    const mod = await loader?.();
    const start = START[level] || START['1'];
    start?.(mod);
  } catch (e) {
    console.error('Level boot error:', e);
    try {
      const mod = await fallbackLoader?.();
      START['1']?.(mod);
    } catch (e2) {
      console.error('Fallback L1 failed:', e2);
      alert('Erreur de chargement du niveau');
    }
  }

  if (level === '2') {
    const splash = document.createElement('div');
    splash.style.cssText = `
      position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
      background:radial-gradient(ellipse at center, rgba(255,233,150,.85), rgba(255,200,80,.65));
      font:900 28px/1.1 system-ui;color:#5b3700;text-align:center`;
    splash.textContent = '✨ Transition — Niveau 2';
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 900);
  }
}

bootLevel();
