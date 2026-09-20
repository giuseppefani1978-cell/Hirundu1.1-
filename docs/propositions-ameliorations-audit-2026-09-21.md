# Ajouts proposés au document des améliorations

Propositions issues de l'audit du PDF, sans refonte des mini-jeux et sans mise en production. Ce fichier est un complément ; le PDF des améliorations n'a pas été fourni ni modifié.

## A01 — Une fiche réelle minimale par territoire

Objectif : chaque victoire ouvre au moins une fiche intéressante, y compris Gallipoli et Lecce actuellement vides.

Commande : « Complète les cartes réelles de HIRUNDU avec au moins une fiche sourcée par territoire. Vérifie nom, commune, coordonnées et lien officiel. Ajoute source et date de contrôle. N'invente aucun commerce partenaire ni avantage. Préserve les dix POI de chasse existants et les neuf correspondances de récompenses. Travaille sur une branche séparée. »

Validation : neuf territoires renseignés ; chaque lien et destination vérifiés ; incomplet signalé explicitement.

## A02 — Une reprise explicitement décrite

Objectif : préciser si Continuer reprend le niveau ou une partie au point exact.

Commande : « Définis un contrat de reprise commun aux trois familles HIRUNDU. Affiche clairement ce qui est sauvegardé. Propose un checkpoint limité et versionné pour reprendre une chasse après fermeture, avec migration des anciennes sauvegardes et sans modifier le gameplay. Teste rechargement, replay et mise à jour. Ne publie pas. »

Validation : aucune promesse de position/score conservé si ces données ne sont pas effectivement restaurées.

## A03 — Provenance des validations du passeport

Objectif : distinguer les anciens tampons de provenance inconnue, les démos et les futures validations authentifiées.

Commande : « Audite la provenance des anciens tampons du passeport HIRUNDU. Propose une migration additive qui conserve les acquis tout en séparant historique non vérifié, visite déclarée, test et validation authentifiée. Aucune victoire virtuelle ni QR de démonstration ne prouve une présence réelle. Ne supprime aucune donnée. Travaille sur une branche. »

Validation : statuts compréhensibles FR/IT/EN/ES ; conservation des historiques ; répétition sans double gain.

## A04 — Une campagne mobile reproductible

Objectif : empêcher les validations de façade fondées uniquement sur des motifs trouvés dans le code.

Commande : « À partir de la grille C14, prépare une campagne de test pour un commit précis : Safari/PWA iPhone et Chrome/PWA Android, neuf niveaux, quatre langues, victoire/défaite, reprise, rotations et passage au réel. Enregistre appareil, navigateur, résultat, capture et anomalie. Sépare exécution réelle, simulation et non exécuté. Ne marque jamais un cas non exécuté comme réussi. »

Validation : trace datée de chaque scénario ; liste courte des blocages ; version identique aux captures.

## A05 — Réduire la dette technique par zone

Objectif : diminuer progressivement les 218 avertissements initiaux, sans modifier en masse le jeu approuvé.

Commande : « Classe les avertissements HIRUNDU par risque et module. Corrige d'abord les effets React, les chemins d'erreur et les variables réellement obsolètes. Ne désactive aucune règle pour obtenir du vert. Une modification limitée, un test de comportement pertinent et un bilan par lot. Préserve les cadrages et mini-jeux. »

Validation : aucun nouveau warning ; réduction mesurée ; tests, typecheck, lint et build réussis.
