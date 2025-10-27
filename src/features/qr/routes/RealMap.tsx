// src/features/qr/routes/RealMap.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// @ts-ignore
import { BONUS_MAPS } from "../../../bonus_maps.js";

type BonusKey = keyof typeof BONUS_MAPS;

const RADIUS_KM = 30; // rayon de visibilité
const WORLD_RECT: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

/** Convertit un cercle en polygone (segments ≈ qualité du rond) */
function circleToPolygon(
  lat: number,
  lng: number,
  radiusKm: number,
  segments = 128
): [number, number][] {
  const pts: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.320 * Math.cos(latRad || 1e-6);

  for (let i = 0; i < segments; i++) {
    const a = (2 * Math.PI * i) / segments;
    const dLat = (radiusKm * Math.sin(a)) / kmPerDegLat;
    const dLng = (radiusKm * Math.cos(a)) / kmPerDegLng;
    pts.push([lat + dLat, lng + dLng]);
  }
  return pts;
}

/** Recadre et limite la carte à ~la zone de visibilité (+ padding) */
function FitAndRestrict({
  lat,
  lng,
  radiusKm,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
}) {
  const map = useMap();

  React.useEffect(() => {
    const latRad = (lat * Math.PI) / 180;
    const kmPerDegLat = 110.574;
    const kmPerDegLng = 111.320 * Math.cos(latRad || 1e-6);
    const dLat = radiusKm / kmPerDegLat;
    const dLng = radiusKm / kmPerDegLng;

    const south = lat - dLat;
    const north = lat + dLat;
    const west = lng - dLng;
    const east = lng + dLng;

    const pad = 0.25; // petite marge pour respirer
    const bounds = [
      [south, west],
      [north, east],
    ] as any;
    const boundsPad = [
      [south - dLat * pad, west - dLng * pad],
      [north + dLat * pad, east + dLng * pad],
    ] as any;

    try {
      map.fitBounds(bounds, { animate: false, padding: [20, 20] });
      map.setMaxBounds(boundsPad);
    } catch {}
  }, [lat, lng, radiusKm, map]);

  return null;
}

export default function RealMap() {
  const navigate = useNavigate();
  const { id } = useParams();
  const key = ((id || "otranto").toLowerCase() as BonusKey) || ("otranto" as BonusKey);

  const cfg = BONUS_MAPS[key] || BONUS_MAPS["otranto"];
  const center: [number, number] = [cfg.lat, cfg.lng];

  const goBack = () => {
    try {
      window.dispatchEvent(
        new CustomEvent("salento:return", { detail: { from: key } })
      );
    } catch {}
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/qr");
    }
  };

  // Polygone troué : on remplit le monde, et on “troue” le disque de 30 km
  const inner = circleToPolygon(center[0], center[1], RADIUS_KM);
  const innerHole = [...inner].reverse(); // orientation inverse pour créer un trou
  const polygonWithHole = [WORLD_RECT, innerHole];

  // Partenaires optionnels (affiche ceux avec lat/lng)
  const partners =
    (cfg.partners || []).filter(
      (p: any) =>
        typeof p?.lat === "number" &&
        typeof p?.lng === "number" &&
        isFinite(p.lat) &&
        isFinite(p.lng)
    ) || [];

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <MapContainer
        key={key}
        center={center}
        zoom={cfg.zoom ?? 12}
        style={{ height: "100%", width: "100%" }}
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marqueur central (ville) */}
        <Marker position={center}>
          <Popup>
            <b>{cfg.title}</b>
            <br />
            {cfg.markerText || "Carte bonus"}
          </Popup>
        </Marker>

        {/* Partenaires (si présents) */}
        {partners.map((p: any) => (
          <Marker key={p.id || p.name} position={[p.lat, p.lng]}>
            <Popup>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.qr ? <div style={{ opacity: 0.7 }}>QR&nbsp;: {p.qr}</div> : null}
            </Popup>
          </Marker>
        ))}

        {/* Masque inversé : seul le disque de 30 km reste visible */}
        <Polygon
          positions={polygonWithHole as any}
          pathOptions={{
            fillColor: "#ffffff", // couleur du masque
            fillOpacity: 0.92,    // opacité du masque
            color: "#ffffff",
            opacity: 0,           // pas de bord
          }}
        />

        {/* recadrage + limites */}
        <FitAndRestrict lat={center[0]} lng={center[1]} radiusKm={RADIUS_KM} />
      </MapContainer>

      <button
        onClick={goBack}
        style={{
          position: "fixed",
          left: "12px",
          bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
          zIndex: 99999,
          padding: "10px 14px",
          border: 0,
          borderRadius: "14px",
          font:
            "700 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#111827",
          color: "#e5e7eb",
          boxShadow: "0 10px 24px rgba(0,0,0,.35)",
          cursor: "pointer",
        }}
        title={`Retour — ${cfg.title}`}
      >
        ↩️ Retour carte Salento (niv. 2)
      </button>
    </div>
  );
}
