# Hirundu Play Beta — architecture d'accès (31/10/2026)

> **Statut : prototype uniquement.** La branche `play` et ce document ne déploient aucun site, n'activent aucun code réel et ne modifient pas le projet Supabase utilisé par le planificateur.

## Décisions produit

- **Une seule personne attribue les accès bêta : l'administrateur propriétaire.** Pas d'auto-inscription ni de délégation par les testeurs lors de la première vague.
- Expérience bêta sous la marque Hirundu, idéalement sur `play.myapuliatrip.com` après configuration d'un **hébergement séparé**, DNS/HTTPS et validation.
- Réutilisation ciblée du système du planificateur, avec permissions et données indépendantes.
- Le panel sera **évolutif** vers des modules de partenaires et campagnes; ces modules restent désactivés pendant la bêta.
- Conservation des cartes, passeports et échanges QR dans leur stockage actuel durant cette étape. La synchronisation Supabase des cartes **reste une étude** (#64).

## Référence technique EXISTANTE (planificateur)

| Source | Comportement à reproduire |
| --- | --- |
| `Aracne-Apulia-trip-Planner/dist/beta-admin.html` | Panel d'administration, gestion des lots, révocation et statuts de feedback |
| `Aracne-Apulia-trip-Planner/dist/beta-access.js` | Code personnel, activation sur navigateur, gestion de session côté serveur |
| `Aracne-Apulia-trip-Planner/supabase/BETA-INVITATIONS.md` | Quotas, codes hachés, fenêtres d'activation, expiration |
| `Aracne-Apulia-trip-Planner/supabase/beta-api-with-invitations.sql` | Actions RPC contrôlées, vérification côté serveur, feedback |
| `Aracne-Apulia-trip-Planner/tests/beta-invitations.dom.cjs` | Tests négatifs et parcours de validation à adapter |

**Ne pas copier directement** les URL Supabase, clés publishables, cookies, clés de localStorage, codes ou fonctions privilégiées de production du planificateur dans Hirundu.

## Découpage du futur système

```text
play.myapuliatrip.com
  /                  accès bêta Hirundu + gameplay si session vérifiée
  /admin             dashboard bêta (uniquement administrateur serveur)
  /feedback          signalement depuis le jeu (session bêta)
  /partner           désactivé pendant la bêta

Backend dédié Hirundu (Supabase indépendant ou API équivalente)
  hirundu_beta_invites: code_hash, issued_by, created_at, expires_at, activated_at, revoked_at
  hirundu_beta_sessions: invite_id, token_hash, nickname, created_at, last_seen
  hirundu_beta_feedback: session_id, category, level, device, message, status, created_at
  hirundu_partner_*: FUTUR — pas de déploiement bêta
```

Ces noms de tables ne constituent **pas une migration SQL exécutable** : l'API et son modèle de sécurité doivent être revus avant création d'un nouveau projet.

### API future (contrat fonctionnel)

- `activate(invitationCode, nickname, deviceSession)` → session autorisée, code utilisable une seule fois, expiration et révocation vérifiées **côté serveur**.
- `session()` → utilisateur actif + `is_admin` renvoyé depuis une vérification serveur, jamais depuis un paramètre frontend.
- `admin.create_invitation(label, expiry)` → code personnel affiché une seule fois et valeur hachée conservée sur serveur.
- `admin.list_testers()` → statuts et niveau de participation, sans retourner les jetons secrets.
- `admin.revoke_invitation(id)` → accès révoqué et sessions correspondantes invalidées.
- `feedback.submit(level,category,message,device)` → retour après session, rate limit, limite de taille.
- `admin.feedback_status(id,status)` → uniquement administrateur.

### Sécurité et limites

1. **Un simple écran de connexion dans un site statique ne protège pas les fichiers du jeu.** Le backend doit sécuriser toutes les données et APIs; si l'accès au bundle lui-même doit être confidentiel, employer une couche de contrôle serveur / edge au niveau de l'hébergement.
2. Les permissions admin doivent être décidées sur le serveur. Pas de secret `service_role` dans HTML, Vite, GitHub, React ou le navigateur.
3. RLS et permissions de toute ressource exposée à vérifier; limiter les tentatives de code, les retours et le volume de captures.
4. Stockage local Hirundu séparé de l'authentification; aucun accès implicite au planificateur.
5. Ne jamais copier d'anciennes données personnelles de voyages ou d'invitations pour amorcer la bêta Hirundu.
6. Aucun déploiement ni DNS sans validation expresse.

## UI prototype

`public/beta-admin-preview.html` : **maquette interactive avec données fictives, zéro connexion réseau et aucun accès réel**. Le panneau « Partenaires » est prévu pour plus tard et marqué indisponible. Ce fichier peut être ouvert localement pour arbitrer l'interface avant implémentation du backend.

## Roadmap Go / No-Go

**RC0 :** maquette admin + spécification des accès, sans backend réel.

**RC1 :** créer l'environnement de test Supabase Hirundu séparé, implémenter et tester les RPC avec scripts isolés ; lint/build/test; protéger les routes fonctionnelles.

**RC2 :** héberger une preview sous un domaine temporaire distinct; valider 5–10 codes, révocation, mobile, feedback, et les 9 niveaux sans régression.

**Publication `play.myapuliatrip.com` :** après validation des tests, choix de l'hébergeur adapté à une future monétisation, réglage DNS et TLS, et approbation.

## Suivi

- #62 : invitations et panel admin.
- #63 : hébergement indépendant et sous-domaine play.
- #64 : étude Supabase des cartes, explicitement hors RC1.
