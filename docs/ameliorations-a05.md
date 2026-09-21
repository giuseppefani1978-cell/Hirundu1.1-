# A05 — Personnages expressifs : aperçu à valider

Entrée `public/character-review/index.html`. Pas d’import dans le jeu : A05 reste une proposition isolée, contrairement aux A01–A04 déjà codées dans la branche de test.

## Réactions

Les images existantes d’Aracne et Tarantula sont réutilisées sans retouche, déformation ou changement de proportions. Il s’agit de postures et de signes expressifs ; aucune nouvelle expression faciale n’est prétendue sur les sprites statiques.

- Vol : inclinaison légère, 480 ms, référence de posture seulement ; les battements d’ailes existants des moteurs sont à conserver.
- Effort : inclinaison brève, 240 ms ; encouragement de Tarantula.
- Impact : recul local de 5 px, 180 ms ; signe d’attention. Aucun flash d’écran ou mouvement de caméra.
- Découverte : élévation de 6 px, 420 ms ; acquiescement et coche.
- Victoire : élévation de 12 px, 650 ms ; salut et étoile.

Tout revient à la position initiale. Les illustrations sont agrandies pour revue, ces amplitudes ne sont pas encore des valeurs validées dans le canvas. Aucun mouvement automatique à l’ouverture, aucune boucle ni son. Un nouveau clic annule l’effet précédent : pas d’empilement.

## Accessibilité et intégration future

FR/IT/EN/ES. Chaque événement possède son texte et un signe distinct. La préférence système de mouvement réduit prévaut ; le contrôle local permet aussi une version sans translation/rotation. Activer ce mode ou masquer la page annule les effets en cours.

Après validation seulement : brancher les événements aux moteurs existants, appliquer les effets au rendu du sprite et jamais à la position physique, au rayon de collision, aux contrôles, au paddle ou à la physique de rebond. Conserver les animations de combat approuvées. Mesurer les performances réelles sur téléphone avant généralisation. Les temporisations ne doivent pas bloquer les commandes.

## Vérification

Test jsdom : absence d’autoplay, cinq événements dans quatre langues, durées finies, absence de mise à l’échelle, annulation des effets précédents, mouvement réduit local et système, assets locaux. Pas de lecture/écriture de sauvegarde ni de réseau ajouté. Pas de contrôle visuel iPhone revendiqué.

Statut A05 : aperçu à valider. Prochaine action du PDF : A06, décors vivants et lisibles, avec cadrages et coordonnées strictement préservés.
