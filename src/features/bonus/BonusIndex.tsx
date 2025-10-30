import React from "react";
import { BONUS_MAPS, type BonusKey } from "./bonusData";
import { openBonusMap } from "./bonusNavigation";
import { useBonusProgress } from "./useBonusProgress";
import type { ItineraryStep } from "./bonusStorage";
import "./BonusIndex.css";

const ALL_KEYS = Object.keys(BONUS_MAPS) as BonusKey[];

export default function BonusIndex() {
  const { unlockedKeys, resumeTarget, itinerary } = useBonusProgress();
  const unlockedSet = React.useMemo(() => new Set(unlockedKeys), [unlockedKeys]);
  const nextLevel = resumeTarget?.id ?? 1;

  const handleOpen = (key: BonusKey) => {
    try {
      openBonusMap(key);
    } catch (error) {
      console.error(error);
      if (typeof window !== "undefined") {
        window.alert?.("Impossible d’ouvrir la carte bonus.");
      }
    }
  };

  const goHunt = () => {
    if (typeof window === "undefined") return;
    const level = Math.max(1, Math.min(3, nextLevel));
    window.location.assign(`/index.html?level=${level}`);
  };

  return (
    <section className="app-section bonus-index__root">
      <header className="bonus-index__header">
        <div>
          <h1 className="bonus-index__title">🎁 Bonus déverrouillés</h1>
          <p className="bonus-index__lead">
            Suis ta progression dans la chasse et ouvre les cartes partenaires débloquées.
          </p>
        </div>
        <button
          onClick={goHunt}
          className="app-button app-button--dark bonus-index__resume-button"
          title={`Reprendre la chasse (niv. ${nextLevel})`}
        >
          ↩︎ Reprendre la chasse (niv. {nextLevel})
        </button>
      </header>

      <Itinerary steps={itinerary} />

      {unlockedKeys.length === 0 ? (
        <div className="surface-card bonus-index__empty" role="status">
          Aucun bonus débloqué pour l’instant. Gagne des niveaux pour révéler les cartes !
        </div>
      ) : null}

      <div className="bonus-index__grid">
        {ALL_KEYS.map((key) => {
          const cfg = BONUS_MAPS[key];
          const unlocked = unlockedSet.has(key);
          const buttonClass = unlocked
            ? "app-button bonus-index__card-button"
            : "app-button bonus-index__card-button bonus-index__card-button--locked";
          return (
            <article key={key} className="surface-card bonus-index__card">
              <div className="bonus-index__card-title">{cfg.title}</div>
              <div className="bonus-index__card-subtitle">{cfg.markerText || "Carte bonus"}</div>
              <button
                type="button"
                onClick={() => unlocked && handleOpen(key)}
                disabled={!unlocked}
                className={buttonClass}
              >
                {unlocked ? "🗺️ Ouvrir la carte" : "🔒 Non débloquée"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Itinerary({ steps }: { steps: ItineraryStep[] }) {
  return (
    <div className="surface-card bonus-index__itinerary">
      {steps.map((step) => (
        <ItineraryCard key={step.id} step={step} />
      ))}
    </div>
  );
}

function ItineraryCard({ step }: { step: ItineraryStep }) {
  const statusLabel = step.completed
    ? "Terminé — rejouer"
    : step.available
    ? "Prochaine étape — jouer"
    : "À déverrouiller";
  const cardClass = [
    "bonus-index__itinerary-card",
    step.completed ? "bonus-index__itinerary-card--done" : "",
    !step.available ? "bonus-index__itinerary-card--locked" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const numberClass = [
    "bonus-index__itinerary-number",
    step.completed ? "bonus-index__itinerary-number--done" : "",
    !step.available ? "bonus-index__itinerary-number--locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className={numberClass}>{step.id}</div>
      <div className="bonus-index__itinerary-content">
        <div className="bonus-index__itinerary-title">
          Niv. {step.id} — {step.name}
        </div>
        <div className="bonus-index__itinerary-status">{statusLabel}</div>
      </div>
    </div>
  );
}
