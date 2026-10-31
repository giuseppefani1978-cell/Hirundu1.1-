import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("play beta replaces normal game entry with a fail-closed portal", () => {
  const entry = read("src/main.tsx");
  const portal = read("src/beta/BetaPortal.tsx");
  const api = read("src/beta/betaApi.ts");
  assert.match(entry, /BetaPortal/);
  assert.doesNotMatch(entry, /from ["']\.\/app["']/);
  assert.match(portal, /betaSession\(\)/);
  assert.match(portal, /activateBeta\(/);
  assert.match(portal, /React\.lazy/);
  assert.match(api, /beta_backend_not_configured/);
  assert.match(api, /x-hirundu-beta/);
  assert.match(api, /hirundu-play-beta-token-v1/);
  assert.doesNotMatch(api, /aracne-beta-token|cpnjdyhsepytphwlenbg|service_role/);
});

test("Hirundu beta backend has private RLS tables and an explicit admin boundary", () => {
  const sql = read("docs/sql/hirundu-beta-isolated-backend.sql");
  assert.match(sql, /hirundu_private\.invites enable row level security/);
  assert.match(sql, /hirundu_private\.sessions enable row level security/);
  assert.match(sql, /hirundu_private\.feedback enable row level security/);
  assert.match(sql, /revoke all on all tables in schema hirundu_private/);
  assert.match(sql, /not actor\.is_admin/);
  assert.match(sql, /admin_create_invite/);
  assert.match(sql, /admin_revoke_invite/);
  assert.match(sql, /sha256\(convert_to\(token/);
  assert.doesNotMatch(sql, /aracne_private|cpnjdyhsepytphwlenbg/);
});

test("root-domain beta configuration is distinct from old GitHub Pages", () => {
  assert.match(read("vite.config.ts"), /base: "\/"/);
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(manifest.name, "Hirundu — Bêta privée");
  assert.equal(manifest.orientation, "any");
  assert.equal(manifest.scope, "./");
});
