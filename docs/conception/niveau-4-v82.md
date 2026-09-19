# Niveau 4 — version 8.2

Le niveau 4 remplace sa grille provisoire par le moteur de chasse des niveaux existants : carte illustrée Salento, déplacement libre de Hirundu, énergie, corbeaux et méduses, bonus alimentaires, dix énigmes et collecte de coquillages.

Les dix lieux réels et leurs traductions restent dans `src/levels/regions.ts`. Leurs positions sur la carte illustrée sont espacées pour le jeu ; ce ne sont pas des coordonnées GPS. Les liens des découvertes servent à retrouver les lieux réels.

La bataille utilise le moteur commun avec le fond Salento, saut, déplacement, tir normal et spécial, indication paysage, défaite/reprise et victoire vers Adriatico. Nacra conserve une image SVG provisoire et utilise pour cette version le comportement de combat du moteur commun. Les niveaux 5–6 restent au stade de prototype à cases.

Validation : tests des quatre premières chasses et de leurs batailles dans les quatre langues, orientation simulée pour le niveau 4, défaite/reprise, victoire vers le bon bonus. Contrôle visuel dans Chrome distant du fond de chasse, des personnages et du lancement de bataille. La manipulation physique sur iPhone reste à confirmer par le joueur.
