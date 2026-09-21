# Proposition de finitions — à valider

L’utilisateur conserve l’accueil publié comme référence. La première refonte A01 est rejetée (PR #36 fermée). Cette proposition repart de main `58a2185`, qui inclut la correction des obstacles au niveau 8.

## Aperçu isolé

Ouvrir `/preview-finitions.html` avec le serveur de développement. Le carrousel compare une reconstitution mobile de l’accueil actuel et une proposition légère. Le niveau 8 est un exemple, pas une lecture de la sauvegarde. Les interactions sont simulées et ne lancent pas le jeu. Aucun stockage, aucun changement de progression ni de score.

La proposition conserve le bleu nuit, les trois halos, le panneau translucide et les textes principaux. Elle met le niveau de reprise au-dessus du bouton, renforce le contraste du bouton principal et des découvertes, et ajoute un accès direct au passeport. La langue est représentée de façon compacte, sans sélecteur fonctionnel dans cette maquette. La mention TEST est retirée uniquement dans la proposition.

## Décisions attendues avant intégration

- A01 : valider la reprise et l’accès direct au passeport, sans ajouter de statistiques à l’accueil.
- A03 : valider le contraste bleu du bouton et les liens secondaires, en conservant l’identité existante.
- A07 : préparer ensuite les retours de collecte dans le vrai décor, sans modifier les règles ni les hitboxes et avec mouvement réduit.
- A10 : préparer ensuite la présentation des découvertes avec les illustrations existantes et du contenu vérifié.

Cette branche ne modifie aucun composant du jeu et ne doit pas être déployée automatiquement. La comparaison est un prototype français ; l’intégration éventuelle devra conserver FR, IT, EN et ES et utiliser la véritable progression.

## Vérification

Interactions vérifiées avec jsdom : reprise simulée, ouverture/fermeture des découvertes et du passeport, restitution du focus. Le navigateur distant a refusé l’ouverture du fichier local ; aucun contrôle visuel sur appareil ni test iPhone n’est revendiqué. L’aperçu dans la conversation permet la revue visuelle avant intégration.
