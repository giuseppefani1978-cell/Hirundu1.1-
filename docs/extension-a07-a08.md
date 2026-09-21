# Extension des améliorations aux neuf chasses

Branche de travail uniquement ; aucune bataille ni publication GitHub Pages modifiée.

| Famille | Niveaux | A07 | A08 |
| --- | --- | --- | --- |
| Classique | 1, 2, 9 | Retours sur compteurs réels, sons existants soumis au choix Sons des actions | Guide partagé dès le 1, passer/revoir |
| Arkanoid | 3, 5, 7 | Bonus, découverte, dommage ; barre et rebonds inchangés | Guide barre, lancement, rebond et cibles dès le 3 |
| Vol | 4, 6, 8 | Retours sur bonus, découverte, dommage | Même clé de guide dès le 4 ; niveau 8 conserve son intégration |

Module commun en lecture seule, sans modification des scores, collisions, cadrages ni sauvegardes de progression. Les six moteurs autonomes game.js restent inchangés. Les moteurs classiques ajoutent seulement montage/nettoyage et respect du choix audio aux trois sons de chasse existants. Pas de modification de la victoire du boss. Les réactions se taisent et disparaissent au passage en bataille, pause ou arrière-plan. Les guides et réglages ne prennent pas de place dans le terrain en cours de partie.

A03/A04 étaient déjà raccordées aux six niveaux autonomes et au style global ; elles sont conservées. Les nouveaux panneaux reprennent papier/bleu, commandes 44 px, quatre langues et mouvement réduit. A05 reste une proposition non validée. A06 reste propre au décor côtier du niveau 8 : son masque d’eau ne doit pas être copié sur d’autres paysages.

A08 reste un guide progressif de trois consignes, mémorisé par famille comme lu ou passé. Il ne certifie pas l’acquisition du geste ; l’entraînement interactif reste une évolution future. Tous les guides peuvent être revus depuis la pause de chasse.

Validation mobile restante : lancement et reprise, lecture des panneaux sur petit écran, sons activés/coupés, rebond sur barre et transitions vers bataille. Tests automatisés des compteurs, isolation des batailles/pauses, langues, stockage par famille et nettoyage à la sortie. Aucun test physique iPhone/Android revendiqué.
