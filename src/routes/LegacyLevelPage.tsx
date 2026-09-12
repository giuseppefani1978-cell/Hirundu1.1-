import { markLevelWin, unlockBonus, type BonusProgressEntry } from '../features/bonus/bonusStorage';
import React from "react";
import { disposeBattle } from "../battle.js";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import LegacyGameShell from "../legacy/LegacyGameShell";
import {
  bootLegacyLevel,
  getNextLevelId,
  type LegacyLevelId,
} from "../legacy/bootLevel";
import { initLegacyChrome } from "../legacy/initLegacyChrome";
import { removeVictoryCTA } from "../bonus_transition.js";
import "./LegacyLevelPage.css";

const LEVEL_EVENTS: Record<LegacyLevelId, { bonusKey: string; event: string }> = {
  1: { bonusKey: "otranto", event: "otranto:unlocked" },
  2: { bonusKey: "gallipoli", event: "gallipoli:unlocked" },
  3: { bonusKey: "lecce", event: "lecce:unlocked" },
};

const TOAST_KEY = "__toast_next__";
const DEFAULT_VERSION = "v6 · TEST";

function storeToast(target: string) {
  try {
    window.localStorage.setItem(TOAST_KEY, target);
  } catch {
    // ignore storage issues
  }
}

function parseLevelId(raw: string | undefined): LegacyLevelId {
  const numeric = Number(raw);
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return 1;
}

function useLegacyLevelParam(): LegacyLevelId {
  const params = useParams<{ levelId?: string }>();
  return useMemo(() => parseLevelId(params.levelId), [params.levelId]);
}

export default function LegacyLevelPage() {
  const level = useLegacyLevelParam();
  const location = useLocation();
  const testBattle = new URLSearchParams(location.search).get("test") === "battle";
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const versionLabel =
    (import.meta.env?.VITE_APP_VERSION as string | undefined) ?? DEFAULT_VERSION;

  useEffect(() => {
    try {
      window.APP_VERSION = versionLabel;
    } catch {
      // ignore inability to assign version label
    }
    const cleanBonus = () => document.querySelectorAll('#__bonus_cta, #__otranto_bonus_link, #__gallipoli_bonus_link, #__lecce_bonus_link').forEach(node => node.remove());
    cleanBonus();
    const cleanupChrome = initLegacyChrome();

    let cancelled = false;
    const controller = new AbortController();
    let cleanupLevel: (() => void) | undefined;
    const boot = async () => {
      try {
        cleanupLevel = await bootLegacyLevel(level, controller.signal, { testBattle });
        if (cancelled) cleanupLevel?.();
      } catch (error) {
        console.error("Unable to boot legacy level", error);
      }
    };

    // slight delay to ensure DOM nodes exist
    const raf = window.requestAnimationFrame(() => {
      if (!cancelled) {
        boot();
      }
    });

    const { bonusKey, event } = LEVEL_EVENTS[level];

    let handledWin = false;
    const handleWin = () => {
      if (handledWin || cancelled) return;
      handledWin = true;
      markLevelWin(level);
      unlockBonus(bonusKey as BonusProgressEntry["key"]);
      storeToast(bonusKey);
      const next = getNextLevelId(level);
      navigate(`/bonus/${bonusKey}`, {
        state: { fromLevel: level, nextLevel: next, unlockedKey: bonusKey },
      });
    };

    document.addEventListener(event, handleWin);

    return () => {
      cancelled = true;
      controller.abort();
      cleanupLevel?.();
      disposeBattle();
      window.cancelAnimationFrame(raf);
      document.removeEventListener(event, handleWin);
      cleanupChrome?.();
      cleanBonus();
      removeVictoryCTA();
      try {
        document.body.classList.remove("mode-battle-intro");
        document.body.removeAttribute("data-level-theme");
      } catch {
        // ignore cleanup issues
      }
    };
  }, [level, navigate, testBattle]);

  return (
    <div className="legacy-level-page">
      <LegacyGameShell key={`${level}:${testBattle}`} level={level} ref={canvasRef} versionLabel={versionLabel} />
    </div>
  );
}
