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

## Conseils pour les environnements CI

- Configurez les variables d'environnement nécessaires (comme `NPM_TOKEN`) si votre CI requiert une authentification pour accéder au registre npm.
- Exécutez `npm ci` pour des installations reproductibles lors des workflows automatisés.
- Ajoutez une étape qui copie `node_modules/qr-scanner/qr-scanner-worker.min.js` vers `public/` si votre environnement ne lance pas automatiquement le script `postinstall`.

Ces instructions garantissent que l'installation des dépendances se déroule correctement et que les scripts d'outillage peuvent être exécutés sans erreur.
