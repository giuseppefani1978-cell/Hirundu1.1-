import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// If you use custom icons, your ./leaflet-icons patch already ran in main.tsx.

export default function RealMap() {
  // Center Otranto approx
  const otranto: [number, number] = [40.148, 18.486];

  return (
    <div style={{ height: "calc(100vh - 140px)" }}>
      <MapContainer center={otranto} zoom={12} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={otranto}>
          <Popup>Otranto</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
