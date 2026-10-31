# Configuration de la bêta Hirundu Play (HORS PRODUCTION)

## Préconditions obligatoires

1. Utiliser un **nouveau projet Supabase Hirundu indépendant**, jamais le projet de voyages Aracne. Ce dépôt ne provisionne pas lui-même de projet et ne modifie aucune base existante.
2. Vérifier les dernières recommandations Supabase pour les fonctions `SECURITY DEFINER`, RLS, grants et rate limiting. Inspecter le SQL dans `docs/sql/hirundu-beta-isolated-backend.sql` **avant** de l'exécuter sur le projet vierge.
3. Configurer l'hébergement de `play.myapuliatrip.com` sur un site séparé et une protection d'accès à l'origine si les fichiers du jeu doivent rester privés. Le formulaire React ne suffit pas à masquer les fichiers statiques et les anciennes pages HTML des niveaux.
4. Ne modifier ni `Aracne-Apulia-trip-Planner`, ni `version-1.0`, `main` ou `gh-pages`.

## Comment ça fonctionne

- Entrée `/` : vérification d'une session liée au navigateur via RPC `public.hirundu_beta`. Sans session, écran d'invitation; avec session autorisée, chargement du jeu.
- Entrée `/?admin=1` : administration accessible uniquement si le RPC renvoie `admin:true`.
- Les codes à usage unique sont des valeurs aléatoires de 32 chiffres hexadécimaux (128 bits). Seule leur empreinte SHA256 est conservée dans le projet Hirundu.
- Le token de navigateur est de 64 caractères hexadécimaux (256 bits) et est local. Un navigateur secondaire ne récupère pas automatiquement l'accès.
- L'administrateur génère les invitations, copie le lien, révoque les accès, visualise les retours et change leur statut.
- Les joueurs peuvent transmettre un bug/suggestion avec niveau et modèle de navigateur. Pas de lien avec le passeport de cartes ni les voyages Aracne.

## Préparer le serveur (nouveau projet exclusivement)

**Déjà exécuté le 31 octobre 2026** sur le seul projet Hirundu Beta `qlihimhcfsryuhmlmhvn` via une migration Supabase. Ne pas réexécuter ce script sans nécessité et revue de compatibilité. Les tables du projet Aracne existant n'ont pas été modifiées.

### Initialiser le premier administrateur

**Déjà réalisé une seule fois sur le nouveau projet.** Le premier code administrateur a été créé et communiqué exclusivement au propriétaire via la conversation. Ne pas réexécuter cette requête, qui ne retournerait d'ailleurs plus de code tant qu'un administrateur existe. Pour tout remplacement du code, utiliser une procédure de rotation sécurisée. Ne jamais l'ajouter au dépôt, à une issue ou à une capture partagée.

```sql
with secret as (
  select upper(replace(gen_random_uuid()::text, '-', '')) as access_code
), inserted as (
  insert into hirundu_private.invites
    (code_hash, code_suffix, label, is_admin, expires_at)
  select sha256(convert_to(access_code, 'UTF8')),
         right(access_code, 6), 'Owner', true, now()+interval '30 days'
  from secret
  where not exists (
    select 1 from hirundu_private.invites where is_admin
  )
  returning id
)
select secret.access_code as admin_code
from secret cross join inserted;
```

Cette initialisation ne crée pas d'administrateur supplémentaire si un code administrateur existe déjà. Un code administrateur expiré **avant activation** exige une procédure de récupération sécurisée par SQL, jamais un bouton d'auto-inscription public.

## Configuration Vite (dans l'environnement d'hébergement, pas dans GitHub)

```text
VITE_HIRUNDU_SUPABASE_URL=https://qlihimhcfsryuhmlmhvn.supabase.co
VITE_HIRUNDU_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY_HIRUNDU>
```

Ces valeurs sont celles du **nouveau projet Hirundu**, même si les clés publishables ne sont pas secrètes. **Ne jamais utiliser une `service_role` ou une clé `secret` dans Vite/client.** Sans configuration valide, le portail reste fermé.

La branche `play` est destinée à une racine de sous-domaine : `vite.config.ts` doit utiliser `base:"/"` pour le build de cette branche. L'ancienne application publique GitHub Pages demeure sur son autre configuration de build.

## Tests d'acceptation / conformité

- [ ] Première connexion administrateur ; rechargement sur le même navigateur.
- [ ] Refus avec code faux, expiré, révoqué, déjà utilisé.
- [ ] Refus d'un deuxième navigateur avec le même code ; première session intacte.
- [ ] Un testeur ne peut pas ouvrir `/?admin=1`, produire des invitations ou consulter les retours.
- [ ] Révocation invalide la session côté serveur.
- [ ] Retours limités à 15 par heure et par session; aucune image ou QR secret collecté par défaut.
- [ ] Tableau de bord n'affiche jamais les codes complets ou les jetons.
- [ ] Les 9 niveaux, le passeport local, Leaflet et les QR restent fonctionnels ; aucune liaison au Supabase tourisme.
- [ ] Confirmations HTTP + tests iOS et Android.
- [ ] Audit SQL RLS / advisor et tests négatifs en vrai projet isolé.
- [ ] Hébergement, CNAME DNS, HTTPS et rollback testés **avant** tout envoi aux testeurs.

## État au 31/10/2026

Le **projet Supabase Hirundu Beta est créé et actif** ; migration appliquée, trois tables privées avec RLS, fonction RPC installée, un code administrateur non encore activé et aucune session testeur. Le test de refus sans session est positif et l'inspection des privilèges est concluante. Le frontend reste sur une **branche feature**, **non fusionnée et non publiée**. L'URL `play.myapuliatrip.com` et les paramètres de build de l'hébergeur restent à configurer. Les tests end-to-end navigateur / téléphone et le durcissement de protection de l'origine restent nécessaires.
