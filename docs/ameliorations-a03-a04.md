# A03 / A04 — Propositions isolées à valider

Entrée : `public/design-review/index.html`. Aucun import dans les écrans de jeu. A01/A02 restent fonctionnelles et inchangées. Les niveaux, sauvegardes, moteurs, collisions, orientations et coordonnées ne sont pas modifiés.

## A03 : référence commune

Valeurs issues des styles actuels : ciel #bfe2f8, papier #fffdf5, encre #0e2b4a, action #2546c1 et or #c8b37a. Police système pendant le jeu, compteurs monospace ; l’accueil conserve Barlow et son bleu nuit. Boutons primaires bleus, secondaires ivoire, états désactivés distincts, focus visible et cibles de 44 px minimum dans la proposition. Ni nouvelle palette globale ni suppression de la personnalité des modes.

La planche montre les couleurs, les textes, les compteurs et trois états de bouton. Les exemples sont isolés : aucune nouvelle charte globale n’est chargée par le jeu.

## A04 : quatre layouts de référence

- Classique 1/2/9 : conserver la colonne verticale des dix découvertes à gauche, le déplacement sur la carte et le cadrage déjà approuvé. Pause : zone tactile de 44 px (référence actuelle 42 px).
- Arkanoid 3/5/7 : conserver l’enveloppe de dialogue de 74 px validée, les commandes inférieures et l’aire du jeu. Le bouton Pause actuel est déjà à 44 px : aucun gain artificiel revendiqué. Proposer la lecture complète d’une question au toucher sans agrandir durablement la bulle.
- Vol 4/6/8 : conserver le pilotage superposé et le HUD à gauche ; Pause à 44 px au lieu de 34 px. La maquette réserve une enveloppe identique dans les deux variantes ; l’impact du changement sur le vrai canvas devra être mesuré avant intégration.
- Bataille : conserver le paysage, séparer informations de combat et commandes. La scène de 740 × 360 est accessible par défilement horizontal sur petit téléphone ; ce défilement appartient à l’atelier, pas au jeu.

La référence est **reconstituée**, pas une capture exacte du jeu. Les décors et personnages sont les assets existants utilisés à titre d’illustration. Les cibles et les murs sont schématiques ; leurs positions ne représentent pas les vraies coordonnées. Les chiffres de surface affichés sont les dimensions DOM de la maquette uniquement. Aucune supériorité mesurée sur la version réelle n’est affirmée.

## Références inspectées

- `src/routes/StartPage.css` et A01 approuvée.
- `src/style.css` : Pause classique, HUD vertical et ancrage bas.
- `public/level3-arkanoid/style.css` : règles finales de dialogue 74/68 px et cibles tactiles.
- `public/level4-flight/style.css` : en-tête, bulle, commandes 56 px et Pause 34 px.

## Validation et suite

L’atelier propose FR/IT/EN/ES, portrait 320 × 568 et 390 × 700, bataille 740 × 360, variantes référence/proposition. Lire la question ouvre un dialogue accessible ; les flèches déplacent uniquement l’illustration et annoncent qu’il s’agit d’une démonstration. Aucun moteur de jeu ni son, stockage ou gain de progression.

Les tests automatisés vérifient les sélecteurs, les quatre langues, les quatre modes, le déplacement illustratif, les assets locaux et l’absence d’écriture de progression. Ils ne constituent pas une validation visuelle sur iPhone/Android.

A03 et A04 restent **proposées, à valider**. Après accord : intégrer les tokens à portée limitée, tester chaque vrai mode aux mêmes dimensions avant/après, préserver les cadrages, mesurer les zones de jeu et valider l’absence de chevauchements sur appareils. Ne pas annoncer A04 terminée tant que ces comparaisons réelles ne sont pas faites.

## Précision utilisateur — paddle et bataille

Le paddle Arkanoid sur lequel Aracne rebondit est indispensable : conserver aspect, dimensions, glissement, angle de rebond et lancement des niveaux 3/5/7. Son absence dans la première maquette était une omission de représentation, jamais une proposition de suppression. Le paddle vert/or reprend les couleurs du moteur actuel et suit maintenant les commandes gauche/droite de la maquette.

Batailles : conserver au maximum le travail existant, notamment les sept commandes actuelles du niveau 3 (gauche, saut, plongée, droite, esquive, attaque, spécial), les mouvements d’Aracne, les boss, l’équilibrage et l’introduction portrait/paysage. La proposition générique à trois boutons est retirée de la maquette bataille. Pas de refonte de combat ; seulement des retouches de lisibilité après comparaison et approbation. Les autres familles gardent leurs propres commandes.

## Intégration approuvée — branche de test

A03/A04 ont été autorisées puis codées à portée limitée : feuille commune chargée par l’application et les six pages autonomes, tokens des couleurs existantes, contraste des boutons désactivés, focus visible, traitements papier/encre des questions. Aucune refonte de bataille.

A04 : les dimensions existantes du canvas, des zones de jeu, du HUD, du paddle et du pavé de pilotage sont conservées. Pause classique bénéficie d’une cible de 44 px via extension de hitbox ; Pause vol gagne une cible de 44 px sans agrandir l’en-tête. Arkanoid conserve ses contrôles déjà confortables et son enveloppe de dialogue validée.

Dans 3/5/7 et 4/6/8, la commande Lire/Leggi/Read/Leer ouvre la question complète via la pause existante. Le texte passe dans l’aide du panneau Pause. La reprise reste explicite et utilise le moteur existant. Pas de dialogue supplémentaire, de nouveau mécanisme de sauvegarde ou de reprise automatique. Le lecteur n’apparaît pas pendant le combat ou les écrans d’introduction.

Vérification : 90 tests réussis ; compilation Vite réussie. Les tests d’intégration vérifient que le code moteur précédant les nouveaux adaptateurs reste identique octet par octet, et que les adaptateurs n’ouvrent pas le lecteur pendant une bataille. Contrôle tactile/visuel sur iPhone et Android encore nécessaire avant production. L’action A04 reste en validation mobile, sans gain de surface inventé.
