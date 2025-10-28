// src/features/bonus/BonusIndex.tsx
import React from "react";

// @ts-ignore – module JS existant
import { BONUS_MAPS, getUnlockedKeys, openBonusMap, getResumeTarget } from "../../bonus_maps.js";

type BonusKey = keyof typeof BONUS_MAPS;

// ---- utilitaire : niveau à reprendre (1..3), en bouclant sur 1 si tout est fait
function getResumeLevel(): number {
  try {
    const t = getResumeTarget(); // { id, name, key, done, unlocked, href }
    if (t && typeof t.id === "number") return Math.max(1, Math.min(3, t.id));
  } catch {}
  return 1;
}

export default function BonusIndex() {
  const [unlocked, setUnlocked] = React.useState<BonusKey[]>([]);
  const [nextLevel, setNextLevel] = React.useState<number>(getResumeLevel());

  React.useEffect(() => {
    let mounted = true;

    const read = () => {
      try {
        const keys: string[] = getUnlockedKeys();
        if (!mounted) return;
        setUnlocked(
          (keys.filter((k) => BONUS_MAPS[k as BonusKey]) as BonusKey[]) || []
        );
        setNextLevel(getResumeLevel());
      } catch {
        if (!mounted) return;
        setUnlocked([]);
        setNextLevel(getResumeLevel());
      }
    };

    read();
    const onStorage = () => read();
    const onVisible = () => document.visibilityState === "visible" && read();

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleOpen = (key: BonusKey) => {
    try {
      openBonusMap(key);
    } catch (e) {
      alert("Impossible d’ouvrir la carte bonus.");
      console.error(e);
    }
  };

  const allKeys = Object.keys(BONUS_MAPS) as BonusKey[];
  const isUnlocked = (k: BonusKey) => unlocked.includes(k);

  const goHunt = () => {
    const level = Math.max(1, Math.min(3, nextLevel));
    // On conserve le même schéma que ta page de jeu
    window.location.assign(`/index.html?level=${level}`);
  };

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: "0 0 12px" }}>🎁 Bonus déverrouillés</h1>
        <button
          onClick={goHunt}
          style={{
            background: "#0b1020",
            color: "#fff",
            border: 0,
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 800,
            boxShadow: "0 6px 18px rgba(0,0,0,.3)",
            cursor: "pointer",
          }}
          title={`Reprendre la chasse (niv. ${nextLevel})`}
        >
          ↩︎ Reprendre la chasse (niv. {nextLevel})
        </button>
      </div>

      {/* Itinéraire */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 18,
          background: "#fff",
          border: "1px solid rgba(0,0,0,.08)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <ItinCard n={1} done={localStorage.getItem("bonus_otranto_unlocked") === "1"} />
        <ItinCard n={2} done={localStorage.getItem("level2_unlocked") === "true"} />
        <ItinCard n={3} done={localStorage.getItem("level3_unlocked") === "true"} />
      </div>

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
            marginBottom: 14,
          }}
        >
          Aucun bonus débloqué pour l’instant. Gagne des niveaux pour révéler les cartes !
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
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

function ItinCard({ n, done }: { n: number; done: boolean }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: done ? "rgba(16,185,129,.08)" : "rgba(2,132,199,.06)",
        border: "1px solid rgba(0,0,0,.06)",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: done ? "#10b981" : "#0284c7",
          color: "#fff",
          fontWeight: 800,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
        }}
      >
        {n}
      </div>
      <div style={{ fontWeight: 700 }}>
        {`Niv. ${n} — `}{n === 1 ? "Otranto" : n === 2 ? "Gallipoli" : "Lecce"}
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {done ? "Terminé – rejouer" : "Prochaine étape — jouer"}
        </div>
      </div>
    </div>
  );
}
