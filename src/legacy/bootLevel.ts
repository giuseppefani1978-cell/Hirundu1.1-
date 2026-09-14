const boots = {
  1: () => import("../game.js"),
  2: () => import("../levels/level2/level2_game.js"),
  3: () => import("../levels/level3/level3_game.js"),
  4: () => import("../levels/level4/level4_game.js"),
  5: () => import("../levels/level5/level5_game.js"),
  6: () => import("../levels/level6/level6_game.js"),
} as const;

export type LegacyLevelId = 1 | 2 | 3 | 4 | 5 | 6;

function normalizeLevel(level: number | string | null | undefined): LegacyLevelId {
  const numeric = Number(level);
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  if (numeric === 4) return 4;
  if (numeric === 5) return 5;
  if (numeric === 6) return 6;
  return 1;
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

export function getNextLevelId(current: LegacyLevelId): LegacyLevelId | null {
  if (current === 1) return 2;
  if (current === 2) return 3;
  if (current === 3) return 4;
  if (current === 4) return 5;
  if (current === 5) return 6;
  return null;
}
