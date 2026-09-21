# A01 — Accueil du joueur : proposition isolée

Base : production `58a2185ac1d6c7d05ec2c6d461a5327fd768f69a`, contrôles GitHub réussis et validation iPhone rapportée par le propriétaire. Le correctif L8 de réinitialisation du dessin figure dans cette base. Cela ne certifie pas toute la matrice C14. Les compléments de la PR #35 restent séparés et non intégrés à cette base.

Branche : `work/ameliorations-a01-2026-09-21`. Aucune modification des fichiers existants du jeu, de ses règles, de ses sauvegardes ou du déploiement. A02–A14 ne sont pas implémentées dans ce lot.

## Aperçu

`public/preview-a01.html` est autonome, sans réseau, police externe ni dépendance. On peut l'ouvrir comme fichier, ou lancer `npm run dev` et ouvrir `/Hirundu1.1-/preview-a01.html` sur le serveur de développement. Aucun lien de production ne pointe dessus.

- Un seul appel principal : démarrer / continuer / rejouer après neuf victoires.
- Territoire actuel, famille de chasse, orientation et nombre de niveaux terminés.
- Deux accès secondaires : passeport et découvertes.
- Rejouer et réglages dans un volet secondaire. Pas de bouton d'effacement.
- Palette bleu nuit, crème et or ; priorité aux contrastes et au mobile. Typographie système autonome, à valider avant intégration à la charte A03.
- Quatre langues et états première visite, retour au niveau 3, neuf niveaux terminés.

Les boutons **simulent leur destination** par un message : ils ne lancent pas les niveaux ni n'ouvrent un vrai passeport. Les réglages ne modifient aucune préférence. C'est volontairement une proposition UI, pas une nouvelle page active du jeu.

L'état « Ma progression » lit les clés existantes, avec les mêmes règles de disponibilité que la production de référence. Pour lire les vrais acquis, servir la page à la même origine ; un fichier téléchargé ou un autre domaine ne dispose pas de la sauvegarde de production. Les trois scénarios fictifs permettent la comparaison sans toucher aux données.

## À valider avant intégration

1. Hiérarchie : territoire + Continuer suffisamment évidents ?
2. Palette et proportions cohérentes avec l'identité approuvée ?
3. Accès passeport/découvertes suffisamment directs ?
4. Volet secondaire discret mais identifiable ?
5. Lisibilité et défilement sur iPhone, notamment 320–390 px ?

## Vérification

Tests JSDOM : quatre langues, trois scénarios, lecture des acquis existants, actions simulées, stockage indisponible et absence de mutation des données. Pas de validation tactile ni visuelle physique dans ce lot. La validation iPhone du propriétaire concerne la production, pas ce nouvel aperçu.

## Suite proposée

Après validation de A01 : A03 (planche de charte) puis A04 (trois layouts), A07 (retours d'action), A10 (découvertes). Un lot isolé et un aperçu à valider à chaque étape, sans fusion automatique.
