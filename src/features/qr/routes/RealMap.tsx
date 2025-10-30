import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LatLngExpression, LatLngTuple } from "leaflet";
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

  const handleBack = () => {
    try {
      window.dispatchEvent(new CustomEvent("salento:return", { detail: { from: key } }));
    } catch (error) {
      console.warn("Échec de la notification de retour", error);
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/qr");
    }
  };

  return (
    <div className="real-map">
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
          <Marker key={poi.id} position={[poi.lat, poi.lng]}>
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

      <button type="button" className="real-map__back" onClick={handleBack}>
        ↩️ Retour à l’espace QR
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
