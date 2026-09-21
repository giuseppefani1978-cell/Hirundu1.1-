# Audio et A08 interactif — branche de test

## Audio

Niveau 3 : `ensureLevelTrack` renvoyait la chaîne « huntMusic » ou « battleMusic » et ne créait jamais de lecteur. Il utilise désormais les références des lecteurs en cache. Les pistes, volumes, règles de pause et batailles restent celles du jeu existant. Le correctif concerne la lecture audio, pas les mécaniques de combat.

Niveaux 5/7 : le module A07 lit `hostMusicEnabled`, leur variable réelle, au lieu de référencer `musicEnabled` qui n’existe pas dans ces moteurs. Niveau 3 et vols conservent leur préférence existante. Aucun son imposé quand la musique est coupée.

## Entraînement interactif

Bouton « S’entraîner » dans les réglages de l’introduction ou de la pause, sur les neuf chasses. Il ouvre un terrain pédagogique isolé, sans modifier la partie. Les consignes seules restent disponibles comme référence.

- Classique / vol : maintenir les flèches pour déplacer Aracne, puis rejoindre effectivement la cible ✓.
- Arkanoid : déplacer la barre, lancer, intercepter Aracne avec la barre ; le rebond doit ensuite atteindre la cible. Si la barre manque Aracne, relancer sans pénalité.
- Une instruction à la fois, validation par simulation et collision ; pas de bouton Suivant pour valider artificiellement un geste.
- Pavé tactile, clavier, quatre langues, Fermer, Passer et Recommencer. Les flèches du dialogue n’atteignent pas les commandes du niveau sous-jacent.
- L’exercice se fige en arrière-plan et relâche toutes les commandes ; fermeture et sortie de niveau nettoient la boucle et les écouteurs.
- Seule la clé `hirundu_practice_<famille>_v2` est écrite : completed après succès réel, skipped en cas de passage. Les scores et découvertes de la partie ne changent pas. Un ✓ sur le bouton indique la réussite mémorisée. Pas d’ouverture automatique répétée ; entraînement toujours rejouable.

Il s’agit d’une simulation pédagogique simplifiée, pas d’un remplacement des moteurs réels. Pas de particules ni de décor animé dans l’exercice ; seuls les mouvements nécessaires à l’apprentissage sont présents.

## Vérification

Tests de déplacement et cible, inaction, rebond véritable, échec/reprise, conservation des sauvegardes, nettoyage du dialogue, parité des modules statiques/compilés, lecteurs audio en cache, pause/mute et variables de préférence. Protection par hash des moteurs autonomes maintenue, avec une seule exception explicite pour la ligne audio corrigée.

Écoute et prise en main sur iPhone restent à confirmer. Production GitHub Pages inchangée ; diffusion uniquement sur le site privé de test.
