# HIRUNDU production deployment

## Production source

The public game at `https://giuseppefani1978-cell.github.io/Hirundu1.1-/` is intended to be published from `main` through:

- `.github/workflows/pages-main-test.yml`
- GitHub Actions Pages
- `actions/deploy-pages`

The legacy `publish-main-pages.yml` workflow is intentionally disabled and must not write to `gh-pages`.

## Required gates before deployment

The production workflow must succeed in this order:

1. `npm ci`
2. `npm test`
3. `npm run typecheck`
4. `npm run lint`
5. `npm run build`

If any step fails, the Pages artifact is not uploaded and production is not deployed.

## Path and SPA requirements

The application keeps Vite base `/Hirundu1.1-/`.

The deployment must preserve:

- generated assets under `/Hirundu1.1-/`
- `manifest.webmanifest`
- the startup cinematic assets
- HashRouter navigation
- `404.html` copied from `index.html`
- `.nojekyll`

## Build identity

Every production artifact contains `build-info.json` with:

- the source commit SHA
- the GitHub Actions run ID
- the UTC build timestamp

This makes the served build traceable without changing gameplay code.

## Rollback

Action 02 starts from production commit:

`7d739ac290c2549edaa5051f1f67982d8f2d3f3c`

Rollback reference:

`backup/pre-action02-pages-2026-09-29`

If the single Pages pipeline fails after an approved merge, restore the previous workflow files from that backup branch or revert the Action 02 commit. Do not rewrite game assets or player data as part of a deployment rollback.

## Scope

This deployment change does not modify gameplay, cards, progression, languages, music, framing, mini-games, or the startup cinematic.
