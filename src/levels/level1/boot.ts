// src/levels/level1/boot.ts
// Routeur ultra-simple pour démarrer le bon niveau selon ?level=.
// Aucune importation en haut de fichier ! Tout est dynamique.

function getNextUnfinishedLevel(): number {
  try {
    const l2 = localStorage.getItem('level2_unlocked') === 'true';
    const l3 = localStorage.getItem('level3_unlocked') === 'true';
    if (!l2) return 2;   // L1 fait -> jouer L2
    if (!l3) return 3;   // L2 fait -> jouer L3
    return 3;            // tout débloqué -> par défaut L3
  } catch {
    return 1;
  }
}

async function boot() {
  const p = new URLSearchParams(location.search).get('level');
  const lvlParam = Number(p);
  const level = Number.isFinite(lvlParam) && lvlParam > 0 ? lvlParam : getNextUnfinishedLevel();

  switch (level) {
    case 3: {
      // L3 expose startLevel3 dans certains builds legacy, sinon boot/start
      const mod = await import('../level3/level3_game.js');
      const moduleApi = mod as Record<string, unknown>;
      const maybeStartLevel3 = moduleApi.startLevel3;
      if (typeof maybeStartLevel3 === 'function') {
        (maybeStartLevel3 as () => void)();
        break;
      }
      const maybeBoot = moduleApi.boot;
      if (typeof maybeBoot === 'function') {
        (maybeBoot as () => void)();
        break;
      }
      const maybeStart = moduleApi.start;
      if (typeof maybeStart === 'function') {
        (maybeStart as () => void)();
      }
      break;
    }
    case 2: {
      // L2 s’initialise à l’import (pas de startLevel2)
      await import('../level2/level2_game.js');
      break;
    }
    case 1:
    default: {
      // L1 (legacy) démarre à l’import de /src/game.js
      // @ts-ignore – module JS sans types, ok à l’exécution avec Vite
      await import('/src/game.js');
      break;
    }
  }
}

export { boot };
boot();
