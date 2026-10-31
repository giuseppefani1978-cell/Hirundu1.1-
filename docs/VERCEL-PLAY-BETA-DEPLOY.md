# HIRUNDU — publier la bêta sur play.myapuliatrip.com

## Statut
- **Projet Supabase Hirundu Beta : créé** (`qlihimhcfsryuhmlmhvn`, eu-west-1) avec l'API d'invitations et les tables de session / feedback.
- **Source d'hébergement :** branche `play` de `giuseppefani1978-cell/Hirundu1.1-`, après validation et intégration de la PR #65.
- **Site distant : PAS ENCORE DÉPLOYÉ.** Ni le domaine ni le DNS ne sont créés par un commit Git.
- **Application Aracne Trip Planner :** inchangée. Ne pas copier ses accès ou ses données.

## Hébergement Vercel indépendant

1. Créer **un nouveau projet Vercel Hirundu Play** dans le compte du propriétaire, via **Add New → Project → Import Git Repository → `giuseppefani1978-cell/Hirundu1.1-`**. Ne pas connecter ce dépôt au projet Vercel éventuellement utilisé par l'application touristique.
2. Choisir **la branche de production du projet Vercel : `play`** et conserver `main`, `version-1.0` et `gh-pages` hors de ce déploiement. Si la PR #65 n'est pas encore intégrée, NE PAS PUBLIER `play` : la branche contient l'ancienne maquette.
3. Lire `vercel.json` : `framework=vite`, `installCommand=npm ci`, `buildCommand=npm run build -- --mode play`, `outputDirectory=dist`. La commande doit impérativement conserver le mode `play` : elle charge `.env.play` avec les seules variables publiques du Supabase Hirundu (aucune clé privée).
4. Laisser les secrets serveur et les clés `service_role` hors du repo et du navigateur. Les clés publiables de Supabase sont publiques par définition; toutes les permissions d'accès reposent sur les RPC et les droits serveur.
5. Vérifier le build et accéder au premier domaine attribué par Vercel. L'accueil doit demander une invitation. `/admin` doit afficher la connexion et refuser un utilisateur non-admin. Les URL des niveaux (L4, L6, L8) et les cartes doivent être testées.
6. Dans **Vercel Project → Settings → Domains**, ajouter **`play.myapuliatrip.com`**. Copier exclusivement la cible CNAME demandée par Vercel dans la zone DNS du domaine, en modifiant seulement l'hôte `play`. **Ne modifier ni les enregistrements apex `@` ni les MX**. Vérifier HTTPS et le certificat.
7. Faire une recette Safari iPhone / Chrome Android du jeu et des invitations avant d'envoyer les invitations réelles.

## Limites de protection de la bêta

Le système d'invitation est autoritaire pour les API et l'interface principale du jeu, et les données privées sont dans Supabase. **Les assets statiques et certaines pages HTML autonomes du jeu peuvent rester accessibles directement sur l'origine** : une simple porte React ne rend pas le code et les visuels confidentiels. Pour exiger une distribution strictement privée de tous les fichiers, ajouter une protection HTTP au niveau de l'hébergeur, compatible avec les testeurs externes. Sur Vercel, la protection par compte Vercel exige des comptes Vercel autorisés, donc n'est pas équivalente aux invitations bêta Hirundu. Avant une commercialisation, revoir aussi les conditions du plan d'hébergement.

## Recette obligatoire avant premier testeur

- [ ] Vérifier l'exécution CI de la branche `play` (144+ tests, lint, typecheck, build).
- [ ] Vérifier le bundle compilé `--mode play` contient l'URL `qlihimhcfsryuhmlmhvn.supabase.co`, pas le projet Supabase touristique.
- [ ] Tester entrée sans code, code invalide, code expiré, code activé sur un autre appareil.
- [ ] Activer **une seule fois** le code d'administrateur initial sur le navigateur définitif du propriétaire; ne pas partager ce code.
- [ ] Créer une invitation testeur; copier son lien personnel; refuser son utilisation sur un deuxième appareil; révoquer puis vérifier le refus d'une nouvelle session.
- [ ] Tester le signalement de bug et son changement de statut dans le panel.
- [ ] Vérifier le lancement et la progression des neuf niveaux, caméra QR, musique, orientation et Leaflet.
- [ ] Contrôler les pages HTML autonomes de L4, L6, L8 et leurs sauvegardes navigateur. Ne pas prétendre que tous les fichiers sont privés sans contrôle HTTP.
- [ ] Vérifier HTTPS, DNS, favicon/manifeste et nom Hirundu; aucune redirection accidentelle vers `giuseppefani1978-cell.github.io`.
- [ ] Faire une sauvegarde de la configuration du projet, documenter le retour arrière; n'autoriser aucune propagation de code vers le site du Trip Planner.

## Sites et données à préserver

- **Tourisme** : `myapuliatrip.com` et son projet Supabase distinct ; aucune modification.
- **Ancien jeu public** : `giuseppefani1978-cell.github.io/Hirundu1.1-/` ; aucune modification.
- **Nouveau jeu bêta** : `play.myapuliatrip.com` ; destination proposée, **non validée en ligne**.

## Liens
- PR de développement : https://github.com/giuseppefani1978-cell/Hirundu1.1-/pull/65
- Supabase dédié : https://supabase.com/dashboard/project/qlihimhcfsryuhmlmhvn
- Vercel nouveaux projets : https://vercel.com/new
- Documentation Vercel domaines : https://vercel.com/docs/domains/set-up-custom-domain
