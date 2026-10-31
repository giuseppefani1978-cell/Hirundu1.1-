import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Vercel publishes the isolated Play build without changing the trip planner", () => {
  const cfg = JSON.parse(read("vercel.json"));
  assert.equal(cfg.framework, "vite");
  assert.equal(cfg.outputDirectory, "dist");
  assert.match(cfg.buildCommand, /--mode play/);
  assert.ok(cfg.redirects.some(x => x.source === "/admin" && x.destination === "/?admin=1"));
  assert.equal(cfg.headers.find(x => x.source === "/(.*)")?.headers.find(h => h.key === "X-Frame-Options")?.value, "DENY");
  const mode = read(".env.play");
  assert.match(mode, /VITE_HIRUNDU_SUPABASE_URL=https:\/\/qlihimhcfsryuhmlmhvn\.supabase\.co/);
  assert.match(mode, /VITE_HIRUNDU_SUPABASE_PUBLISHABLE_KEY=sb_publishable_/);
  assert.ok(mode.split("\n").filter(line => line.startsWith("VITE_")).every(line => !line.includes("cpnjdyhsepytphwlenbg")));
  assert.match(read("src/beta/BetaPortal.tsx"), /location\.pathname/);
});

test("Play deployment never injects the trip planner backend into compiled JavaScript", () => {
  const dist = new URL("../dist/", import.meta.url);
  if (!existsSync(dist)) return; // pre-build npm test; verify again after build
  const assetsDir = new URL("../dist/assets/", import.meta.url);
  const js = readdirSync(assetsDir).filter(x => x.endsWith(".js"))
    .map(x => readFileSync(join(assetsDir.pathname, x), "utf8")).join("\n");
  assert.match(js, /qlihimhcfsryuhmlmhvn/);
  assert.doesNotMatch(js, /cpnjdyhsepytphwlenbg|sb_secret_|service_role/);
});
