// src/levels/index.js
// Routeur simple : choisit le module de niveau selon ?level=1|2|3
export async function boot() {
  const sp = new URLSearchParams(location.search);
  const lvl = Number(sp.get('level') || '1');

  try {
    if (lvl === 3) {
      const mod = await import('./level3/level3_game.js');
      mod.startLevel3?.();
      return;
    }
    if (lvl === 2) {
      const mod = await import('./level2/level2_game.js');
      mod.startLevel2?.();
      return;
    }
    // défaut : L1. Le boot L1 importe /src/game.js (comportement actuel).
    const mod = await import('./level1/boot.ts');
    mod.boot?.();
  } catch (e) {
    console.error('[levels/router] boot error', e);
  }
}

