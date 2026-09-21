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

## Intégration jouable — niveau 8

Après accord : effets intégrés à `level8-flight/`, sur la branche d’améliorations et le site privé uniquement. Démarrer avec « Prendre mon envol », maintenir les flèches du pavé (ou clavier). Le défilement reste automatique et inchangé. Le bouton ≋ compare avec/sans reflets ; choix temporaire sans écriture dans les sauvegardes. Respect de la préférence système de mouvement réduit.

Six petits groupes de reflets dans l’eau ouverte (image inspectée), placés plus près du centre que la maquette pour rester visibles dans le cadrage réel. Coordonnées liées à chaque passe du fond, transparence héritée du fondu existant, animation basée sur S.clock donc gelée en pause. Aucun nouveau minuteur. Canvas save/restore isole tous les styles. Les deux appels de rendu sont les seules modifications au moteur ; test par hash protège tous les autres octets, y compris commandes, collisions, bonus, obstacles, défilement et bataille.

Tests automatisés : positions liées à l’image, gel de l’horloge, restauration du contexte, ON/OFF, mouvement réduit, quatre langues et intégration des deux passes. Validation visuelle et fluidité sur iPhone restent à faire par l’utilisateur. Les autres niveaux ne sont pas concernés.

Statut : A06 jouable sur le niveau 8 de test, à valider visuellement. Production inchangée. Suite : A07, satisfaction des actions.
