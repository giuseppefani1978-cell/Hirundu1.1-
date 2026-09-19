import { cp, mkdir, rm, writeFile } from "node:fs/promises";

// Keep the GitHub Pages base path so the test copy uses identical game assets.
await rm("build", { recursive: true, force: true });
await mkdir("build/Hirundu1.1-", { recursive: true });
await cp("dist", "build/Hirundu1.1-", { recursive: true });
await writeFile("build/index.html", `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HIRUNDU — version de test</title>
<script>location.replace('/Hirundu1.1-/' + location.search + location.hash);</script>
</head><body><a href="/Hirundu1.1-/">Ouvrir HIRUNDU</a></body></html>\n`);
console.log("Test site prepared with the existing GitHub Pages asset paths.");
