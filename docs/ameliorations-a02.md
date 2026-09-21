# A02 — Parcours des neuf étapes

**Statut actualisé :** aperçu approuvé par l’utilisateur puis intégré dans `src/routes/JourneyPage.tsx` avec les données réelles. Le texte ci-dessous décrit le prototype conservé comme référence. Voir `integration-a01-a02.md`.

## Périmètre

Aperçu isolé : `public/preview-a02.html`. Source éditable : `docs/preview-a02.fragment.html`. La proposition A01 approuvée reste disponible et inchangée. Aucun composant, route de jeu, niveau, score, collision, récompense ou sauvegarde n’est modifié.

Le parcours est un chemin de jeu schématique en trois rangées, pas une carte géographique. Il conserve le bleu nuit de l’accueil, utilise des médaillons dorés cochés pour les étapes gagnées, un médaillon bleu marqué d’une flèche pour l’étape actuelle et des points d’interrogation pour la suite. Un libellé et un symbole distinguent exploration classique (1/2/9), Arkanoid (3/5/7) et vol (4/6/8).

Toucher une étape met à jour sa fiche et son bouton : continuer, rejouer, ou verrouillée. Les étapes futures ne révèlent ni territoire ni POI. L’action de lancement est simulée et explicitement indiquée comme telle. Aucun faux gain, visite réelle, sauvegarde réussie ou lancement effectif n’est annoncé.

## États disponibles

- Première visite : aucune étape gagnée, niveau 1 disponible.
- Niveau 8 : niveaux 1–7 gagnés, niveau 8 actuel, niveau 9 mystérieux.
- Voyage terminé : neuf étapes gagnées, toutes rejouables ; aucune dixième étape.
- FR, IT, EN et ES : titres, actions, états, légendes et messages traduits.

Les contrôles d’aperçu ne feront pas partie de l’interface du jeu. Toutes les données restent en mémoire et sont fictives. Le prototype ne lit pas la progression personnelle.

## Intégration ultérieure

Brancher l’état réel sur `getProgressList()` et ses booléens `done` et `unlocked`, sans déduire les déblocages du seul nombre de victoires. Prévoir les sauvegardes anciennes ou non contiguës. Pour les récompenses, utiliser leur statut réel, sans déduire une visite réelle d’une victoire. Utiliser les routes du jeu pour continuer/rejouer et conserver tous les acquis. L’aperçu simule seulement des sauvegardes contiguës afin de valider d’abord le visuel.

## Vérification

Tests jsdom des trois scénarios, des neuf étapes, des trois familles et des quatre langues ; sélection/rejeu ; verrouillage et confidentialité des territoires futurs ; absence d’écriture de stockage. Les zones tactiles des étapes font au moins 58 px et les actions 48 px. Le CSS prévoit une largeur de 320 px et les mouvements réduits. Ces dispositions ne remplacent pas une vérification visuelle réelle sur iPhone ; celle-ci reste à effectuer.

## À valider

Lisibilité du parcours sur téléphone, médaillons et sensation de jeu, repérage de l’étape actuelle, fiche après sélection, compréhension des récompenses virtuelles. A02 reste « à vérifier », pas « terminée ». Suite du PDF après cette revue : A03 (références graphiques), puis A04 (layouts comparables par famille).
