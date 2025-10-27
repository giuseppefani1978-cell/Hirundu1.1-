// Shim de boot pour L1 tant que le code reste à la racine de /src.
// L'import de /src/game.js démarre souvent la logique L1 (si ton code l'initialise à l'import).
import '/src/game.js';

// On exporte un boot "no-op" pour être compatible avec `mod?.boot?.()` dans index.html.
export const boot = () => {
  // Si tu dois lancer explicitement quelque chose, remplace par l'appel réel:
  // import('/src/game.js').then(m => m.startLevel1?.());
};
