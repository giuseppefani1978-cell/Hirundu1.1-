// src/routes/BonusHubPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import BonusIndex from "../features/bonus/BonusIndex";
import QrHub from "../features/qr/routes/QrHub";
import "./BonusHubPage.css";

const TOAST_KEY = "__toast_next__";

function consumeToast(): string | null {
  try {
    const v = window.localStorage.getItem(TOAST_KEY);
    if (!v) return null;
    window.localStorage.removeItem(TOAST_KEY);
    return v;
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

function stopAllMediaStreams() {
  try {
    const medias = Array.from(
      document.querySelectorAll("video, audio")
    ) as Array<HTMLVideoElement & { srcObject?: MediaStream }>;
    for (const el of medias) {
      const stream = (el as any).srcObject as MediaStream | undefined;
      if (stream?.getTracks) stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      try { (el as any).srcObject = null; el.pause?.(); } catch {}
    }
  } catch {}
}

export default function BonusHubPage() {
  const location = useLocation();
  const params = useParams<{ bonusId?: string }>();

  const rawNextLevel = (location.state as { nextLevel?: number } | null)?.nextLevel;
  const hasNextLevel = typeof rawNextLevel === "number" && rawNextLevel >= 1;
  const nextLevel = hasNextLevel ? Math.max(1, Math.min(3, rawNextLevel ?? 1)) : 3;

  const [toastKey, setToastKey] = useState<string | null>(() => consumeToast());
  const message = useMemo(() => toastMessage(toastKey), [toastKey]);

  useEffect(() => {
    if (location.state && (location.state as { unlockedKey?: string }).unlockedKey) {
      setToastKey((location.state as { unlockedKey?: string }).unlockedKey ?? null);
    }
  }, [location.state]);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setToastKey(null), 4200);
    return () => window.clearTimeout(id);
  }, [message]);

  // Scroll automatique sur une carte bonus ciblée via .../bonus/:bonusId
  useEffect(() => {
    if (!params.bonusId) return;
    const target = document.querySelector(`[data-bonus-key="${params.bonusId.toLowerCase()}"]`);
    if (target && "scrollIntoView" in target) {
      (target as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("bonus-hub-page__card-focus");
      return () => target.classList.remove("bonus-hub-page__card-focus");
    }
  }, [params.bonusId]);

  // Autorise le scroll ici + coupe la caméra à la sortie
  useEffect(() => {
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowY = prev;
      stopAllMediaStreams();
    };
  }, []);

  // ⛔️ Important: on enlève les intercepteurs globaux (click/hashchange)
  // qui bloquaient le onClose du scanner.

  return (
    <div className="bonus-hub-page">
      {message ? <div className="bonus-hub-page__toast" role="status">{message}</div> : null}

      <div className="bonus-hub-page__grid">
        <div className="bonus-hub-page__column bonus-hub-page__column--primary">
          <BonusIndex />
        </div>

        <aside className="bonus-hub-page__column bonus-hub-page__column--qr" aria-label="Scanner QR">
          <div className="bonus-hub-page__panel">
            <header className="bonus-hub-page__panel-header">
              <h2>📷 Scanner depuis la zone bonus</h2>
              <p>
                Scanne les QR codes fournis sur les plans Leaflet d’Otranto, Gallipoli et Lecce pour
                valider les POI partenaires.
              </p>
              {hasNextLevel ? (
                <p className="bonus-hub-page__panel-next">
                  Prochaine étape débloquée : niveau {nextLevel} de la chasse.
                </p>
              ) : null}
            </header>

            <QrHub />
          </div>
        </aside>
      </div>
    </div>
  );
}
