import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon, type LatLngExpression, type LatLngTuple } from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { BONUS_MAPS, type BonusKey } from "../../bonus/bonusData";
import { getEnrichedPois, type EnrichedPoi } from "../services/pois";
import { findPartnerById, type Partner } from "../services/partners";
import {
  PASSPORT_EVENT,
  PASSPORT_STORAGE_KEY,
  getVisitedFor,
  isBrowserEnvironment,
} from "../passport/passportStorage";
import { useBonusProgress } from "../../bonus/useBonusProgress";
import type { ItineraryStep } from "../../bonus/bonusStorage";
import tarantulaIconUrl from "../../../assets/tarantula-icon.svg?url";
import "./RealMap.css";

const RADIUS_KM = 30;
const WORLD_RECT: LatLngTuple[] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

function circleToPolygon(
  lat: number,
  lng: number,
  radiusKm: number,
  segments = 128
): LatLngTuple[] {
  const pts: LatLngTuple[] = [];
  const latRad = (lat * Math.PI) / 180;
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.32 * Math.cos(latRad || 1e-6);

  for (let i = 0; i < segments; i += 1) {
    const a = (2 * Math.PI * i) / segments;
    const dLat = (radiusKm * Math.sin(a)) / kmPerDegLat;
    const dLng = (radiusKm * Math.cos(a)) / kmPerDegLng;
    pts.push([lat + dLat, lng + dLng]);
  }
  return pts;
}

function FitAndRestrict({ lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }) {
  const map = useMap();

  useEffect(() => {
    const latRad = (lat * Math.PI) / 180;
    const kmPerDegLat = 110.574;
    const kmPerDegLng = 111.32 * Math.cos(latRad || 1e-6);
    const dLat = radiusKm / kmPerDegLat;
    const dLng = radiusKm / kmPerDegLng;

    const south = lat - dLat;
    const north = lat + dLat;
    const west = lng - dLng;
    const east = lng + dLng;

    const pad = 0.25;
    const bounds: LatLngTuple[] = [
      [south, west],
      [north, east],
    ];
    const boundsPad: LatLngTuple[] = [
      [south - dLat * pad, west - dLng * pad],
      [north + dLat * pad, east + dLng * pad],
    ];

    try {
      map.fitBounds(bounds, { animate: false, padding: [20, 20] });
      map.setMaxBounds(boundsPad);
    } catch (error) {
      console.warn("Impossible d’ajuster les limites de la carte", error);
    }
  }, [lat, lng, radiusKm, map]);

  return null;
}

export default function RealMap() {
  const navigate = useNavigate();
  const { id } = useParams();
  const key = (id?.toLowerCase() as BonusKey) || "otranto";
  const cfg = BONUS_MAPS[key] ?? BONUS_MAPS.otranto;

  const pois = useMemo(() => getEnrichedPois(), []);
  const relevantPois = useMemo(() => filterPoisForMap(cfg.poiIds, pois), [cfg.poiIds, pois]);
  const partners = useMemo(() => enrichPartners(cfg.partnerIds), [cfg.partnerIds]);
  const standalonePartners = useMemo(() => {
    const associated = new Set(
      relevantPois
        .map((poi) => poi.partner?.id)
        .filter((value): value is string => Boolean(value))
    );
    return partners.filter((partner) => !associated.has(partner.id));
  }, [partners, relevantPois]);

  const center: LatLngTuple = [cfg.lat, cfg.lng];
  const inner = circleToPolygon(center[0], center[1], RADIUS_KM);
  const innerHole = [...inner].reverse();
  const polygonWithHole: LatLngExpression[][] = [WORLD_RECT, innerHole];

  // --- derived data (single source of truth)
  const { itinerary } = useBonusProgress();
  const poiIds = useMemo(() => relevantPois.map((poi) => poi.id), [relevantPois]);
  const passport = usePassport(key, poiIds);
  const passportProgress = useMemo(
    () =>
      computePassportProgress({
        itinerary,
        visitedPoiIds: passport.visited,
        pois: relevantPois,
      }),
    [itinerary, passport.visited, relevantPois]
  );

  const goToBonusHub = useCallback(() => {
    navigate("/bonus");
  }, [navigate]);

  const goToMarket = useCallback(() => {
    navigate(`/poi/${encodeURIComponent(key)}/market`);
  }, [navigate, key]);

  const handleBack = () => {
    try {
      window.dispatchEvent(
        new CustomEvent("salento:return", { detail: { from: key, target: "bonus" } })
      );
    } catch (error) {
      console.warn("Échec de la notification de retour", error);
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/bonus");
    }
  };

  return (
    <div className="real-map">
      <nav className="real-map__actions" aria-label="Navigation bonus">
        <button
          type="button"
          className="real-map__action-button real-map__action-button--bonus"
          onClick={goToBonusHub}
        >
          🎁 Voir les bonus
        </button>
        <button
          type="button"
          className="real-map__action-button real-map__action-button--market"
          onClick={goToMarket}
        >
          🛒 Marché &amp; Souvenirs
        </button>
      </nav>
      <MapContainer
        key={key}
        center={center}
        zoom={cfg.zoom ?? 12}
        className="real-map__map"
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center}>
          <Popup>
            <strong>{cfg.title}</strong>
            <br />
            {cfg.markerText || "Carte bonus"}
          </Popup>
        </Marker>

        {relevantPois.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={TARANTULA_POI_ICON}>
            <Popup>
              <div className="real-map__popup">
                <strong>{poi.label}</strong>
                {poi.partner ? <div>{poi.partner.name}</div> : null}
                {poi.partner ? (
                  <div className="real-map__popup-meta">QR : {poi.partner.qr_id}</div>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}

        {standalonePartners.map((partner) => (
          <Marker key={`partner-${partner.id}`} position={[partner.lat, partner.lng]}>
            <Popup>
              <div className="real-map__popup">
                <strong>{partner.name}</strong>
                <div className="real-map__popup-meta">QR : {partner.qr_id}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <Polygon
          positions={polygonWithHole}
          pathOptions={{
            fillColor: "#ffffff",
            fillOpacity: 0.92,
            color: "#ffffff",
            opacity: 0,
          }}
        />

        <FitAndRestrict lat={center[0]} lng={center[1]} radiusKm={RADIUS_KM} />
      </MapContainer>

      <PassportSalentino
        mapTitle={cfg.title}
        itinerary={itinerary}
        pois={relevantPois}
        visitedPoiIds={passport.visited}
        progress={passportProgress}
      />

      <button type="button" className="real-map__back" onClick={handleBack}>
        ↩️ Retour à la page bonus
      </button>
    </div>
  );
}

function filterPoisForMap(ids: string[] | undefined, pois: EnrichedPoi[]): EnrichedPoi[] {
  if (!ids?.length) return pois;
  const set = new Set(ids);
  return pois.filter((poi) => set.has(poi.id));
}

function enrichPartners(ids: string[] | undefined): Partner[] {
  if (!ids?.length) return [];
  return ids
    .map((partnerId) => findPartnerById(partnerId))
    .filter((partner): partner is Partner => Boolean(partner));
}

type PassportProgressInput = {
  itinerary: ItineraryStep[];
  visitedPoiIds: Set<string>;
  pois: EnrichedPoi[];
};

type PassportProgress = {
  ratio: number;
  totalPoints: number;
  earnedPoints: number;
  totalPoiCount: number;
  visitedPoiCount: number;
  totalItinerarySteps: number;
  completedItinerarySteps: number;
  level: PassportLevel;
  nextLevel?: PassportLevel;
  pointsToNext: number;
};

type PassportLevel = {
  name: string;
  threshold: number;
};

const PASSPORT_LEVELS: PassportLevel[] = [
  { name: "Forestier", threshold: 0 },
  { name: "Connaisseur", threshold: 0.15 },
  { name: "Touriste", threshold: 0.3 },
  { name: "Touriste Responsable", threshold: 0.5 },
  { name: "Passioné", threshold: 0.7 },
  { name: "Local", threshold: 0.9 },
  { name: "Salentino 100%", threshold: 1 },
];

const TARANTULA_POI_ICON = new Icon({
  iconUrl: tarantulaIconUrl,
  iconRetinaUrl: tarantulaIconUrl,
  iconSize: [42, 42],
  iconAnchor: [21, 40],
  popupAnchor: [0, -36],
  className: "real-map__poi-icon",
});

function usePassport(mapKey: BonusKey, poiIds: string[]): {
  visited: Set<string>;
} {
  const allowedKey = useMemo(() => [...poiIds].sort().join("|"), [poiIds]);
  const [visited, setVisited] = useState<Set<string>>(() => getVisitedFor(mapKey, poiIds));

  useEffect(() => {
    setVisited(getVisitedFor(mapKey, poiIds));
  }, [mapKey, allowedKey, poiIds]);

  useEffect(() => {
    if (!isBrowserEnvironment()) return undefined;
    const sync = () => {
      setVisited(getVisitedFor(mapKey, poiIds));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== PASSPORT_STORAGE_KEY) return;
      sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PASSPORT_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PASSPORT_EVENT, sync as EventListener);
    };
  }, [mapKey, allowedKey, poiIds]);

  return { visited };
}

function computePassportProgress({
  itinerary,
  visitedPoiIds,
  pois,
}: PassportProgressInput): PassportProgress {
  const totalPoiCount = pois.length;
  const visitedPoiCount = visitedPoiIds.size;
  const totalItinerarySteps = itinerary.length;
  const completedItinerarySteps = itinerary.filter((step) => step.completed).length;

  const totalPoints = totalPoiCount + totalItinerarySteps;
  const earnedPoints = visitedPoiCount + completedItinerarySteps;
  const ratio = totalPoints > 0 ? earnedPoints / totalPoints : 0;

  const level = resolvePassportLevel(ratio);
  const nextLevel = findNextPassportLevel(ratio);

  const pointsToNext = nextLevel
    ? Math.max(0, Math.ceil(nextLevel.threshold * totalPoints) - earnedPoints)
    : 0;

  return {
    ratio,
    totalPoints,
    earnedPoints,
    totalPoiCount,
    visitedPoiCount,
    totalItinerarySteps,
    completedItinerarySteps,
    level,
    nextLevel,
    pointsToNext,
  };
}

function resolvePassportLevel(ratio: number): PassportLevel {
  const normalized = Math.max(0, Math.min(1, ratio));
  let current = PASSPORT_LEVELS[0];
  for (const level of PASSPORT_LEVELS) {
    if (normalized + 1e-6 >= level.threshold) {
      current = level;
    }
  }
  return current;
}

function findNextPassportLevel(ratio: number): PassportLevel | undefined {
  const normalized = Math.max(0, Math.min(1, ratio));
  return PASSPORT_LEVELS.find((level) => level.threshold > normalized + 1e-6);
}

type PassportSalentinoProps = {
  mapTitle: string;
  itinerary: ItineraryStep[];
  pois: EnrichedPoi[];
  visitedPoiIds: Set<string>;
  progress: PassportProgress;
};

function PassportSalentino({
  mapTitle,
  itinerary,
  pois,
  visitedPoiIds,
  progress,
}: PassportSalentinoProps) {
  const completionPercent = Math.round(progress.ratio * 100);
  const hasAnyObjective = progress.totalPoints > 0;
  const canAdvance = !!progress.nextLevel && progress.pointsToNext > 0;
  const awaitingStart = !!progress.nextLevel && !hasAnyObjective;

  return (
    <aside className="real-map__passport" aria-live="polite">
      <header className="real-map__passport-header">
        <h2 className="real-map__passport-title">📔 Passport Salentino</h2>
        <p className="real-map__passport-level">
          Niveau actuel : <strong>{progress.level.name}</strong>
        </p>
        <p className="real-map__passport-subtitle">
          Parcours {mapTitle} – {progress.earnedPoints} point
          {progress.earnedPoints > 1 ? "s" : ""} validé
          {progress.earnedPoints > 1 ? "s" : ""} sur {progress.totalPoints}
        </p>
        <div className="real-map__passport-progress">
          <div className="real-map__passport-progress-bar" aria-hidden>
            <span className="real-map__passport-progress-fill" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="real-map__passport-progress-meta">
            {completionPercent}% complété
          </div>
          <div className="real-map__passport-tiers" aria-hidden>
            {PASSPORT_LEVELS.map((tier) => {
              const isActive = tier.name === progress.level.name;
              return (
                <span
                  key={tier.name}
                  className={[
                    "real-map__passport-tier",
                    isActive ? "real-map__passport-tier--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {tier.name}
                </span>
              );
            })}
          </div>
        </div>
        {progress.nextLevel && canAdvance ? (
          <p className="real-map__passport-next">
            Encore {progress.pointsToNext} validation
            {progress.pointsToNext > 1 ? "s" : ""} pour atteindre {progress.nextLevel.name}.
          </p>
        ) : progress.nextLevel && awaitingStart ? (
          <p className="real-map__passport-next">
            Commence une exploration pour viser {progress.nextLevel.name}.
          </p>
        ) : progress.nextLevel ? (
          <p className="real-map__passport-next">
            Tu es aux portes de {progress.nextLevel.name} !
          </p>
        ) : (
          <p className="real-map__passport-next">Bravo ! Tu es Salentino 100 % 🌟</p>
        )}
      </header>

      <section className="real-map__passport-section">
        <h3>Parcours débloqués</h3>
        <ul className="real-map__passport-itinerary">
          {itinerary.map((step) => {
            const status = step.completed
              ? { icon: "✅", label: "Terminé" }
              : step.available
                ? { icon: "🧭", label: "Disponible" }
                : { icon: "🔒", label: "À débloquer" };
            return (
              <li key={step.id} className="real-map__passport-itinerary-item">
                <span aria-hidden className="real-map__passport-itinerary-icon">
                  {status.icon}
                </span>
                <div>
                  <strong>{step.name}</strong>
                  <div className="real-map__passport-itinerary-status">{status.label}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="real-map__passport-section">
        <h3>Points finaux à valider</h3>
        <p className="real-map__passport-hint">
          Les validations s’activent automatiquement via les QR codes partenaires ({
            progress.visitedPoiCount
          }
          /{progress.totalPoiCount}).
        </p>
        <ul className="real-map__passport-pois">
          {pois.map((poi) => {
            const checked = visitedPoiIds.has(poi.id);
            return (
              <li key={poi.id} className="real-map__passport-poi">
                <span
                  className={
                    "real-map__passport-poi-status" +
                    (checked
                      ? " real-map__passport-poi-status--validated"
                      : " real-map__passport-poi-status--pending")
                  }
                  role="img"
                  aria-label={checked ? "Validé via QR" : "En attente"}
                >
                  {checked ? "✅" : "⌛"}
                </span>
                <div>
                  <strong>{poi.label}</strong>
                  {poi.partner ? (
                    <span className="real-map__passport-poi-partner"> – {poi.partner.name}</span>
                  ) : null}
                  <div className="real-map__passport-poi-state">
                    {checked ? "Validé via QR" : "En attente de validation"}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
