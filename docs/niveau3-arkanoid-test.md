# Niveau 3 — version de comparaison

Sauvegarde intégrale avant modification : `backup/avant-niveau3-arkanoid-2026-09-17`, commit `0148172fa2d7abb96295fdedc34cfa49faeb071b`.

Branche de test : `test/niveau3-arkanoid-2026-09-17`.

Le niveau 3 appelle le prototype validé dans Work (version 13, source `fbe3300d0947f84530b0bc868f2bfd516f48176a`). La chasse Arkanoid, les bonus/pouvoirs, la transition paysage et la bataille avec vol/plongée/esquive sont repris. Le document isolé protège les styles et événements des autres niveaux. Les assets proviennent du dossier existant `public/assets`. Le moteur classique reste utilisé par les niveaux régionaux 4–9.

La victoire en partie complète enregistre le score, valide le niveau 3 et débloque Lecce. L’écran final propose Mes découvertes et Niveau suivant. Ce dernier déclenche la navigation existante vers le niveau 4. Le raccourci `?test=battle` est un entraînement : il ne débloque pas la progression. Les messages entre le niveau et le jeu vérifient la fenêtre émettrice, l’origine et les données attendues. Quitter le niveau détruit le document et ses boucles.

## Liens après publication GitHub Pages

- Jeu actuel : https://giuseppefani1978-cell.github.io/Hirundu1.1-/
- Jeu de test : https://giuseppefani1978-cell.github.io/Hirundu1.1-/test-niveau3/
- Nouveau niveau 3 : https://giuseppefani1978-cell.github.io/Hirundu1.1-/test-niveau3/#/level/3
- Bataille directe : https://giuseppefani1978-cell.github.io/Hirundu1.1-/test-niveau3/#/level/3?test=battle

Le workflow `Pages • Level 3 comparison` construit `main` à la racine habituelle et cette branche dans `/test-niveau3/`. Les deux variantes partagent le stockage du navigateur comme le jeu actuel. Une publication ultérieure du workflow habituel de main peut enlever le sous-dossier de test ; relancer le workflow de comparaison sur cette branche pour le rétablir.

## Vérification

`npm test` couvre les 9 niveaux, les 4 langues, la progression, les bonus et la validation des messages du nouveau niveau. `npm run typecheck` et `npm run build -- --base=/Hirundu1.1-/test-niveau3/` vérifient l’intégration et les chemins de publication. Le ressenti tactile sur téléphone reste une validation manuelle.
