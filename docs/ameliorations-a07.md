# A07 — Satisfaction des actions, aperçu isolé

Quatre événements simulés via `action-review/` : bonus, découverte, dommage, victoire. Texte + symbole distincts, compteur mis à jour immédiatement, réaction de cible 300 ms, impulsion compteur 350 ms, six particules maximum pendant 450 ms. Aucun flash plein écran ni caméra secouée. Sons synthétiques courts optionnels (muets par défaut). Pas de dépendance au son ou à la couleur.

Comparaison effets ON/OFF ; mouvement réduit système ou local supprime les déplacements et particules. Les contrôles restent disponibles. FR/IT/EN/ES. Chaque nouvel événement remplace l’effet précédent. Son et animations arrêtés en arrière-plan. Aucun accès aux sauvegardes, aucune règle ou collision modifiée. Le choix de famille ne remplace pas les moteurs : simple référence visuelle, avec barre présente pour Arkanoid. Le fond niveau 8 est une illustration commune, pas une refonte des autres niveaux.

## Intégration autorisée au niveau 8

Les collectes, bonnes découvertes, dommages réels et fin de chasse déclenchent maintenant un symbole et un libellé courts. Particules limitées à six pendant 450 ms, animation de l’amphore du compteur à la découverte. Mouvement réduit coupe les animations, pas l’information. Effets visuels désactivables indépendamment du son. Aucun changement au moteur : adaptateur autour de tick/draw, chacun invoqué exactement une fois, et observation des compteurs après simulation. L’intégralité du fichier game.js reste protégée par les tests précédents.

Sons optionnels persistants, muets initialement, gain augmenté par rapport à l’aperçu, activation par interaction utilisateur et bouton « Tester le son ». La musique coupée impose également le silence aux effets. Message explicite si AudioContext ne démarre pas ; « son prêt » confirme l’état logiciel, pas l’audibilité physique sur iPhone. Pas de son en arrière-plan ; arrêt des voix et annulation des lectures en attente. Réglages et guide dans un panneau défilable de l’introduction/pause uniquement.

À valider sur iPhone : lisibilité, écoute réelle, fluidité. Le niveau 8 de test est intégré ; l’harmonisation des autres niveaux reste à faire après validation. La bataille est inchangée : « Chasse terminée » ne prétend pas à une victoire sur le boss. A06 inchangé, reflets jugés peu perceptibles par l’utilisateur.
