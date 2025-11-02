import React from "react";
import { useLocation } from "react-router-dom";
import { BONUS_MAPS, type BonusKey } from "./bonusData";
import { openBonusMap } from "./bonusNavigation";
import { useBonusProgress } from "./useBonusProgress";
import {
  resetBonusProgress,
  type BonusProgressEntry,
  type ItineraryStep,
} from "./bonusStorage";
import "./BonusIndex.css";
import HallOfFameSection from "./HallOfFameSection";

type BonusCardModel = {
  key: BonusKey;
  title: string;
  subtitle: string;
  unlocked: boolean;
  done: boolean;
  status: string;
  isResume: boolean;
};

export default function BonusIndex() {
  const { unlockedKeys, resumeTarget, itinerary, progress } = useBonusProgress();
  const location = useLocation();

  const unlockedSet = React.useMemo(() => new Set(unlockedKeys), [unlockedKeys]);
  const progressByKey = React.useMemo(() => {
    const map = new Map<BonusKey, BonusProgressEntry>();
    progress.forEach((entry) => {
      map.set(entry.key, entry);
    });
    return map;
  }, [progress]);

  const cards = React.useMemo<BonusCardModel[]>(() => {
    return (Object.keys(BONUS_MAPS) as BonusKey[]).map((key) => {
      const cfg = BONUS_MAPS[key];
      const snapshot = progressByKey.get(key);
      const unlocked = unlockedSet.has(key) || !!snapshot?.unlocked;
      const done = !!snapshot?.done;
      const status = done ? "Terminé" : unlocked ? "Débloqué" : "À débloquer";
      return {
        key,
        title: cfg.title,
        subtitle: cfg.markerText || "Carte bonus",
        unlocked,
        done,
        status,
        isResume: resumeTarget?.key === key && unlocked,
      };
    });
  }, [progressByKey, resumeTarget?.key, unlockedSet]);

  const totals = React.useMemo(() => {
    const doneCount = cards.filter((card) => card.done).length;
    const unlockedCount = cards.filter((card) => card.unlocked).length;
    return {
      done: doneCount,
      unlocked: unlockedCount,
      total: cards.length,
    };
  }, [cards]);

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
    window.location.assign(`/index-legacy.html?level=${level}`);
  };

  const handleResetProgress = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm?.(
      "Réinitialiser la progression ? Cela efface les niveaux débloqués, les bonus et le passeport QR. Le Hall of Fame reste inchangé."
    );
    if (!confirmed) {
      return;
    }

    resetBonusProgress();
    window.alert?.(
      "Progression remise à zéro. Tu peux relancer la chasse et saisir un nouveau nom si besoin."
    );
  }, []);

  const highlightHallOfFame = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.has("hof");
  }, [location.search]);

  React.useEffect(() => {
    if (!highlightHallOfFame) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    const { pathname, search, hash } = window.location;
    if (!hash.includes("?hof")) {
      return;
    }

    const cleanedHash = hash.replace("?hof", "");
    if (cleanedHash === hash) {
      return;
    }

    window.history.replaceState(null, "", `${pathname}${search}${cleanedHash}`);
  }, [highlightHallOfFame]);

  return (
    <section className="app-section bonus-index__root">
      <header className="bonus-index__header">
        <div className="bonus-index__header-copy">
          <h1 className="bonus-index__title">🎁 Bonus déverrouillés</h1>
          <p className="bonus-index__lead">
            Suis ta progression dans la chasse au trésor et retrouve les cartes partenaires à
            explorer.
          </p>
          <p className="bonus-index__intro">
            Ouvre les cartes réelles, retrouve les partenaires et scanne leurs QR codes sur place
            pour continuer l’aventure.
          </p>
          <Summary totals={totals} resumeTarget={resumeTarget?.name} />
        </div>
        <div className="bonus-index__actions">
          <button
            onClick={goHunt}
            className="app-button app-button--dark bonus-index__resume-button"
            title={`Reprendre la chasse (niv. ${nextLevel})`}
          >
            ↩︎ Reprendre la chasse (niv. {nextLevel})
          </button>
          <button
            type="button"
            onClick={handleResetProgress}
            className="bonus-index__reset-button"
          >
            🔄 Réinitialiser la progression
          </button>
        </div>
      </header>

      <Itinerary steps={itinerary} activeKey={resumeTarget?.key} />

      {totals.unlocked === 0 ? (
        <div className="surface-card bonus-index__empty" role="status">
          Aucun bonus débloqué pour l’instant. Gagne des niveaux pour révéler les cartes !
        </div>
      ) : null}

      <div className="bonus-index__grid">
        {cards.map((card) => (
          <BonusCard key={card.key} card={card} onOpen={handleOpen} />
        ))}
      </div>

      <HallOfFameSection highlight={highlightHallOfFame} />
    </section>
  );
}

type SummaryProps = {
  totals: { done: number; unlocked: number; total: number };
  resumeTarget?: string;
};

function Summary({ totals, resumeTarget }: SummaryProps) {
  return (
    <div className="bonus-index__summary" role="status" aria-live="polite">
      <span className="bonus-index__summary-badge">
        <span className="bonus-index__summary-count">{totals.done}</span>
        terminés
      </span>
      <span className="bonus-index__summary-divider" aria-hidden="true">
        •
      </span>
      <span>
        {totals.unlocked} carte{totals.unlocked > 1 ? "s" : ""} débloquée{totals.unlocked > 1 ? "s" : ""} sur
        {" "}
        {totals.total}
      </span>
      {resumeTarget ? (
        <span className="bonus-index__summary-next">
          Prochaine étape : <strong>{resumeTarget}</strong>
        </span>
      ) : null}
    </div>
  );
}

type BonusCardProps = {
  card: BonusCardModel;
  onOpen: (key: BonusKey) => void;
};

function BonusCard({ card, onOpen }: BonusCardProps) {
  const buttonClass = card.unlocked
    ? "app-button bonus-index__card-button"
    : "app-button bonus-index__card-button bonus-index__card-button--locked";
  const statusToken = card.done ? "done" : card.unlocked ? "unlocked" : "locked";
  const cardClass = [
    "surface-card",
    "bonus-index__card",
    card.isResume ? "bonus-index__card--resume" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass} aria-live="polite">
      <header className="bonus-index__card-header">
        <div>
          <div className="bonus-index__card-title">{card.title}</div>
          <div className="bonus-index__card-subtitle">{card.subtitle}</div>
        </div>
        <span className="bonus-index__card-status" data-status={statusToken}>
          {card.status}
        </span>
      </header>
      <button
        type="button"
        onClick={() => card.unlocked && onOpen(card.key)}
        disabled={!card.unlocked}
        className={buttonClass}
      >
        {card.unlocked ? "🗺️ Ouvrir la carte" : "🔒 Non débloquée"}
      </button>
    </article>
  );
}

type ItineraryProps = {
  steps: ItineraryStep[];
  activeKey?: BonusKey;
};

function Itinerary({ steps, activeKey }: ItineraryProps) {
  return (
    <div className="surface-card bonus-index__itinerary" aria-label="Progression principale">
      {steps.map((step) => (
        <ItineraryCard
          key={step.id}
          step={step}
          isActive={!step.completed && step.available && step.key === activeKey}
        />
      ))}
    </div>
  );
}

type ItineraryCardProps = {
  step: ItineraryStep;
  isActive: boolean;
};

function ItineraryCard({ step, isActive }: ItineraryCardProps) {
  let statusLabel: string;
  if (step.completed) {
    statusLabel = "Terminé — rejouer";
  } else if (isActive) {
    statusLabel = "Prochaine étape — jouer";
  } else if (step.available) {
    statusLabel = "Disponible";
  } else {
    statusLabel = "À déverrouiller";
  }

  const cardClass = [
    "bonus-index__itinerary-card",
    step.completed ? "bonus-index__itinerary-card--done" : "",
    !step.available ? "bonus-index__itinerary-card--locked" : "",
    isActive ? "bonus-index__itinerary-card--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const numberClass = [
    "bonus-index__itinerary-number",
    step.completed ? "bonus-index__itinerary-number--done" : "",
    !step.available ? "bonus-index__itinerary-number--locked" : "",
    isActive ? "bonus-index__itinerary-number--active" : "",
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
