const boots = {
  1: () => import("../game.js"),
  2: () => import("../levels/level2/level2_game.js"),
  3: () => import("../levels/level3/level3_game.js"),
  4: () => import("../levels/level4/level4_game.js"),
  5: () => import("../levels/level5/level5_game.js"),
  6: () => import("../levels/level6/level6_game.js"),
  7: () => import("../levels/level7/level7_game.js"),
  8: () => import("../levels/level8/level8_game.js"),
  9: () => import("../levels/level9/level9_game.js"),
} as const;

export type LegacyLevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function normalizeLevel(level: number | string | null | undefined): LegacyLevelId {
  const numeric = Number(level);
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  if (numeric === 4) return 4;
  if (numeric === 5) return 5;
  if (numeric === 6) return 6;
  if (numeric === 7) return 7;
  if (numeric === 8) return 8;
  if (numeric === 9) return 9;
  return 1;
}

export async function preloadLegacyLevel(level: number | string | null | undefined): Promise<void> {
  const normalized = normalizeLevel(level);
  try { await boots[normalized](); } catch { /* preload is best-effort */ }
}

export async function bootLegacyLevel(
  level: number | string | null | undefined,
  signal?: AbortSignal,
  options: { testBattle?: boolean } = {},
): Promise<(() => void) | undefined> {
  const normalized = normalizeLevel(level);
  const mod = await boots[normalized]();
  if (signal?.aborted) return;
  const start = (mod as Record<string, unknown>)[`startLevel${normalized}`]
    ?? (mod as Record<string, unknown>).boot;
  if (typeof start !== "function") throw new Error("Level entrypoint missing");
  const cleanup = start(options);
  return typeof cleanup === "function" ? cleanup : undefined;
}

const LEVEL_PRELOAD_ASSETS: Partial<Record<LegacyLevelId, string[]>> = {
  1: ["assets/salento-map.PNG","assets/jellyfish_boss.PNG","assets/battle_bg_salento.PNG"],
  2: ["assets/salento-map.PNG","assets/crow.PNG","assets/battle_bg_gallipoli.png"],
  3: ["assets/salento-map.PNG","assets/sputacchina_boss.png","assets/battle_bg_lecce.png"],
  4: ["assets/salento-map.PNG","assets/boss-4.svg","assets/battle_bg_acaya.png"],
  5: ["assets/salento-map.PNG","assets/boss-5.svg","assets/battle_bg_leuca.png"],
  6: ["assets/salento-map.PNG","assets/boss-6.svg","assets/battle_bg_copertino.png"],
  7: ["assets/salento-map.PNG","assets/boss-8.svg","assets/battle_bg_nardo.png"],
  8: ["assets/salento-map.PNG","assets/boss-9.svg","assets/battle_bg_messapia.png"],
  9: ["assets/salento-map.PNG","assets/boss-8.svg","assets/battle_bg_ostuni.png"],
};

function preloadAsset(path: string): void {
  if (typeof window === "undefined" || typeof Image === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = `${import.meta.env.BASE_URL ?? "/"}${path}`.replace(/\/\/{2,}/g, "/");
}

export async function preloadNextLevel(current: LegacyLevelId): Promise<void> {
  const next = getNextLevelId(current);
  if (!next) return;
  await preloadLegacyLevel(next);
  LEVEL_PRELOAD_ASSETS[next]?.forEach(preloadAsset);
}

export function getNextLevelId(current: LegacyLevelId): LegacyLevelId | null {
  if (current === 1) return 2;
  if (current === 2) return 3;
  if (current === 3) return 4;
  if (current === 4) return 5;
  if (current === 5) return 6;
  if (current === 6) return 7;
  if (current === 7) return 8;
  if (current === 8) return 9;
  return null;
}
