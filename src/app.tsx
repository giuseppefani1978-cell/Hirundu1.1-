// src/app.tsx
import React from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";

// Pages (make sure these files exist and export default components)
import QrHub from "./features/qr/routes/QrHub";
import PoiMarket from "./features/qr/routes/PoiMarket";
import RealMap from "./features/qr/routes/RealMap";
import BonusIndex from "./features/bonus/BonusIndex"; 

export default function App() {
  return (
    <HashRouter>
      <div style={{ padding: "1.5rem", fontFamily: "system-ui" }}>
        <h1>HIRUNDU — Module QR & Carte</h1>

        <nav style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link to="/qr">🔍 QR Hub</Link>
          <Link to="/bonus">🎁 Bonus</Link> {/* 👈 NEW */}
          <Link to="/poi/otranto/market">🏪 Marché Otranto</Link>
        </nav>

        <Routes>
          <Route path="/qr" element={<QrHub />} />
          <Route path="/bonus" element={<BonusIndex />} /> {/* 👈 NEW */}
          <Route path="/poi/:id/market" element={<PoiMarket />} />
          <Route path="/poi/:id/realmap" element={<RealMap />} />
          <Route path="*" element={<p>Choisis une section ci-dessus.</p>} />
        </Routes>
      </div>
    </HashRouter>
  );
}