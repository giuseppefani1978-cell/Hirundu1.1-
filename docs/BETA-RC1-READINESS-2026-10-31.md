# HIRUNDU — Beta RC1 readiness / audit du 31 octobre 2026

> Document préparatoire uniquement. Aucune publication n'est autorisée par ce fichier.
>
> Branche : `beta/rc1-preparation-2026-10-31` (créée depuis `main`). Les branches `main`, `version-1.0`, `gh-pages` et les joueurs existants ne doivent pas être modifiés par la préparation.

## 1. Ce qui est établi, ce qui n'est PAS validé

- `main` contient l'application avancée avec cinématique de démarrage, routes des 9 niveaux, cartes bonus, passeport, échanges QR, protection et sauvegarde du progrès en local.
- `version-1.0` (branche par défaut au moment de l'audit) est une version plus ancienne. Les branches sont divergentes. **Ne jamais promouvoir `version-1.0` sans audit**.
- `gh-pages/index.html` contient un bundle compilé, mais le commit exact actuellement servi par GitHub Pages, les réglages Pages et le résultat HTTP réel doivent être confirmés.
- `main/.github/workflows/ci.yml` définit `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; le succès de leur exécution actuelle n'a PAS été vérifié.
- `main/.github/workflows/pages-prod.yml` est un workflow historique désactivé. Le README décrivant un déploiement automatique depuis `version-1.0` ne doit pas faire autorité sans vérification.
- Le manifeste PWA de `main` et de `gh-pages` est `orientation:any`; celui de `version-1.0` exige `portrait`. Les problèmes Android historiques nécessitent une recette réelle.
- `main/index.html` désenregistre les anciens service workers; **pas de promesse de fonctionnement hors ligne**.
- Des tests de logique QR existent, mais ne remplacent pas une recette sur deux appareils physiques.
- **Aucun test matériel iPhone/Android ni HTTP 200 de l'URL publique n'a été revendiqué durant cet audit.**

## 2. Adresses

- URL historique **non certifiée dans cette session** : https://giuseppefani1978-cell.github.io/Hirundu1.1-/
- **URL RC1 de test : NON CRÉÉE / NON PUBLIÉE.** Créer un site distinct (autre dépôt GitHub Pages ou hébergeur de previews), avec un domaine et un `base` Vite cohérents.
- Si un domaine commercial commun est choisi plus tard : `play.myapuliatrip.com` peut être la destination officielle; ne pas le présenter comme actuellement configuré.
- Ne jamais réutiliser des URLs de progression, caméras, QR ou tokens identifiant des utilisateurs dans des liens de communication publics.

## 3. Priorités avant la première vague externe

### P0 : indispensables

1. Prouver le commit et le site effectivement publiés; obtenir et contrôler une **URL de bêta isolée**.
2. `npm ci && npm test && npm run typecheck && npm run lint && npm run build` : logs reproductibles; documenter et résoudre les échecs.
3. Smoke test sur iPhone Safari et Chrome Android, navigateur + PWA : cinématique/Passer/accueil, L1, premier bonus, pause, reprise.
4. Un parcours de chaque famille de jeux : classique (L1 et L9), boss (L2), Arkanoid (L3, L5 ou L7), vol (L4, L6 ou L8), puis test ciblé des 9 niveaux avant promotion.
5. Aucun écran blanc, aucun blocage d'orientation, aucun effacement de progression ni inventaire sur le parcours nominal.
6. Carte reçue, double, échange bilatéral sur deux téléphones avec expiration et fermeture inattendue : cohérence avant/après.
7. Confirmer que les QR de démonstration ne sont pas des validations de visites réelles.

### P1 : haute valeur

- Fiches POI, cartes Leaflet, passeport, retour depuis les bonus.
- FR/IT/EN/ES : menus, dialogue, reprise du bon niveau après changement de langue.
- Bruits/musiques, contrôles, dialogue, écran tactile et accessibilité.
- Appellation PWA Hirundu et avertissement de stockage local; droit des médias à vérifier.
- Formulaire de retour utilisateur très court; centraliser GitHub issues.

### P2 : hors RC1

- Liaison avec Il Volo di Aracne par `place_id`.
- Partage de cartes / compte multi-appareils et points commerciaux.
- Paiement, sponsors, pubs, boutique et publication app stores.

## 4. Scénarios des testeurs — environ 20–30 minutes chacun

| ID | Action | Preuve attendue | Bloquant si… |
| --- | --- | --- | --- |
| T01 | Ouvrir le lien; regarder ou passer l'intro | Arrivée sur accueil sans écran blanc | Impossible de démarrer |
| T02 | Lancer L1 et réussir | Victoire, carte et passage suivant | Partie bloquée ou carte perdue |
| T03 | Passer de portrait à paysage en bataille puis revenir | Interface/contrôles utilisables | Partie injouable |
| T04 | Refaire un niveau déjà terminé | Double attendu, 1er exemplaire conservé | Disparition de carte ou corruption |
| T05 | Ouvrir la carte bonus/Leaflet | POI et retour fonctionnels | Plantage/navigation sans retour |
| T06 | Fermer complètement puis rouvrir | Progression et cartes conservées | Données disparues |
| T07 | Tester niveau Arkanoid puis vol (dont L8) | Contrôles, obstacles, dialogues visibles | Jeu impossible à terminer |
| T08 | Changer de langue avant et pendant un niveau | Pas de retour involontaire au début | Perte de progression |
| T09 | Deux téléphones : échanger un double via QR | Inventaires cohérents, pas de copie abusive | Carte disparue ou dédoublée |
| T10 | Couper le réseau puis revenir | Comportement explicite; pas de perte de sauvegarde | Données effacées |

Le programme peut être scindé entre testeurs. Les tests QR bilatéraux requièrent deux appareils; ne pas exposer aux testeurs des QR de validation partenaires réels sans autorisation.

## 5. Fiche de remontée (une par incident)

- ID scénario et niveau :
- Date :
- iPhone / Android; version OS; navigateur / PWA :
- Attendu :
- Observé :
- Reproduction détaillée (3 étapes max) :
- Reproductible ? Toujours / Parfois / Une fois :
- Capture/vidéo facultative : retirer QR secrets, identifiants et autres données personnelles.
- Sévérité : **P0** bloque progression ou détruit données; **P1** gêne fortement sans blocage; **P2** cosmétique / amélioration.

## 6. Décision go / no-go

**GO bêta limitée** seulement si : URL isolée confirmée; build et tests critiques passés; L1/bonus/reprise/rotation validés sur iPhone et Android; aucune perte de progression observée dans les parcours nominaux; les limites PWA et stockage local sont clairement communiquées.

**NO-GO** si écran blanc, impossibilité de démarrer, pertes de cartes/progression, navigation bloquée, URL qui écrase la prod ou QR utilisés comme preuves de visites sans validation.

Un échec sur l'échange QR peut justifier de **désactiver l'échange dans RC1**, plutôt que de retarder tout le jeu, si le mode solo est stable et si cette restriction est explicite.

## 7. Tickets de suivi

- #55 : version et URL de bêta
- #56 : jouabilité 9 niveaux
- #57 : iOS/Android, orientation, audio, PWA
- #58 : échanges QR et inventaire
- #59 : cartes Leaflet et futur pont Aracne
- #60 : protocole testeurs
- #61 : PWA, stockage et licences

Tous les développements se font sur des branches de travail et Pull Requests. **Aucun déploiement ni merge sans validation expresse du propriétaire.**
