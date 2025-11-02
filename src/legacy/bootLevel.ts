const boots = {
  1: () => import("../game.js"),
  2: () => import("../levels/level2/level2_game.js"),
  3: () => import("../levels/level3/level3_game.js"),
} as const;

const starters = {
  1: (mod: Record<string, unknown>) =>
    typeof mod.startLevel1 === "function"
      ? (mod.startLevel1 as () => void)()
      : typeof mod.boot === "function"
      ? (mod.boot as () => void)()
      : typeof mod.start === "function"
      ? (mod.start as () => void)()
      : undefined,
  2: (mod: Record<string, unknown>) =>
    typeof mod.startLevel2 === "function"
      ? (mod.startLevel2 as () => void)()
      : typeof mod.boot === "function"
      ? (mod.boot as () => void)()
      : typeof mod.start === "function"
      ? (mod.start as () => void)()
      : undefined,
  3: (mod: Record<string, unknown>) =>
    typeof mod.startLevel3 === "function"
      ? (mod.startLevel3 as () => void)()
      : typeof mod.boot === "function"
      ? (mod.boot as () => void)()
      : typeof mod.start === "function"
      ? (mod.start as () => void)()
      : undefined,
} as const;

export type LegacyLevelId = 1 | 2 | 3;

const FALLBACK_LEVEL: LegacyLevelId = 1;

function normalizeLevel(level: number | string | null | undefined): LegacyLevelId {
  const numeric = Number(level);
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return 1;
}

export async function bootLegacyLevel(level: number | string | null | undefined): Promise<void> {
  const normalized = normalizeLevel(level);
  const loader = boots[normalized] ?? boots[FALLBACK_LEVEL];

  try {
    const mod = await loader();
    const start = starters[normalized] ?? starters[FALLBACK_LEVEL];
    start(mod);
  } catch (error) {
    console.error("Level boot error", error);
    if (normalized !== FALLBACK_LEVEL) {
      try {
        const mod = await boots[FALLBACK_LEVEL]();
        starters[FALLBACK_LEVEL](mod);
      } catch (fallbackError) {
        console.error("Fallback level boot failed", fallbackError);
        alert("Erreur de chargement du niveau");
      }
    } else {
      alert("Erreur de chargement du niveau");
    }
  }
}

export function getNextLevelId(current: LegacyLevelId): LegacyLevelId | null {
  if (current === 1) return 2;
  if (current === 2) return 3;
  return null;
}
