# A01 / A02 — Intégration approuvée

Branche : `work/ameliorations-finition-2026-09-21`. Aucune publication ou fusion sur main.

## Écrans fonctionnels

- `#/` : accueil approuvé, niveau et territoire de reprise réels, lancement/reprise, accès parcours, découvertes et passeport.
- `#/journey` : neuf étapes, familles 1/2/9 classique, 3/5/7 Arkanoid, 4/6/8 vol, sélection, lancement et rejeu.
- `#/?home=original` : ancien accueil conservé sans refonte, pour comparaison ou retour immédiat à l’ancienne présentation.

La reprise suit le premier niveau réellement disponible non terminé, pas le nombre de victoires. Les anciennes sauvegardes non contiguës sont supportées. Un niveau terminé reste rejouable même si son ancien drapeau de déblocage est absent. Les neuf niveaux terminés affichent le choix du rejeu. Les territoires futurs restent secrets dans la fiche et ses libellés accessibles.

Les récompenses suivent `unlockedKeys` ; aucun gain n’est créé par la consultation du parcours. Aucune visite réelle n’est attribuée. Les actions empruntent les routes existantes, avec les redirections existantes des niveaux de vol. Aucun reset de progression n’est introduit. Les deux écrans utilisent les quatre langues et le sélecteur existant.

## Retour arrière

L’ancien composant est conservé dans `OriginalStartPage.tsx`, avec ses styles initiaux. Pour remettre durablement cet accueil par défaut sur la branche, remplacer l’élément de la route `/` par ce composant. Pour annuler toute cette intégration, révoquer son commit isolé ; le commit distant précédent est `1cf020d953670aaa95f38388896126a3762bcec8` (aperçus seuls). Aucun effacement de sauvegarde requis.

## Vérification

- Test React/jsdom des composants réels : première visite, routes de lancement/rejeu, sauvegarde non contiguë, niveau verrouillé, territoire secret, récompense distincte de la victoire, quatre langues, fin du parcours et ancien accueil.
- Comparaison du stockage avant/après navigation et rejeu : aucun changement.
- Suite existante : 80 tests réussis sur 81 au premier passage ; le seul échec était une assertion textuelle sur l’ancienne implémentation de la reprise. Assertion adaptée au nouveau modèle, puis les quatre tests concernés (dont l’intégration React) réussissent.
- TypeScript et build Vite réussis. ESLint ciblé : aucune erreur (avertissement React inutilisé dans le composant original conservé).
- Pas de validation visuelle Safari/iPhone ou Android revendiquée. À contrôler avant mise en production : affichage à 320/390 px, défilement, langue, parcours et retour, lancement de chaque famille, passeport et découvertes.
