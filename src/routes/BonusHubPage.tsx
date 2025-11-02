import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BonusIndex from "../features/bonus/BonusIndex";
import QrHub from "../features/qr/routes/QrHub";
import "./BonusHubPage.css";

const TOAST_KEY = "__toast_next__";

function consumeToast(): string | null {
  try {
    const value = window.localStorage.getItem(TOAST_KEY);
    if (!value) return null;
    window.localStorage.removeItem(TOAST_KEY);
    return value;
  } catch {
    return null;
  }
}

function toastMessage(key: string | null): string | null {
  switch (key) {
    case "otranto":
      return "Niveau 1 terminé ! Bonus Otranto débloqué 🎉";
    case "gallipoli":
      return "Niveau 2 terminé ! Bonus Gallipoli débloqué 🎉";
    case "lecce":
      return "Niveau 3 terminé ! Bonus Lecce débloqué 🎉";
    default:
      return null;
  }
}

export default function BonusHubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ bonusId?: string }>();
  const rawNextLevel = (location.state as { nextLevel?: number } | null)?.nextLevel;
  const hasNextLevel = typeof rawNextLevel === "number" && rawNextLevel >= 1;
  const nextLevel = hasNextLevel
    ? Math.max(1, Math.min(3, rawNextLevel ?? 1))
    : 3;
  const [toastKey, setToastKey] = useState<string | null>(() => consumeToast());

  useEffect(() => {
    if (location.state && (location.state as { unlockedKey?: string }).unlockedKey) {
      const unlocked = (location.state as { unlockedKey?: string }).unlockedKey ?? null;
      setToastKey(unlocked);
    }
  }, [location.state]);

  const message = useMemo(() => toastMessage(toastKey), [toastKey]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setToastKey(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!params.bonusId) return;
    const normalized = params.bonusId.toLowerCase();
    const selector = `[data-bonus-key="${normalized}"]`;
    const target = document.querySelector(selector);
    if (target && typeof (target as HTMLElement).scrollIntoView === "function") {
      (target as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("bonus-hub-page__card-focus");
      return () => {
        target.classList.remove("bonus-hub-page__card-focus");
      };
    }
    return () => undefined;
  }, [params.bonusId]);

  return (
    <div className="bonus-hub-page">
      {message ? (
        <div className="bonus-hub-page__toast" role="status">
          {message}
        </div>
      ) : null}

      <div className="bonus-hub-page__grid">
        <div className="bonus-hub-page__column bonus-hub-page__column--primary">
          <BonusIndex />
        </div>
        <aside className="bonus-hub-page__column bonus-hub-page__column--qr" aria-label="Scanner QR">
          <div className="bonus-hub-page__panel-header">
            <h2>📷 Scanner depuis la zone bonus</h2>
            <p>
              Scanne les QR codes fournis sur les plans Leaflet d’Otranto, Gallipoli et Lecce pour
              valider les POI partenaires.
            </p>
            {hasNextLevel ? (
              <p className="bonus-hub-page__panel-next">
                Prochaine étape débloquée&nbsp;: niveau {nextLevel} de la chasse.
              </p>
            ) : null}
            <button
              type="button"
              className="app-button app-button--ghost"
              onClick={() => navigate(`/level/${nextLevel}`)}
            >
              ↩︎ Retour au jeu (niv. {nextLevel})
            </button>
          </div>
          <QrHub />
        </aside>
      </div>
    </div>
  );
}
