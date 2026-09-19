import { bt, LANG } from "../i18n/bonusLocale";
import { copy } from '../../../ui/copy.js';
import { passportCopy as pc } from '../passport/passportCopy';
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

import { BONUS_MAPS, type BonusKey, type BonusMapConfig } from "../../bonus/bonusData";
import { getEnrichedPois, type EnrichedPoi } from "../services/pois";
import { findPartnerById, getPartnerVerificationStatus, type Partner } from "../services/partners";
import {
  PASSPORT_EVENT,
  PASSPORT_STORAGE_KEY,
  getDeclaredVisitedFor,
  getQrValidatedFor,
  isBrowserEnvironment,
  isMapConsulted,
  markMapConsulted,
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

function openExternalDirections(lat: number, lng: number, label: string): void {
  const destination = `${lat},${lng}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  try {
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch (error) {
    console.warn(`Impossible d’ouvrir l’itinéraire vers ${label}`, error);
  }
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

export default function RealMap({ passportOnly = false }: { passportOnly?: boolean }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const key = (id?.toLowerCase() as BonusKey) || "otranto";
  const cfg: BonusMapConfig = BONUS_MAPS[key] ?? BONUS_MAPS.otranto;

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
  const radiusKm = cfg.radiusKm ?? RADIUS_KM;
  const inner = circleToPolygon(center[0], center[1], radiusKm);
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
        qrValidatedPoiIds: passport.qrValidated,
        pois: relevantPois,
      }),
    [itinerary, passport.qrValidated, relevantPois]
  );

  useEffect(() => {
    if (!passportOnly) markMapConsulted(key);
  }, [key, passportOnly]);

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

    navigate("/bonus");
  };

  if (passportOnly) return (
    <main className="real-map passport-page" style={{maxWidth:840,margin:'0 auto',padding:20}}>
      <nav className="real-map__actions passport-page__navigation">
        <button className="app-button passport-page__return" onClick={goToBonusHub}>← {copy.bonus}</button>
        {(['otranto','gallipoli','lecce','adriatico','capo','arneo','nardo','messapia','itria'] as const).map((city) => {
          const step = itinerary.find((item) => item.key === city);
          const completed = Boolean(step?.completed);
          const available = Boolean(step?.available || completed);
          const active = key === city;
          const className = [
            "app-button",
            "passport-page__city-tab",
            active ? "passport-page__city-tab--active" : "",
            completed ? "passport-page__city-tab--completed" : "",
            !available ? "passport-page__city-tab--locked" : "",
          ].filter(Boolean).join(" ");

          return (
            <button
              key={city}
              className={className}
              aria-pressed={active}
              data-status={completed ? "completed" : available ? "available" : "locked"}
              onClick={() => navigate(`/passport/${city}`)}
            >
              <span className="passport-page__city-label">{BONUS_MAPS[city].title}</span>
              <span className="passport-page__city-status" aria-hidden>
                {completed ? "✓" : active ? "•" : ""}
              </span>
            </button>
          );
        })}
      </nav>
      <PassportSalentino
        mapTitle={cfg.title}
        itinerary={itinerary}
        pois={relevantPois}
        qrValidatedPoiIds={passport.qrValidated}
        declaredVisitedPoiIds={passport.declaredVisited}
        mapConsulted={passport.consulted}
        progress={passportProgress}
      />
      <nav className="real-map__actions">
        <button className="app-button" onClick={() => navigate('/qr')}>{pc.scan}</button>
        <button className="app-button" onClick={() => navigate(`/poi/${key}/realmap`)}>{copy.maps}</button>
      </nav>
    </main>
  );

  return (
    <div className="real-map">
      <nav className="real-map__actions" aria-label={bt("Navigation bonus")}>
        <button
          type="button"
          className="real-map__action-button real-map__action-button--bonus"
          onClick={goToBonusHub}
        >🎁 {bt("Voir les bonus")}</button>
        <button
          type="button"
          className="real-map__action-button real-map__action-button--market"
          onClick={goToMarket}
        >🛒 {bt("Marché & Souvenirs")}</button>
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
            {bt("Carte bonus")}
            <br />
            <button
              type="button"
              className="app-button app-button--ghost"
              onClick={() => openExternalDirections(cfg.lat, cfg.lng, cfg.title)}
            >
              🧭 {bt("Itinéraire")} · {cfg.title}
            </button>
          </Popup>
        </Marker>

        {relevantPois.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={TARANTULA_POI_ICON}>
            <Popup>
              <div className="real-map__popup">
                <strong>{poi.label}</strong>
                {poi.partner ? <div>{poi.partner.name}</div> : null}
                {poi.partner ? (
                  <div className="real-map__popup-meta">
                    {getPartnerVerificationStatus(poi.partner) === "confirmed"
                      ? `Partenaire confirmé · QR : ${poi.partner.qr_id}`
                      : getPartnerVerificationStatus(poi.partner) === "listed"
                        ? "Commerce référencé · partenariat non confirmé"
                        : "Démonstration · aucun partenariat ni avantage réel confirmé"}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="app-button app-button--ghost"
                  onClick={() => openExternalDirections(poi.lat, poi.lng, poi.label)}
                >
                  🧭 {bt("Itinéraire")} · {poi.label}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {standalonePartners.map((partner) => (
          <Marker key={`partner-${partner.id}`} position={[partner.lat, partner.lng]}>
            <Popup>
              <div className="real-map__popup">
                <strong>{partner.name}</strong>
                <div className="real-map__popup-meta">
                  {getPartnerVerificationStatus(partner) === "confirmed"
                    ? `Partenaire confirmé · QR : ${partner.qr_id}`
                    : getPartnerVerificationStatus(partner) === "listed"
                      ? "Commerce référencé · partenariat non confirmé"
                      : "Démonstration · aucun partenariat ni avantage réel confirmé"}
                </div>
                <button
                  type="button"
                  className="app-button app-button--ghost"
                  onClick={() => openExternalDirections(partner.lat, partner.lng, partner.name)}
                >
                  🧭 {bt("Itinéraire")} · {partner.name}
                </button>
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

        <FitAndRestrict lat={center[0]} lng={center[1]} radiusKm={radiusKm} />
      </MapContainer>

      <button type="button" className="real-map__back" onClick={() => navigate(`/passport/${key}`)}>
        📔 {copy.passportOpen}
      </button>
    </div>
  );
}

function filterPoisForMap(ids: string[] | undefined, pois: EnrichedPoi[]): EnrichedPoi[] {
  if (!ids?.length) return [];
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
  qrValidatedPoiIds: Set<string>;
  pois: EnrichedPoi[];
};

type PassportProgress = {
  ratio: number;
  totalPoints: number;
  earnedPoints: number;
  totalPoiCount: number;
  qrValidatedPoiCount: number;
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
  { name: pc.tiers[0], threshold: 0 },
  { name: pc.tiers[1], threshold: 0.15 },
  { name: pc.tiers[2], threshold: 0.3 },
  { name: pc.tiers[3], threshold: 0.5 },
  { name: pc.tiers[4], threshold: 0.7 },
  { name: pc.tiers[5], threshold: 0.9 },
  { name: pc.tiers[6], threshold: 1 },
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
  qrValidated: Set<string>;
  declaredVisited: Set<string>;
  consulted: boolean;
} {
  const allowedKey = useMemo(() => [...poiIds].sort().join("|"), [poiIds]);
  const [qrValidated, setQrValidated] = useState<Set<string>>(() => getQrValidatedFor(mapKey, poiIds));
  const [declaredVisited, setDeclaredVisited] = useState<Set<string>>(() => getDeclaredVisitedFor(mapKey, poiIds));
  const [consulted, setConsulted] = useState(() => isMapConsulted(mapKey));

  useEffect(() => {
    setQrValidated(getQrValidatedFor(mapKey, poiIds));
    setDeclaredVisited(getDeclaredVisitedFor(mapKey, poiIds));
    setConsulted(isMapConsulted(mapKey));
  }, [mapKey, allowedKey, poiIds]);

  useEffect(() => {
    if (!isBrowserEnvironment()) return undefined;
    const sync = () => {
      setQrValidated(getQrValidatedFor(mapKey, poiIds));
      setDeclaredVisited(getDeclaredVisitedFor(mapKey, poiIds));
      setConsulted(isMapConsulted(mapKey));
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

  return { qrValidated, declaredVisited, consulted };
}

function computePassportProgress({
  itinerary,
  qrValidatedPoiIds,
  pois,
}: PassportProgressInput): PassportProgress {
  const totalPoiCount = pois.length;
  const qrValidatedPoiCount = qrValidatedPoiIds.size;
  const totalItinerarySteps = itinerary.length;
  const completedItinerarySteps = itinerary.filter((step) => step.completed).length;

  // Passport validation is real-world QR validation only.
  // Virtual victories remain visible in the itinerary but do not count as proof of a visit.
  const totalPoints = totalPoiCount;
  const earnedPoints = qrValidatedPoiCount;
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
    qrValidatedPoiCount,
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
  qrValidatedPoiIds: Set<string>;
  declaredVisitedPoiIds: Set<string>;
  mapConsulted: boolean;
  progress: PassportProgress;
};

function PassportSalentino({
  mapTitle,
  itinerary,
  pois,
  qrValidatedPoiIds,
  declaredVisitedPoiIds,
  mapConsulted,
  progress,
}: PassportSalentinoProps) {
  const completionPercent = Math.round(progress.ratio * 100);

  return (
    <aside className="real-map__passport" aria-live="polite">
      <header className="real-map__passport-header">
        <h2 className="real-map__passport-title">📔 Passport Salentino</h2>
        <p className="real-map__passport-level">
          {pc.level} : <strong>{progress.level.name}</strong>
        </p>
        <p className="real-map__passport-subtitle">
          {mapTitle} · {pc.points} : {progress.earnedPoints} / {progress.totalPoints}
          {mapConsulted ? ` · ${pc.consulted}` : ""}
        </p>
        <div className="real-map__passport-progress">
          <div className="real-map__passport-progress-bar" aria-hidden>
            <span className="real-map__passport-progress-fill" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="real-map__passport-progress-meta">
            {completionPercent}% {pc.done}
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
        {progress.nextLevel && <p className="real-map__passport-next">{pc.next} : {progress.nextLevel.name} ({progress.pointsToNext})</p>}
      </header>

      <section className="real-map__passport-section">
        <h3>{pc.steps}</h3>
        <ul className="real-map__passport-itinerary">
          {itinerary.map((step) => {
            const status = step.completed
              ? { icon: "✅", label: pc.completed }
              : step.available
                ? { icon: "🧭", label: pc.available }
                : { icon: "🔒", label: pc.locked };
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
        <h3>{pc.visits}</h3>
        <p className="real-map__passport-hint">
          {pc.hint} ({progress.qrValidatedPoiCount}/{progress.totalPoiCount})
        </p>
        <ul className="real-map__passport-pois">
          {pois.map((poi) => {
            const qrValidated = qrValidatedPoiIds.has(poi.id);
            const declared = declaredVisitedPoiIds.has(poi.id);
            const status = qrValidated ? pc.validated : declared ? pc.declared : pc.pending;
            return (
              <li key={poi.id} className="real-map__passport-poi">
                <span
                  className={
                    "real-map__passport-poi-status" +
                    (qrValidated
                      ? " real-map__passport-poi-status--validated"
                      : " real-map__passport-poi-status--pending")
                  }
                  role="img"
                  aria-label={status}
                >
                  {qrValidated ? "✅" : declared ? "📝" : "⌛"}
                </span>
                <div>
                  <strong>{poi.label}</strong>
                  {poi.partner ? (
                    <span className="real-map__passport-poi-partner"> – {poi.partner.name}</span>
                  ) : null}
                  <div className="real-map__passport-poi-state">{status}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
