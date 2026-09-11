const boots = {
  1: () => import("../game.js"),
  2: () => import("../levels/level2/level2_game.js"),
  3: () => import("../levels/level3/level3_game.js"),
} as const;

export type LegacyLevelId = 1 | 2 | 3;

function normalizeLevel(level: number | string | null | undefined): LegacyLevelId {
  const numeric = Number(level);
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return 1;
}

export async function bootLegacyLevel(
  level: number | string | null | undefined,
  signal?: AbortSignal,
): Promise<(() => void) | undefined> {
  const normalized = normalizeLevel(level);
  const mod = await boots[normalized]();
  if (signal?.aborted) return;
  const start = (mod as Record<string, unknown>)[`startLevel${normalized}`]
    ?? mod.boot;
  if (typeof start !== "function") throw new Error("Level entrypoint missing");
  const cleanup = start();
  return typeof cleanup === "function" ? cleanup : undefined;
}

export function getNextLevelId(current: LegacyLevelId): LegacyLevelId | null {
  if (current === 1) return 2;
  if (current === 2) return 3;
  return null;
}
