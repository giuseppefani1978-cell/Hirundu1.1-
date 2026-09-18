# Niveau 4 — Chasse en vol sur l’Adriatique

Branche : `test/niveau4-vol-adriatique-2026-09-18`.

## Version affinée — 18 septembre 2026

Cette branche conserve le prototype de chasse verticale du niveau 4 et sert de base au futur comportement des niveaux 6 et 8.

Modifications intégrées :

- vitesse de défilement unique, réglée par défaut sur un rythme **doux** ; le sélecteur de vitesse a été supprimé ;
- pilotage de l’oiseau plus progressif avec inertie/amortissement, pour éviter les déplacements trop brusques ;
- glisser au doigt toujours actif, complété par un **micro-pad discret** en bas à droite ;
- réponses transformées en **cartes visuelles** avec l’icône du lieu, son nom et la commune ;
- davantage d’obstacles pendant les phases de vol : déchets/poubelles, bouteille, canette, sac, plus quelques ennemis mobiles ;
- les obstacles sont générés par vagues avec une voie volontairement laissée libre, afin de forcer le zigzag sans rendre le passage impossible ;
- après le dixième lieu, la chasse mène maintenant à l’introduction de la **bataille normale du niveau 4**. La bataille elle-même n’est pas modifiée.

## Ouvrir le prototype

Depuis la racine du dépôt :

```sh
python3 -m http.server 8000 --directory public
```

Puis ouvrir :

```
http://localhost:8000/level4-flight/
```

Le dossier est également copié dans la compilation Vite. Depuis une version publiée du jeu, l’URL relative est `level4-flight/`.

## Fichiers principaux

| Fichier | Contenu |
| --- | --- |
| `game.js` | Pilotage, inertie, défilement, collisions, obstacles, bonus, réponses et transition vers la bataille |
| `style.css` | Mise en page, cartes, micro-pad, bulle de Tarantula |
| `places.js` | Dix lieux et leurs questions FR/IT/EN/ES |
| `index.html` | Structure de l’écran |
| `coast.webp` | Fond côtier déroulant |
| `assets/` | Oiseau, Tarantula, ennemis et bonus |

## Logique actuelle

La chasse débute par un vol libre, puis Tarantula pose une question et trois cartes-réponses arrivent depuis le haut. Le joueur doit déplacer Hirundu vers la bonne carte. Les mauvaises réponses disparaissent ; une réponse manquée revient plus tard.

Le décor avance doucement. Les vagues d’obstacles utilisent trois couloirs implicites : deux peuvent être occupés et un reste traversable. Le joueur peut donc changer de trajectoire sans rencontrer de barrage totalement fermé.

Café : +30 énergie. Rustico : bouclier temporaire. Pause et perte de focus figent le jeu.

Après 10/10, le bouton de continuation ouvre `#/level/4?test=battle` dans la même version publiée : on retrouve alors l’introduction d’orientation et la bataille existante du niveau 4.
