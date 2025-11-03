# Hirundu Tooling Setup

Ce dépôt utilise des dépendances npm pour le lint, le formatage et la compilation TypeScript. Si vous souhaitez relancer `npm install` comme mentionné dans la discussion précédente, suivez les étapes ci-dessous.

## Réinstaller les dépendances localement

1. Assurez-vous d'utiliser une machine ou un environnement CI qui a accès au registre npm.
2. Installez les dépendances avec:
   ```bash
   npm install
   ```
3. Après l'installation, les scripts utilitaires sont disponibles:
   ```bash
   npm run lint
   npm run format
   npm run typecheck
   npm run build
   ```

### Dépanner une installation qui échoue

Si `npm install` échoue régulièrement (par exemple avec une erreur HTTP 403 lors de la récupération de `@reduxjs/toolkit`), procédez à un nettoyage complet avant de relancer l'installation :

1. **Purger les artefacts locaux**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   ```
2. **Vérifier l'accès au registre**
   - Exportez un `NPM_TOKEN` valide si le registre est privé.
   - Confirmez que les proxies (`npm config get proxy`/`npm config get https-proxy`) n'interceptent pas les requêtes.
3. **Réinstaller en mode verbeux minimal**
   ```bash
   npm install --progress=false
   ```
   Contrôlez ensuite la présence de `node_modules/.bin/vite` avant d'exécuter `npm run build`.
4. **Escalade en cas d'échec persistant**
   - Récupérez le journal mentionné par npm (ex. `/root/.npm/_logs/...-debug-0.log`).
   - Forcer temporairement le registre public : `npm config set registry https://registry.npmjs.org/`.
   - Contactez l'administrateur du registre si l'accès à certains packages reste interdit.

## Conseils pour les environnements CI

- Configurez les variables d'environnement nécessaires (comme `NPM_TOKEN`) si votre CI requiert une authentification pour accéder au registre npm.
- Exécutez `npm ci` pour des installations reproductibles lors des workflows automatisés.
- Ajoutez une étape qui copie `node_modules/qr-scanner/qr-scanner-worker.min.js` vers `public/` si votre environnement ne lance pas automatiquement le script `postinstall`.

Ces instructions garantissent que l'installation des dépendances se déroule correctement et que les scripts d'outillage peuvent être exécutés sans erreur.

## Que signifient les sorties des scripts utilitaires ?

Après l'installation, les commandes affichent plusieurs avertissements/erreurs liés au code historique du projet. Voici comment les interpréter et quoi faire :

| Commande | Sortie observée | Action recommandée |
| --- | --- | --- |
| `npm run lint` | <small>Avertissement `@typescript-eslint/typescript-estree` sur TypeScript 5.9, suivi d'erreurs (`no-empty`, `consistent-type-definitions`, etc.)</small> | Le dépôt contient beaucoup d'anciens fichiers JS/TS qui violent les règles strictes actuelles. Pour contrôler seulement vos changements React/Vite, ciblez le dossier concerné, par exemple&nbsp;:`npm run lint -- src/features`. Vous pouvez également lever l'avertissement TypeScript en épinglant la version `npm install --save-dev typescript@5.5.4`. |
| `npm run format` | <small>Liste de fichiers « Code style issues found »</small> | La commande tourne en mode `--check`. Pour corriger automatiquement, relancez `npm run format -- --write` puis validez les fichiers pertinents. |
| `npm run typecheck` | <small>Erreurs dans `src/features/qr/routes/PoiMarket.tsx` et `src/features/qr/routes/QrHub.tsx`</small> | Ces erreurs existaient déjà avant votre intervention (typage incomplet des features QR). Le build Vite reste fonctionnel. Notez-les pour une dette technique future, mais elles n'empêchent pas la publication. |
| `npm run build` | <small>Compilation Vite + avertissements éventuels</small> | Après correction des erreurs bloquantes (ex. absence de `showCTA`), la commande doit aboutir avec un résumé des fichiers générés dans `dist/`. |

> ℹ️ Pour exécuter un pipeline CI minimal malgré la dette technique, lancez uniquement `npm run build`. Ajoutez `npm run lint -- src/features` si vous travaillez sur les modules modernes.

## Déployer manuellement sur GitHub Pages

1. **Mettre à jour la configuration locale**  
   Assurez-vous que `index.html` contient bien l'enregistrement du service worker via `import.meta.env.BASE_URL` (déjà commité).

2. **Installer et construire le site**  
   ```bash
   npm install
   npm run build
   ```
   Le dossier `dist/` contient alors la version statique à publier.

3. **Préparer une branche `gh-pages`**  
   - Créez-la si besoin : `git checkout -B gh-pages`.
   - Supprimez tout sauf le contenu de `dist/` (par exemple via `git rm -r .` puis `cp -R dist/* .`).
   - Commitez le résultat (`git add . && git commit -m "build: publish"`).

4. **Pousser la publication**  
   ```bash
   git push -u origin gh-pages
   ```

5. **Configurer GitHub Pages**  
   Dans *Settings → Pages*, sélectionnez la branche `gh-pages` et le dossier racine (`/`). Sauvegardez.

6. **Tester sur iPhone**  
   Ouvrez l'URL `https://<votre-utilisateur>.github.io/<nom-du-depot>/` dans Safari, puis utilisez **Partager → Ajouter à l’écran d’accueil** pour installer la PWA.

> 💡 Alternative : vous pouvez aussi garder le build dans `main` en copiant `dist/` vers un dossier `docs/` et en configurant Pages sur `main` + `docs/`.

## Pipelines automatisés & nouvelles branches

- La version Node de référence est définie dans [`.nvmrc`](./.nvmrc) (22.19.0). Pensez à exécuter `nvm use` avant toute commande `npm`.
- Les workflows GitHub Actions se trouvent dans [`.github/workflows/`](./.github/workflows) :
  - **CI** : lint, typecheck et build sur chaque push/PR.
  - **Preview Pages** : build + déploiement temporaire pour chaque Pull Request.
  - **Deploy Pages** : publication automatique sur GitHub Pages lorsqu'on pousse dans `version-1.0`.
- Dans l’interface GitHub, configurez *Settings → Pages → Source = GitHub Actions* et protégez la branche `version-1.0` (PR obligatoire + workflows verts) ; optionnellement, protégez aussi `branche-test`.

## Processus "dev → preview → prod"

1. Travaillez sur `branche-test` ou une branche dérivée, en respectant la version Node 22.
2. Ouvrez une Pull Request vers `version-1.0`. La CI et le déploiement de preview doivent être verts avant merge.
3. La fusion déclenche le workflow **Deploy Pages** qui publie `dist/` sur la page `https://<org>.github.io/Hirundu1.1-/`.
4. Réalisez un smoke test post-déploiement (chargement initial, navigation, QR/caméra, refresh sur sous-page grâce à HashRouter, vérification des assets).
5. En cas d'incident, utilisez la branche/tag de sauvegarde `backup-YYYYMMDD-HHMM` et suivez le [runbook de release](./README_RELEASE.md) pour un rollback contrôlé.

Tout futur déploiement doit passer par une PR approuvée et des checks verts. Aucune mise en production directe via `git push` n’est tolérée.
