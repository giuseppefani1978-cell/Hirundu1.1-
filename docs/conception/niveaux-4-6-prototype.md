# Niveaux 4–6 — premier prototype jouable

Cette implémentation remplace les propositions de POI des niveaux 4–6 du document initial niveaux-4-10. Les niveaux 7–10 restent hors implémentation.

Le contenu utilisé est `src/levels/regions.ts` : trente lieux réels, dix communes distinctes par niveau, énigmes et interface en français, italien, anglais et espagnol. Les noms propres sont conservés.

- 4, Adriatique : Vernole, Melendugno, Otranto, Giurdignano, Uggiano la Chiesa, Minervino di Lecce, Santa Cesarea Terme, Castro, Ortelle, Poggiardo. Collection : coquillages. Boss : Nacra.
- 5, Cap de Leuca : Castrignano del Capo, Gagliano del Capo, Patù, Morciano di Leuca, Salve, Alessano, Tricase, Tiggiano, Corsano, Ugento. Collection : gouttes. Boss : Scirocco.
- 6, Arneo : Nardò, Porto Cesareo, Copertino, Leverano, Veglie, Guagnano, Salice Salentino, Campi Salentina, Novoli, Trepuzzi. Collection : pins. Boss : Resino.

## Portée de cette première version

La chasse utilise dix cases séparées et des énigmes séquentielles, puis une bataille à trois couloirs avec esquive et fenêtre de tir. Ce n'est pas encore le déplacement libre des niveaux 1–3. Les cartes illustrées finales, ennemis de chasse et sprites animés restent à développer. Les boss sont des silhouettes SVG provisoires. Les sorties vers la carte réelle sont des recherches OpenStreetMap, sans prétendre à une position GPS précise.

La progression est sauvegardée localement ; la défaite relance la même bataille. Les niveaux se déverrouillent après la victoire précédente. Les raccourcis temporaires permettent chasse, bataille et simulation de victoire. La simulation modifie la progression locale. Les niveaux 1–3 conservent leur moteur.

## Validation

Onze tests automatisés passent : contenu multilingue, dix communes par région, progression sur six niveaux, remise à zéro et régressions des trois premiers niveaux. Vérification TypeScript et compilation réussies. Les contrôles dans Chrome distant ne remplacent pas la validation du son et du toucher sur iPhone.
