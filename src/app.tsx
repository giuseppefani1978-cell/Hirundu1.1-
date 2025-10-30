// src/app.tsx
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

// Pages
import QrHub from "./features/qr/routes/QrHub";
import PoiMarket from "./features/qr/routes/PoiMarket";
import RealMap from "./features/qr/routes/RealMap";
import BonusIndex from "./features/bonus/BonusIndex";
import AppLayout from "./ui/AppLayout";

export default function App() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/qr" element={<QrHub />} />
          <Route path="/bonus" element={<BonusIndex />} />
          <Route path="/poi/:id/market" element={<PoiMarket />} />
          <Route path="/poi/:id/realmap" element={<RealMap />} />
          <Route path="*" element={<p>Choisis une section dans la navigation.</p>} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
