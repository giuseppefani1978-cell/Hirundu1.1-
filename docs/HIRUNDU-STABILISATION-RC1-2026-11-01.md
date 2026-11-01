# Hirundu — Stabilisation bêta RC1 (01/11/2026)

## Périmètre et état vérifié
Branche de travail dérivée de `play` au commit `2b533a14befc6f07054b63bfca1626f5a1b7f336`. Ne pas fusionner automatiquement : la version WhatsApp du panel d'administration est sur `fix/play-beta-whatsapp-invite-2026-11-01` (PR #66), et l'issue #67 indique qu'elle est déjà déployée sur Vercel. **La branche de travail actuelle ne contient pas nécessairement cette amélioration.** Synchroniser via revue avant toute promotion.

Le site `play.myapuliatrip.com` est signalé comme configuré et READY dans l'issue #67, mais aucune recette HTTP ou iPhone/Android réelle n'a été effectuée dans ce chantier. Le jeu public historique, Aracne tourisme, DNS, Supabase et données utilisateurs sont intouchés.

## Correctif initial livré
- `src/routes/LegacyLevelPage.tsx` : erreur de chargement de niveau visible au joueur, bouton réessayer, retour accueil, texte FR/IT/EN/ES; ignore les rejets d'une initialisation annulée.
- `src/routes/LegacyLevelPage.css` : panneau de récupération lisible en portrait et paysage, zones sûres iOS, contrôles tactiles.
- `tests/level-boot-recovery.test.mjs` : test statique de la présence des actions et de l'absence d'effacement explicite de sauvegardes.
- Limite : ce test ne prouve pas la jouabilité ni le comportement sur un appareil physique; tests npm/CI encore à confirmer.

## P0 — recette bloquante
| Scénario | Critère |
| --- | --- |
| L1 Otranto | lancement, victoire, bonus, reprise; zéro écran blanc |
| L2 Gallipoli | fond cadré, boss visible, victoire |
| L3 Lecce | Arkanoid, musique après interaction, paysage Android, victoire |
| L4 / L6 / L8 | scrolling, collisions, obstacles visibles (notamment L8), transitions |
| L5 / L7 | dialogues hors commandes, tutoriel Arkanoid, victoire |
| L9 | fin de jeu, retour accueil, sauvegarde |
| Cartes et QR | doubles, carte reçue persistante, échange bilatéral sur deux téléphones, expiration |
| iPhone / Android | Safari / Chrome et PWA; cinématique, Passer, audio, rotation, arrière-plan |
| Langues | FR/IT/EN/ES, y compris changement en bataille sans retour à L1 |
| Bêta | code invalide / expiré / révoqué; admin non accessible au testeur |

## Critères GO / NO-GO
GO seulement après `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build -- --mode play`, et tests physiques sur iPhone et Android. Aucun incident P0 ouvert. QR peut être retiré de RC1 si nécessaire, à condition de l'annoncer explicitement et de ne pas compromettre les cartes existantes.

NO-GO si perte de progression ou cartes, niveau injouable, accès admin non autorisé, écran blanc, rotation bloquante, ou risque de remplacement du panel WhatsApp actuellement publié.

## Suites
1. Vérifier les checks CI de la PR de stabilisation et corriger les échecs avérés.
2. Réconcilier PR #66 et la branche `play` sans écraser l'interface WhatsApp.
3. Exécuter la matrice 9 niveaux et 2 téléphones; consigner preuves, appareil, OS et reproduction.
4. Faire une revue sécurité des pages HTML autonomes et du contrôle d'accès au niveau hébergement.
5. Décider de la diffusion à 5–10 testeurs seulement après validation explicite.

Références : issues #55–#64, #67, PR #65, #66 et `docs/BETA-RC1-READINESS-2026-10-31.md`.
