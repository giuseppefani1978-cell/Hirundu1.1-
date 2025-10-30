import * as React from "react";
import {
  BONUS_PROGRESS_EVENT,
  readBonusSnapshot,
  type BonusProgressSnapshot,
} from "./bonusStorage";

export function useBonusProgress(): BonusProgressSnapshot {
  const [snapshot, setSnapshot] = React.useState<BonusProgressSnapshot>(() => readBonusSnapshot());

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const update = () => setSnapshot(readBonusSnapshot());

    const onStorage = () => update();
    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    const onBonusUpdate = () => update();

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(BONUS_PROGRESS_EVENT, onBonusUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(BONUS_PROGRESS_EVENT, onBonusUpdate as EventListener);
    };
  }, []);

  return snapshot;
}
