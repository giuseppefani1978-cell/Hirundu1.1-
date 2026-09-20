# Vérification du PDF « Corrections de la bêta »

Audit du 20 septembre 2026 UTC / 21 septembre à Paris.

## Référence et conclusion

- Dépôt : giuseppefani1978-cell/Hirundu1.1-.
- Version publiée au départ : `main`, `53c5cbff3ef5d73b83ba6c84287cd66077247998`.
- Nouvelle publication pendant l’audit : `97666c2c6c6af6698239e4d334a3ccfd3e8cf4cf`. Branche corrigée rebasée dessus, changements L8 préservés ; tests relancés.
- Publication GitHub Actions réussie : https://github.com/giuseppefani1978-cell/Hirundu1.1-/actions/runs/35541307760 ; validation : https://github.com/giuseppefani1978-cell/Hirundu1.1-/actions/runs/35541307763.
- Attention : la branche par défaut du dépôt est `version-1.0`, pas la source de cette publication.
- Base du PDF : `40e7daf`. L'audit a porté sur le code actuel, plus récent.
- Corrections proposées uniquement sur `audit/beta-pdf-2026-09-21`. Aucun déploiement et aucune fusion.

**Le travail précédent est largement présent, mais les 14 fiches ne peuvent pas toutes être déclarées terminées.** Des défauts ont été corrigés sur cette branche. C08 et C14 restent partiels : contenus territoriaux et essais physiques manquent. Les contrôles de source ne prouvent pas la qualité tactile, sonore ou visuelle.

## Bilan action par action

| Action | Constat sur la version publiée | Intervention / résultat de cet audit | Réserve |
|---|---|---|---|
| C01 Sauvegarde | Migration et copie durable des anciennes clés présentes. Restauration lancée dans un effet React, après le premier rendu possible. | Restauration avant le montage React ; test de migration existant réussi. Reset complet puis redémarrage simulé vérifié. | Stockage local au même domaine/navigateur. Pas de compte ni de synchronisation. La copie locale ne protège pas d'un effacement des données du navigateur. Une chasse en cours n'est pas un checkpoint complet sauvegardé. |
| C02 Reprise | Accueil minimal volontairement protégé par un test récent. Rejouer/effacer existaient dans un ancien composant non routé. Reset incomplet pour les clés régionales. | Commandes ajoutées dans Mes découvertes, sous un volet, sans modifier l'accueil. Confirmation explicite. Annulation, replay conservant le niveau 3, et reset exécutés avec React/JSDOM. Les déblocages explicites 4–9 sont reconnus. | Un état historique incomplet/fragmenté peut nécessiter une récupération manuelle ; aucune progression inventée. |
| C03 Langues | Changement sans redémarrage et dictionnaires présents ; statuts de carte encore en français et noms des grades du passeport figés à l'import. | Statuts traduits FR/IT/EN/ES ; grades évalués à l'affichage ; résultat QR recalculé au changement de langue ; messages HTML de récupération et conseil iOS traduits. | Une revue visuelle exhaustive de chaque écran dans les quatre langues reste à faire. |
| C04 Raccords | Neuf correspondances victoire/découverte présentes ; transfert des provisions des vols présent. | Tests existants de raccords et de montage réussis ; aucune mécanique modifiée. | Les victoires sont simulées dans plusieurs tests ; pas neuf parties complètes ni écoute audio réelle. |
| C05 Rotation | Manifeste `orientation:any`, pause sur interruption et relâchement des commandes présents. | Contrôles existants réussis. | Verrouillage iPhone/Android, interruptions système, retour de caméra et installation PWA non exécutés sur appareils. |
| C06 Cadrages/tactile | Tests de cadrage, validation des X, défilement 8 et régressions mobiles présents. | Tests réussis ; aucun cadrage, décor, sprite, cadence ou mouvement modifié. | Comparaison visuelle avec les images approuvées et séquence longue du décor 8 non exécutées. |
| C07 Virtuel/réel | Bonne chaîne des neuf territoires, visites facultatives. Gallipoli et Lecce n'ont aucun POI renseigné. | Message explicite de contenu en préparation sur les cartes sans fiches. Correspondances conservées. | C07 est techniquement relié mais le contenu des deux territoires reste à compléter. |
| C08 Contenus | Démonstrations identifiées, aucun partenaire confirmé. Coordonnées de Grotta différentes dans les fichiers POI/partenaires. Manduria non sourcé précisément dans le précédent audit. | Coordonnées Grotta harmonisées avec ISPRA ; Manduria aligné sur la fiche ICCD officielle ; sources ci-dessous. | Vérification exhaustive des 11 POI et des commerces non achevée. Coordonnées fines de plusieurs lieux et validité commerciale encore à qualifier. Ne pas présenter le jeu comme un guide terrain entièrement vérifié. |
| C09 Passeport | Progression virtuelle séparée des validations QR et visites déclarées ; déduplication par ensembles. | Grades multilingues réparés ; sauvegarde et reset vérifiés. | Les anciens `pois` sont encore assimilés aux anciennes validations QR : leur provenance historique n'est pas prouvée. À clarifier avant usage commercial ; ne pas effacer ces acquis sans migration décidée. |
| C10 QR | Démo sans validation réelle ; aucun partenaire confirmé. QR `%` mal encodé provoquait une exception. Navigation générique acceptait un chemin inconnu. | Encodage invalide → QR inconnu ; seules routes de consultation connues acceptées. Récompense réelle masquée aussi pour les badges de démonstration. Tests de parsing exécutés. | Caméra refusée, scan optique, répétition physique, absence de réseau non essayés sur appareils. Aucun dispositif de QR réel authentifié n'est créé. |
| C11 Cartes/retour | Cartes consultables sans géolocalisation ; itinéraire externe avec coordonnées et libellé sur le bouton ; retour aux découvertes. | Contrôles existants réussis ; coordonnées ciblées corrigées. | Aller-retour Google Maps/Safari/Android non exécuté. Retour au niveau disponible, pas promesse d'une reprise à la même position d'une chasse. |
| C12 Réseau/cache | UI de récupération et carte indisponible présentes ; ancien worker supprimait tous les caches de l'origine et rechargeait toutes ses fenêtres. | Worker limité aux caches HIRUNDU/Aracne et fenêtres de son périmètre. Test exécutant le worker avec caches/fenêtres de deux applications. | Démarrage réseau coupé à froid non garanti. Pas de vrai mode hors ligne. Anciennes installations physiques non testées. |
| C13 Publication | Tests/typecheck/lint/build réussissent, mais le workflow Pages ne bloquait pas sur typecheck/lint et relançait installation/tests via `||`. | Pages exécute `npm ci`, tests, typecheck, lint, build en étapes bloquantes avant déploiement. Aucun changement des règles lint. | Avertissements historiques encore présents ; 218 initialement. La branche corrigée doit être fusionnée ultérieurement pour rendre ce garde-fou actif en production. |
| C14 Validation finale | Tests unitaires, JSDOM, montage simulé et assertions textuelles ; pas de preuve versionnée de campagne physique complète. | Suite locale relancée, cinq nouveaux tests de comportement. Grille physique ci-dessous explicitement non exécutée. | **Pas de certification finale iPhone/Android.** Chromium absent ; téléchargement essayé, délais réseau. Aucun test visuel réel annoncé. |

## Correspondances publiées conservées

| Niveau | Famille | Découverte / territoire | POI actuels |
|---|---|---|---:|
| 1 | Classique | Otranto | 5 |
| 2 | Classique | Gallipoli | 0 |
| 3 | Arkanoid | Lecce | 0 |
| 4 | Vol | Giurdignano (`adriatico`) | 1 |
| 5 | Arkanoid | Santa Maria di Leuca (`capo`) | 1 |
| 6 | Vol | Copertino (`arneo`) | 1 |
| 7 | Arkanoid | Nardò | 1 |
| 8 | Vol | Manduria (`messapia`) | 1 |
| 9 | Classique | Ostuni (`itria`) | 1 |

Ces nombres concernent les fiches des cartes réelles, pas les dix cibles de chaque chasse.

## Vérifications exécutées

- Avant modification : **79 tests réussis / 0 échec** ; TypeScript, lint et compilation réussis. **218 avertissements lint**, 0 erreur.
- Ajouts : tests de remise à zéro complète et récupération durable, conservation des déblocages régionaux, QR malformés/routes inconnues, isolement du nettoyage de cache, clics React annuler/rejouer/confirmer.
- Après modification : **84 tests réussis / 0 échec**, puis **83 / 0** après intégration de la dernière publication (un test L8 obsolète a été supprimé en amont) ; TypeScript, lint et compilation réussis ; 0 erreur lint. Les avertissements historiques restent visibles.
- Environnement : Node sur Linux, JSDOM et rendu simulé ; pas de GPU/canvas réel, pas d'appareil physique. Les tests historiques de certains niveaux injectent une victoire et neutralisent dessin/audio : ils ne valident pas une partie complète.
- `git diff --check` réussi.

## Grille restante, à exécuter sur la version que l'on choisira de tester

La colonne version doit contenir le commit réellement ouvert. Ne pas tester `main` et attribuer le résultat à cette branche.

Scénarios pour **chaque couple niveau/langue** : S1 chasse complète et question X ; S2 langue pendant chasse/pause/bataille ; S3 victoire, inventaire, musique et bonne carte ; S4 défaite/reprise ; S5 rotation, verrouillage et retour d'application ; S6 fermeture/rechargement et acquis conservés ; S7 carte/itinéraire externe et retour ; S8 QR refusé/inconnu/répété et réseau coupé. Tester Safari et PWA iPhone, Chrome et PWA Android. Les visites restent facultatives.

| Niveaux | Langues | Version testée | Appareils physiques | Scénarios | Résultat |
|---|---|---|---|---|---|
| 1, 2, 9 | FR, IT, EN, ES | À renseigner | iPhone + Android | S1–S8, chaque niveau/langue | Non exécuté |
| 3, 5, 7 | FR, IT, EN, ES | À renseigner | iPhone + Android | S1–S8, chaque niveau/langue | Non exécuté |
| 4, 6, 8 | FR, IT, EN, ES | À renseigner | iPhone + Android | S1–S8, chaque niveau/langue ; raccord 8 prolongé | Non exécuté |

## Sources factuelles consultées

- Manduria : ICCD, fiche nationale 1600377066, coordonnées WGS84 **40.406585, 17.64076** ; https://catalogo.cultura.gov.it/detail/ArchaeologicalProperty/1600377066 et fiche complète https://sigecweb.beniculturali.it/sigec/item/print/ICCD15726496. Repère du site archéologique ; ne prouve pas un accès ouvert ni un point d'entrée routier. Métadonnées ICCD sous CC-BY 4.0.
- Grotta della Poesia : ISPRA, **40.286061, 18.430054**, Roca Vecchia ; https://www.isprambiente.gov.it/it/attivita/museo/regioni/musei/grotta-della-poesia. Valeur POI déjà correcte ; doublon partenaire corrigé.
- Ostuni : coordonnées existantes confirmées par https://www.comune.ostuni.br.it/vivere-il-comune/luoghi/cattedrale-di-ostuni/.
- Piazza Salandra : existence et commune confirmées par https://www.visitnardo.it/it/la-bellezza-nardo/punti-di-interesse/centro-storico ; pas de précision topographique déduite de cette page.
- Copertino : fiche retrouvée sur https://cultura.gov.it/luogo/castello-di-copertino et https://museipuglia.cultura.gov.it/musei/castello-di-copertino/ ; aucune nouvelle coordonnée affirmée.
- Leuca : fiche Marina Militare retrouvée mais ouverture expirée ; **coordonnées non certifiées par cet audit**.

Aucun horaire, tarif, partenariat ou avantage n'a été inventé.
