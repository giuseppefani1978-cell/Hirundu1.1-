#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";

//
// 1) Garde-fou versions Node (Vite 5+)
//
(() => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  const ok =
    (major === 20 && minor >= 19) ||
    (major === 22 && minor >= 12) ||
    major > 22;
  if (!ok) {
    console.error(
      "Vite requires Node.js 20.19+ or 22.12+ (detected " +
        process.versions.node +
        ")."
    );
    process.exit(1);
  }
})();

const args = process.argv.slice(2);
// On passe tel quel: "dev" | "build" | "preview" + options
const viteArgs = args.length ? args : ["dev"];

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      stdio: "inherit",
      shell: process.platform === "win32", // compat Windows
      env: process.env,
    });
    child.on("close", (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      else if (code === 0) resolve();
      else reject(new Error(`Command failed: ${cmd} ${cmdArgs.join(" ")} (exit ${code})`));
    });
  });
}

async function main() {
  //
  // 2) Chemin A — utiliser npx (utilise la version locale si installée)
  //
  try {
    await run("npx", ["--yes", "vite", ...viteArgs]);
    return;
  } catch (_) {
    // continue en fallback
  }

  //
  // 3) Chemin B — résoudre le binaire via package.json -> bin.vite
  //
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const vitePkgPath = require.resolve("vite/package.json");
    const vitePkg = require(vitePkgPath);
    const pkgDir = new URL("./", `file://${vitePkgPath}`).pathname;
    const binEntry =
      (typeof vitePkg?.bin === "string" && vitePkg.bin) ||
      (vitePkg?.bin && typeof vitePkg.bin === "object" ? vitePkg.bin.vite : null);

    if (!binEntry) throw new Error("vite package.json has no bin field");
    const viteBin = require.resolve(binEntry, { paths: [pkgDir] });
    await run(process.execPath, [viteBin, ...viteArgs]);
    return;
  } catch (_) {
    // continue en dernier recours
  }

  //
  // 4) Chemin C — legacy fallback 'vite/bin/vite.js'
  //
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const viteBin = require.resolve("vite/bin/vite.js");
    await run(process.execPath, [viteBin, ...viteArgs]);
    return;
  } catch (error) {
    console.error(
      'Unable to find the Vite CLI. Please run "npm install" with internet access.'
    );
    console.error(String(error?.message ?? error));
    process.exit(1);
  }
}

main();
