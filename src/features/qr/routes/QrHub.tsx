// src/features/qr/routes/QrHub.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import QrScanner from "../components/QrScanner";
import QrBadge from "../components/QrBadge";
import { getAllQrScenarios } from "../services/qrScenarios";
import { parseQrPayload, type QRAction } from "../services/qr";
import {
  clearLastScan,
  scanFailed,
  scanStarted,
  scanSucceeded,
  type QrScanRecord,
} from "../state/qrSlice";
import {
  findPartnerById,
  findPartnerByName,
  getAllPartners,
  type PartnerReward,
} from "../services/partners";
import { BONUS_MAPS, type BonusKey } from "../../bonus/bonusData";
import { getEnrichedPois } from "../services/pois";
import { setPoiVisited } from "../passport/passportStorage";
import { useAppDispatch, useAppSelector } from "../../../store";
import "./QrHub.css";

const SCENARIOS = getAllQrScenarios();
const PARTNERS = getAllPartners();
const PARTNER_BY_ID = new Map(PARTNERS.map((p) => [p.id, p]));
const PARTNER_BY_NAME = new Map(PARTNERS.map((p) => [normalizeToken(p.name), p]));

// --- coupe tous les flux média restants (webcam/micro) ---
function stopAllMediaStreamsSafely() {
  try {
    const medias = Array.from(
      document.querySelectorAll("video, audio")
    ) as Array<HTMLVideoElement & { srcObject?: MediaStream }>;
    for (const el of medias) {
      const stream = (el as any).srcObject as MediaStream | undefined;
      if (stream?.getTracks) {
        for (const t of stream.getTracks()) {
          try { t.stop(); } catch {}
        }
      }
      try { (el as any).srcObject = null; el.pause?.(); } catch {}
    }
  } catch {}
}

export default function QrHub() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { lastScan, error, status } = useAppSelector((s) => s.qr);

  const [scannerOpen, setScannerOpen] = useState(false);
  // Remount “dur” du composant scanner à chaque ouverture pour éviter tout overlay zombie.
  const [scannerKey, setScannerKey] = useState(0);

  const enrichedPois = useMemo(() => getEnrichedPois(), []);

  const actionDescriptor = useMemo(() => {
    if (!lastScan) return null;
    return describeAction(lastScan, navigate, enrichedPois);
  }, [lastScan, navigate, enrichedPois]);

  const openScanner = useCallback(() => {
    setScannerKey((k) => k + 1); // force remount
    setScannerOpen(true);
    dispatch(scanStarted());
  }, [dispatch]);

  const closeScanner = useCallback(() => {
    // ferme l’UI
    setScannerOpen(false);
    // coupe tout flux résiduel au cas où
    stopAllMediaStreamsSafely();
    // on efface l'erreur éventuelle pour éviter un bandeau persistant
    if (error) {
      dispatch(clearLastScan());
    }
  }, [dispatch, error]);

  // Verrouille/relâche le scroll de la page quand le scanner est ouvert
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    if (scannerOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    }
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [scannerOpen]);

  // Coupe les médias quand ce composant se démonte
  useEffect(() => () => stopAllMediaStreamsSafely(), []);

  // 🛡️ Filet de sécurité LOCAL (iOS/propagation capricieuse) :
  // quand le scanner est ouvert, on intercepte en capture les taps/clics sur
  // - le bouton .qr-overlay__close
  // - le backdrop .qr-overlay (hors carte)
  // et on force closeScanner() pour que l’overlay s’unmonte toujours.
  useEffect(() => {
    if (!scannerOpen) return;

    const onAnyClose = (ev: Event) => {
      const t = ev.target as HTMLElement | null;
      if (!t) return;

      // si on clique dans la carte, on ignore
      if (t.closest(".qr-overlay__card")) return;

      // croix explicite
      if (t.closest(".qr-overlay__close")) {
        ev.preventDefault();
        ev.stopPropagation();
        closeScanner();
        return;
      }

      // clic/tap sur le backdrop (en dehors de la carte)
      if (t.closest(".qr-overlay")) {
        ev.preventDefault();
        ev.stopPropagation();
        closeScanner();
      }
    };

    document.addEventListener("click", onAnyClose, true);
    document.addEventListener("touchend", onAnyClose, true);
    return () => {
      document.removeEventListener("click", onAnyClose, true);
      document.removeEventListener("touchend", onAnyClose, true);
    };
  }, [scannerOpen, closeScanner]);

  const handlePayload = useCallback(
    (payload: string) => {
      const raw = payload.trim();
      if (!raw) {
        dispatch(scanFailed({ message: "Le QR ne contient pas de valeur exploitable." }));
        return;
      }

      const action = parseQrPayload(raw);
      const record: QrScanRecord = {
        raw,
        action,
        scannedAt: new Date().toISOString(),
      };

      if (action.type === "unknown") {
        dispatch(
          scanFailed({
            message: "Ce QR n’est pas encore reconnu. Vérifie le scénario ou la configuration.",
            raw,
          })
        );
        return;
      }

      dispatch(scanSucceeded(record));

      if (action.type === "partner") {
        markPartnerVisit(action.partnerId, enrichedPois);
      }
      if (action.type === "badge") {
        markBadgeVisit(action.name, enrichedPois);
      }
    },
    [dispatch, enrichedPois]
  );

  const handleScanResult = useCallback(
    (payload: string) => {
      closeScanner();        // ferme l’UI
      handlePayload(payload); // puis traite l’action
    },
    [closeScanner, handlePayload]
  );

  const handleScanError = useCallback(
    (e: Error) => {
      dispatch(scanFailed({ message: e.message }));
    },
    [dispatch]
  );

  const handleScenario = useCallback(
    (payload: string) => {
      handlePayload(payload);
    },
    [handlePayload]
  );

  const resetScan = useCallback(() => {
    dispatch(clearLastScan());
  }, [dispatch]);

  return (
    <section className="app-section qr-hub">
      <header className="qr-hub__header">
        <div className="qr-hub__header-copy">
          <h1 className="qr-hub__title">🔍 Scanner un QR</h1>
          <p className="qr-hub__subtitle">
            Lance le scanner pour lire un code partenaire ou déclenche un scénario fictif pour tester
            les flux de navigation.
          </p>
        </div>
        <div className="qr-hub__header-actions">
          <button type="button" className="app-button app-button--dark" onClick={openScanner}>
            📷 Lancer le scanner
          </button>
          <button type="button" className="app-button app-button--ghost" onClick={resetScan}>
            ♻︎ Réinitialiser
          </button>
        </div>
      </header>

      {lastScan ? (
        <article className="surface-card qr-hub__result" aria-live="polite">
          <div className="qr-hub__result-head">
            <div>
              <h2>Dernier scan</h2>
              <p className="qr-hub__result-meta">
                {formatDate(lastScan.scannedAt)} · {statusLabel(status)}
              </p>
            </div>
            <span className="app-tag">{actionLabel(lastScan.action)}</span>
          </div>
          <code className="qr-hub__result-code">{lastScan.raw}</code>

          {actionDescriptor ? (
            <QrBadge
              icon={actionDescriptor.icon}
              title={actionDescriptor.title}
              subtitle={actionDescriptor.subtitle}
              meta={actionDescriptor.meta}
              tone={actionDescriptor.tone}
              actionLabel={actionDescriptor.actionLabel}
              onAction={actionDescriptor.onAction}
            />
          ) : null}

          <div className="qr-hub__actions">
            <button type="button" className="app-button app-button--success" onClick={openScanner}>
              Scanner encore
            </button>
            <button type="button" className="app-button app-button--ghost" onClick={resetScan}>
              Effacer l’historique
            </button>
          </div>
        </article>
      ) : (
        <article className="surface-card qr-hub__empty" role="status">
          <p>Aucun scan pour l’instant. Lance le lecteur ou choisis un scénario dans la liste.</p>
          <button type="button" className="app-button app-button--dark" onClick={openScanner}>
            📷 Activer le scanner
          </button>
        </article>
      )}

      {error ? (
        <div className="qr-hub__error" role="alert">
          <span aria-hidden>⚠️</span>
          <span>{error}</span>
        </div>
      ) : null}

      <section className="surface-card qr-hub__scenarios" aria-label="QR fictifs disponibles">
        <header className="qr-hub__scenarios-head">
          <h2>Scénarios de test</h2>
          <p>
            Ces QR fictifs déclenchent les différents parcours (carte, marché, badges, partenaires)
            pour valider l’orchestration.
          </p>
        </header>
        <ul className="qr-hub__scenario-list">
          {SCENARIOS.map((scenario) => (
            <li key={scenario.id} className="qr-hub__scenario-item">
              <div>
                <div className="qr-hub__scenario-label">{scenario.label}</div>
                <code className="qr-hub__scenario-code">{scenario.payload}</code>
                {scenario.notes ? (
                  <p className="qr-hub__scenario-notes">{scenario.notes}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="app-button app-button--ghost"
                onClick={() => handleScenario(scenario.payload)}
              >
                ▶︎ Déclencher
              </button>
            </li>
          ))}
        </ul>
      </section>

      {scannerOpen ? (
        <QrScanner
          key={scannerKey}
          onResult={handleScanResult}
          onError={handleScanError}
          onClose={closeScanner}
        />
      ) : null}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string): string {
  switch (status) {
    case "scanning":
      return "Scanner actif";
    case "succeeded":
      return "Succès";
    case "failed":
      return "Erreur";
    default:
      return "En attente";
  }
}

function actionLabel(action: QRAction): string {
  switch (action.type) {
    case "open-otranto-map":
      return "Carte";
    case "open-otranto-market":
      return "Marché";
    case "open-any":
      return "Navigation";
    case "badge":
      return "Badge";
    case "partner":
      return "Partenaire";
    case "unknown":
    default:
      return "Inconnu";
  }
}

type ActionDescriptor = {
  icon: string;
  title: string;
  subtitle?: string;
  meta?: string;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
  actionLabel?: string;
  onAction?: () => void;
};

function describeAction(
  record: QrScanRecord,
  navigate: NavigateFunction,
  pois = getEnrichedPois()
): ActionDescriptor | null {
  const { action } = record;

  switch (action.type) {
    case "open-otranto-map":
      return {
        icon: "🗺️",
        title: "Carte d’Otrante prête à s’ouvrir",
        subtitle: "Navigue sur la carte réelle pour visualiser les partenaires localisés.",
        tone: "info",
        actionLabel: "Voir la carte",
        onAction: () => navigate("/poi/otranto/realmap"),
      };
    case "open-otranto-market":
      return {
        icon: "🛒",
        title: "Accès au marché d’Otrante",
        subtitle: "Consulte la liste des partenaires et de leurs récompenses.",
        tone: "info",
        actionLabel: "Explorer le marché",
        onAction: () => navigate("/poi/otranto/market"),
      };
    case "open-any": {
      const safePath = normalizePath(action.path);
      return {
        icon: "🧭",
        title: "Navigation générique",
        subtitle: `Cible : ${safePath}`,
        tone: "neutral",
        actionLabel: "Suivre le lien",
        onAction: () => navigate(safePath),
      };
    }
    case "badge": {
      const partnerByName = PARTNER_BY_NAME.get(normalizeToken(action.name));
      return {
        icon: "🏅",
        title: `Badge débloqué : ${action.name}`,
        subtitle: partnerByName?.description || "Badge fictif pour valider le flux de progression.",
        meta: partnerByName ? rewardLabel(partnerByName.reward) : undefined,
        tone: "success",
        actionLabel: "Voir les bonus",
        onAction: () => navigate("/bonus"),
      };
    }
    case "partner": {
      const partner = PARTNER_BY_ID.get(action.partnerId) || findPartnerById(action.partnerId);
      const poi = pois.find((entry) => entry.partner?.id === partner?.id);
      return {
        icon: "🤝",
        title: partner ? `${partner.name} scanné !` : "Partenaire reconnu",
        subtitle:
          partner?.description ||
          "Le QR correspond à un partenaire fictif. Vérifie la carte pour valider l’emplacement.",
        meta: partner ? rewardLabel(partner.reward) : undefined,
        tone: "success",
        actionLabel: "Voir sur la carte",
        onAction: () => navigate(`/poi/${encodeURIComponent(resolveBonusKey(poi))}/realmap`),
      };
    }
    case "unknown":
      return {
        icon: "❓",
        title: "QR inconnu",
        subtitle:
          "Ajoute ce QR dans le fichier des scénarios ou complète le service d’interprétation.",
        tone: "warning",
      };
    default:
      return null;
  }
}

function markPartnerVisit(partnerId: string, pois: ReturnType<typeof getEnrichedPois>): void {
  const partner = PARTNER_BY_ID.get(partnerId) || findPartnerById(partnerId);
  if (!partner) return;

  const targets = pois.filter((poi) => poi.partner?.id === partner.id);
  applyPassportVisits(targets);
}

function markBadgeVisit(name: string, pois: ReturnType<typeof getEnrichedPois>): void {
  const normalizedName = normalizeToken(name);
  if (!normalizedName) return;

  const partner = PARTNER_BY_NAME.get(normalizeToken(name)) || findPartnerByName(name);
  if (partner) {
    markPartnerVisit(partner.id, pois);
    return;
  }

  const targets = pois.filter((poi) => normalizeToken(poi.label) === normalizedName);
  applyPassportVisits(targets);
}

function applyPassportVisits(targets: ReturnType<typeof getEnrichedPois>): void {
  if (!targets.length) return;

  const seen = new Set<string>();
  targets.forEach((poi) => {
    const bonusKey = resolveBonusKey(poi);
    const config = BONUS_MAPS[bonusKey];
    if (!config) return;
    const identifier = `${bonusKey}:${poi.id}`;
    if (seen.has(identifier)) return;
    seen.add(identifier);
    setPoiVisited(bonusKey, poi.id, true, config.poiIds);
  });
}

function rewardLabel(reward: PartnerReward | undefined): string {
  if (!reward) return "Récompense non renseignée";
  switch (reward.type) {
    case "stars":
      return `${reward.value} étoile${reward.value > 1 ? "s" : ""}`;
    case "score":
      return `${reward.value} points d’expérience`;
    case "bonus":
      return `${reward.value}× ${reward.item}`;
    default:
      return "Récompense partenaire";
  }
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  if (trimmed.startsWith("//")) return `/${trimmed.slice(2)}`;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

function resolveBonusKey(poi: ReturnType<typeof getEnrichedPois>[number] | undefined): BonusKey {
  if (!poi) return "otranto";
  const entries = Object.entries(BONUS_MAPS) as [BonusKey, (typeof BONUS_MAPS)[BonusKey]][];
  const found = entries.find(([, cfg]) => cfg.poiIds.includes(poi.id));
  return found?.[0] ?? "otranto";
}

function normalizeToken(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}
