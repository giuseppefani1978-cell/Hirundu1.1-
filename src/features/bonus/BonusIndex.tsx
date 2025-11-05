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

  // ✅ HashRouter-friendly (évite index-legacy.html)
  const goHunt = () => {
    if (typeof window === "undefined") return;
    const level = Math.max(1, Math.min(3, nextLevel));
    // on reste sur la même page et on pousse la route Hash
    if ("hash" in window.location) {
      window.location.hash = `/level/${level}`;
    } else {
      window.location.assign(`#/level/${level}`);
    }
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

          {/* 🔧 lisibilité renforcée sans casser ta CSS */}
          <p
            className="bonus-index__lead"
            style={{ color: "#1f2937", opacity: 1, fontWeight: 600, lineHeight: 1.35 }}
          >
            Suis ta progression dans la chasse au trésor et retrouve les cartes partenaires à
            explorer.
          </p>
          <p
            className="bonus-index__intro"
            style={{ color: "#334155", opacity: 1, lineHeight: 1.45 }}
          >
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
            ⟲ Réinitialiser la progression
          </button>
        </div>
      </header>

      {/* 🆕 Passeport sticky & responsive (n’ajoute aucune dépendance) */}
      <PassportStrip steps={itinerary} activeKey={resumeTarget?.key} />

      {/* Ton Itinerary original est conservé (aucun breaking change) */}
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
  const doneLabel = totals.done === 1 ? "terminé" : "terminés";
  const unlockedPlural = totals.unlocked > 1 ? "s" : "";

  return (
    <div className="bonus-index__summary" role="status" aria-live="polite">
      <span className="bonus-index__summary-badge">
        <span className="bonus-index__summary-count">{totals.done}</span>
        {" "}{doneLabel}
      </span>
      <span className="bonus-index__summary-divider" aria-hidden="true">
        •
      </span>
      <span>
        {totals.unlocked} carte{unlockedPlural} débloquée{unlockedPlural} sur{" "}
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
    <article className={cardClass} aria-live="polite" data-bonus-key={card.key}>
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

/** 🆕 Mini-badges sticky “Passeport”, mobile-first */
function PassportStrip({ steps, activeKey }: ItineraryProps) {
  // styles inline pour ne pas dépendre de nouveaux fichiers CSS
  const wrapStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(255,255,255,0.86)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 8,
    margin: "14px 0 18px",
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "max-content",
    gap: 10,
    overflowX: "auto",
  };
  const badgeStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "28px auto",
    gridTemplateRows: "auto auto",
    columnGap: 10,
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#0f172a",
    textDecoration: "none",
    minWidth: 220,
    fontSize: 14,
  };
  const idxStyleBase: React.CSSProperties = {
    gridRow: "span 2",
    display: "grid",
    placeItems: "center",
    width: 28,
    height: 28,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 14,
    background: "#e2e8f0",
    color: "#0f172a",
  };
  const lblStyle: React.CSSProperties = { fontWeight: 800 };
  const subStyle: React.CSSProperties = { fontSize: 12, color: "#475569" };

  return (
    <nav aria-label="Passeport de progression" style={wrapStyle}>
      {steps.map((s) => {
        const isDone = s.completed;
        const isLocked = !s.available;
        const isActive = !s.completed && s.available && s.key === activeKey;

        // couleurs d’état légères
        let bg = "#f8fafc", border = "#e5e7eb", idxBg = "#e2e8f0", idxColor = "#0f172a";
        if (isDone) { bg = "#ecfdf5"; border = "#a7f3d0"; idxBg = "#10b981"; idxColor = "#fff"; }
        else if (!isLocked && !isDone) { bg = "#eff6ff"; border = "#bfdbfe"; idxBg = "#3b82f6"; idxColor = "#fff"; }
        const badgeS: React.CSSProperties = { ...badgeStyle, background: bg, borderColor: border, opacity: isLocked ? 0.6 : 1 };
        const idxS: React.CSSProperties = { ...idxStyleBase, background: idxBg, color: idxColor };

        return (
          <a
            key={s.id}
            href={isLocked ? undefined : `#/level/${s.id}`}
            aria-disabled={isLocked}
            style={badgeS}
            onClick={(e) => { if (isLocked) e.preventDefault(); }}
          >
            <span style={idxS}>{s.id}</span>
            <span style={lblStyle}>Niv. {s.id} — {s.name}</span>
            <span style={subStyle}>
              {isDone ? "Terminé — rejouer" : isActive ? "Prochaine étape — jouer" : isLocked ? "À déverrouiller" : "Disponible"}
            </span>
          </a>
        );
      })}
    </nav>
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
