# Niveau 4 — Chasse en vol sur l’Adriatique

Branche : `test/niveau4-vol-adriatique-2026-09-18`.
Base : `main`, commit `d21195f14363d43e84b19e65d349fdaa7a76ca27`.

Copie du prototype testé dans Work le 18 septembre 2026, source `e02f83d67d997aaa8e57c552378e50c9ec6a38ec`. Seuls les chemins des sprites ont été adaptés pour rendre ce dossier autonome. Les dix POI, les questions FR/IT/EN/ES, le décor, les règles et le pilotage sont conservés.

## Ouvrir le prototype

Depuis la racine du dépôt :
```sh
python3 -m http.server 8000 --directory public
```
Ouvrir http://localhost:8000/level4-flight/ dans le navigateur.

Le dossier est également copié par la compilation Vite habituelle. Son URL relative est `level4-flight/` sous la racine publiée du jeu. La création de cette branche ne publie pas automatiquement une nouvelle adresse GitHub Pages.

Test actuellement en ligne : https://hirundu-gameplay-niveau3.giuseppe-fani1978.chatgpt.site/level4/

## Fichiers à modifier

| Fichier | Contenu |
| --- | --- |
| `game.js` | Pilotage, collisions, vitesse, obstacles, bonus, déroulement et textes d’interface |
| `style.css` | Mise en page, couleurs, dimensions, bulle de la tarentule |
| `places.js` | Dix lieux et leurs questions dans les quatre langues |
| `index.html` | Structure de l’écran |
| `coast.webp` | Fond côtier déroulant |
| `assets/` | Oiseau, tarentule, ennemis et nourriture |

## Périmètre

Prototype de chasse uniquement : dix coquillages, puis écran final. La bataille et la progression du jeu principal ne sont pas raccordées. Les niveaux 6 et 8 ne sont pas modifiés.

Sept secondes de vol libre, puis 3,5 secondes pour lire la question ; les réponses défilent ensuite lentement. Le décor utilise une illustration générée, alternée avec son reflet vertical pour assurer le raccord. Ce n’est pas une carte géographique exacte. Les barrages dorés et les ennemis sont des obstacles ; la côte est un décor.

Glisser le doigt dans les quatre directions ; sur ordinateur utiliser les flèches. Café : +30 énergie ; rustico : bouclier de 8 secondes. Les réponses manquées repassent. La pause et la perte de focus figent le jeu.

Vérifications effectuées avant sauvegarde : syntaxe JavaScript, dix découvertes, mauvaises réponses, cibles manquées, pause, bouclier, collisions, victoire/défaite, quatre langues et rendu du canvas. Ressenti tactile à valider sur appareil.
