// src/routes/BonusHubPage.tsx
import React, { useEffect, useMemo, useState } from "react";
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

/** Coupe proprement tous les flux média encore actifs (caméra/micro) */
function stopAllMediaStreams() {
  try {
    const medias = Array.from(document.querySelectorAll("video, audio")) as Array<
      HTMLVideoElement & { srcObject?: MediaStream }
    >;
    for (const el of medias) {
      const stream = (el as any).srcObject as MediaStream | undefined;
      if (stream && typeof stream.getTracks === "function") {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
      }
      // Nettoyage de l’élément <video>
      try {
        (el as any).srcObject = null;
        el.pause?.();
      } catch {}
    }
  } catch {}
}

export default function BonusHubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ bonusId?: string }>();

  // On garde la logique existante pour calculer un "nextLevel", même si on n’affiche plus le bouton retour au jeu.
  const rawNextLevel = (location.state as { nextLevel?: number } | null)?.nextLevel;
  const hasNextLevel = typeof rawNextLevel === "number" && rawNextLevel >= 1;
  const nextLevel = hasNextLevel ? Math.max(1, Math.min(3, rawNextLevel ?? 1)) : 3;

  const [toastKey, setToastKey] = useState<string | null>(() => consumeToast());

  // Récupère un éventuel unlockedKey poussé via navigate(..., { state })
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

  // Scroll automatique jusqu’à la carte bonus ciblée via /bonus/:bonusId
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

  // 🔧 Forcer le scroll vertical sur cette page et libérer à la sortie
  useEffect(() => {
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowY = prev;
      // coupe tout flux caméra encore actif quand on quitte la page
      stopAllMediaStreams();
    };
  }, []);

  // 🛡️ Filet de sécurité : intercepter les clics sur des boutons/links « close » du scanner
  // pour empêcher toute navigation "blanche" et couper la caméra proprement.
  useEffect(() => {
    function handleCloseClick(ev: Event) {
      const el = ev.target as HTMLElement | null;
      if (!el) return;
      const closeEl =
        el.closest?.('[data-qr-close], .qr-modal__close, .scanner-close, button[aria-label="Fermer"], button[aria-label="Close"]') ||
        null;
      if (closeEl) {
        // Empêche toute navigation implicite (ex: <a href="...">)
        if ((ev as any).preventDefault) (ev as any).preventDefault();
        ev.stopPropagation?.();

        // Coupe les flux caméra
        stopAllMediaStreams();

        // Si le composant QR gère un overlay/modal, on tente de le masquer proprement
        const modal = document.querySelector(".qr-modal, .qr-overlay") as HTMLElement | null;
        modal?.classList.remove("is-open");

        // Reste sur la même page (aucun navigate()).
      }
    }

    // Capture avant que React/DOM ne propage l’événement
    document.addEventListener("click", handleCloseClick, true);
    return () => document.removeEventListener("click", handleCloseClick, true);
  }, []);

  return (
    <div className="bonus-hub-page" style={{ paddingBottom: 24 }}>
      {message ? (
        <div className="bonus-hub-page__toast" role="status">
          {message}
        </div>
      ) : null}

      <div className="bonus-hub-page__grid">
        <div className="bonus-hub-page__column bonus-hub-page__column--primary">
          <BonusIndex />
        </div>

        <aside
          className="bonus-hub-page__column bonus-hub-page__column--qr"
          aria-label="Scanner QR"
        >
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

            {/* ⛔ Bouton "Retour au jeu (niv. X)" supprimé car redondant/inutile dans ton flow */}
            {/* (la redirection vers le niveau suivant existe déjà ailleurs) */}
          </div>

          {/* QrHub reste inchangé; le "filet de sécurité" gère la fermeture proprement */}
          <QrHub />
        </aside>
      </div>
    </div>
  );
}
