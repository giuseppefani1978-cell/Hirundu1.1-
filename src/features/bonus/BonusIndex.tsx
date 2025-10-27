// src/features/bonus/BonusIndex.tsx
import React from "react";

// On importe le module JS existant (compat TS/JS)
// @ts-ignore
import { BONUS_MAPS, getUnlockedKeys, openBonusMap } from "../../bonus_maps.js";

type BonusKey = keyof typeof BONUS_MAPS;

export default function BonusIndex() {
  const [unlocked, setUnlocked] = React.useState<BonusKey[]>([]);

  // --- lecture + rafraîchissement auto des déblocages ------------------------
  React.useEffect(() => {
    let mounted = true;

    const read = () => {
      try {
        const keys: string[] = getUnlockedKeys();
        if (!mounted) return;
        setUnlocked(
          (keys.filter((k) => BONUS_MAPS[k as BonusKey]) as BonusKey[]) || []
        );
      } catch {
        if (!mounted) return;
        setUnlocked([]);
      }
    };

    // 1) lecture immédiate
    read();

    // 2) écoute cross-onglet (événements storage)
    const onStorage = (e: StorageEvent) => {
      // on ne filtre pas finement : un read() est peu coûteux et sûr
      read();
    };
    window.addEventListener("storage", onStorage);

    // 3) refresh quand l’onglet redevient visible (cas même onglet)
    const onVisible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleOpen = (key: BonusKey) => {
    try {
      openBonusMap(key); // redirige vers /app.html#/poi/:id/realmap (et marque débloqué)
    } catch (e) {
      alert("Impossible d’ouvrir la carte bonus.");
      console.error(e);
    }
  };

  const allKeys = Object.keys(BONUS_MAPS) as BonusKey[];
  const isUnlocked = (k: BonusKey) => unlocked.includes(k);

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 880, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 12px" }}>🎁 Bonus déverrouillés</h1>
      <p style={{ margin: "0 0 18px", opacity: 0.85 }}>
        Ouvre les cartes réelles, retrouve les partenaires et scanne leurs QR.
      </p>

      {unlocked.length === 0 ? (
        <div
          style={{
            background: "#0b1220",
            color: "#fff",
            padding: "14px 16px",
            borderRadius: 12,
          }}
        >
          Aucun bonus débloqué pour l’instant. Gagne des niveaux pour révéler
          les cartes !
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          gap: 14,
        }}
      >
        {allKeys.map((k) => {
          const cfg = BONUS_MAPS[k];
          const unlockedFlag = isUnlocked(k);
          return (
            <div
              key={k}
              style={{
                border: "1px solid rgba(0,0,0,.12)",
                borderRadius: 12,
                padding: 12,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{cfg.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
                {cfg.markerText || "Carte bonus"}
              </div>

              <button
                onClick={() => unlockedFlag && handleOpen(k)}
                disabled={!unlockedFlag}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: 0,
                  borderRadius: 10,
                  cursor: unlockedFlag ? "pointer" : "not-allowed",
                  background: unlockedFlag ? "#0ea5e9" : "#9ca3af",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {unlockedFlag ? "🗺️ Ouvrir la carte" : "🔒 Non débloquée"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
