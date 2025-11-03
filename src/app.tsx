// src/app.tsx
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import QrHub from "./features/qr/routes/QrHub";
import PoiMarket from "./features/qr/routes/PoiMarket";
import RealMap from "./features/qr/routes/RealMap";
import AppLayout from "./ui/AppLayout";
import StartPage from "./routes/StartPage";
import LegacyLevelPage from "./routes/LegacyLevelPage";
import BonusHubPage from "./routes/BonusHubPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/level/:levelId" element={<LegacyLevelPage />} />
        <Route path="/bonus" element={<BonusHubPage />} />
        <Route path="/bonus/:bonusId" element={<BonusHubPage />} />
        <Route element={<AppLayout />}>
          <Route path="/qr" element={<QrHub />} />
          <Route path="/poi/:id/market" element={<PoiMarket />} />
          <Route path="/poi/:id/realmap" element={<RealMap />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
