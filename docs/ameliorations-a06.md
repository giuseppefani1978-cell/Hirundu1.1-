# A06 — Décor vivant : première proposition isolée

Entrée `public/scenery-review/index.html`. Niveau 8 choisi comme premier échantillon. Aucun fichier de niveau, image, cadrage, défilement ou coordonnée du jeu n’est modifié. Cette page ne constitue pas une intégration A06 aux neuf niveaux.

## Proposition

Trois petites zones de reflets doux dans la mer ouverte, sur la partie droite de l’image existante `public/level8-flight/coast.webp`, inspectée avant placement. Pas de vagues sur les terres, de nuages, de parallaxe, de mouvement de caméra ou de décor ressemblant à un obstacle. Les traits sont doux et limités à 2–3 px de translation. Effets derrière les personnages et cibles, sans interception des touches.

Le comparateur affiche l’image entière à ratio natif. C’est une vue de revue de l’asset, **pas une reproduction du cadrage et du scrolling de la chasse réelle**. Activer/désactiver les effets ne change ni le fichier image ni son cadrage dans la revue. Aracne, une cible et un corbeau sont des éléments de lisibilité illustratifs, pas de vrais objets du moteur.

Trois intensités : sans effets, discret (par défaut), standard. Bouton de lecture de six secondes ; aucune animation automatique ni boucle infinie. Comparaison avec l’effet masqué sans déplacer la scène. Mode réduit local et préférence système : aucun effet. Changement d’intensité, passage en arrière-plan et fermeture arrêtent la séquence.

## Intégration future après accord

Les reflets devront être attachés aux coordonnées du décor et à son masque d’eau pendant le scrolling, jamais figés aux coordonnées de l’écran. Vérifier les raccords existants et protéger les zones de cibles, bonus et obstacles. Ne pas appliquer le même masque à d’autres niveaux : leur mer et leurs terres diffèrent. Étudier les autres décors un par un. Le rendu de base doit rester disponible sans effets.

## Vérification

Tests jsdom : pas d’autoplay, séquence de 6000 ms, avant/après utilisant le même asset, quatre langues, arrêt explicite et mouvement réduit système, assets locaux. CSS sans boucle infinie et calque non interactif. Pas de score, sauvegarde, réseau ou son ajouté. Vérifications visuelles et performances iPhone/Android encore nécessaires ; aucune mesure de fluidité en jeu réel n’est revendiquée.

Statut : A06 en aperçu à valider. Production et niveaux jouables inchangés. Suite du PDF : A07, satisfaction des actions, après choix des effets retenus.
