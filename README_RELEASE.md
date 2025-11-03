# Runbook de publication Hirundu

## 1. Préparer une release
1. Assurez-vous d'être sur la branche `branche-test` à jour :
   ```bash
   git checkout branche-test
   git pull --ff-only
   ```
2. Vérifiez que l'environnement Node correspond au fichier [`.nvmrc`](./.nvmrc) (Node 22.19.0) :
   ```bash
   nvm use
   node -v # doit afficher v22.x
   ```
3. Installez les dépendances puis construisez le bundle :
   ```bash
   npm ci
   npm run build
   ```
   La sortie statique est générée dans `dist/`.

## 2. Ouvrir la Pull Request de déploiement
1. Créez une nouvelle branche à partir de `branche-test` si vous avez besoin d'ajustements de dernière minute.
2. Commitez puis poussez les changements :
   ```bash
   git push -u origin ma-branche
   ```
3. Ouvrez une PR intitulée `Release : publier branche-test en prod` vers `version-1.0`.
4. Attendez que les workflows **CI** et **Preview Pages** passent au vert.
5. Demandez les revues nécessaires, puis mergez la PR une fois validée.

## 3. Déploiement automatique sur GitHub Pages
- La fusion dans `version-1.0` déclenche automatiquement le workflow **Deploy Pages** qui publie le dossier `dist/` sur GitHub Pages.
- Vérifiez dans *Settings → Pages* que la source est bien configurée sur **GitHub Actions**.
- Une fois le job terminé, ouvrez l'URL `https://<org>.github.io/Hirundu1.1-/` et réalisez un smoke test rapide (voir §5).

## 4. Rollback / Hotfix
1. En cas de souci, partez de la branche/tag de sauvegarde créée avant le déploiement (format `backup-YYYYMMDD-HHMM`).
2. Créez une branche hotfix à partir de cette sauvegarde :
   ```bash
   git checkout -b hotfix/<date> backup-YYYYMMDD-HHMM
   ```
3. Appliquez la correction minimale, exécutez `npm ci && npm run build`, puis ouvrez une PR vers `version-1.0`.
4. Une fois mergée, surveillez le workflow Pages et refaites un smoke test.

## 5. Checklist de validation post-déploiement
- ✅ Chargement initial sans écran blanc / erreurs console.
- ✅ Navigation : accueil → "Lancer la chasse" → transitions → bonus → QR/caméra.
- ✅ Reload sur une sous-page (HashRouter) sans 404.
- ✅ Assets et images chargés correctement grâce à `base: "/Hirundu1.1-/"`.
- ✅ (Si PWA) : service worker mis à jour, pas de cache bloquant.

Documentez tout écart ou incident et ouvrez une issue/PR de suivi si nécessaire.
