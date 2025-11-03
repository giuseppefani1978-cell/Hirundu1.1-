// src/app.tsx
import React, { lazy, Suspense, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// ---- Lazy load pages (code-splitting)
const QrHub = lazy(() => import("./features/qr/routes/QrHub"));
const PoiMarket = lazy(() => import("./features/qr/routes/PoiMarket"));
const RealMap = lazy(() => import("./features/qr/routes/RealMap"));
const AppLayout = lazy(() => import("./ui/AppLayout"));
const StartPage = lazy(() => import("./routes/StartPage"));
const LegacyLevelPage = lazy(() => import("./routes/LegacyLevelPage"));
const BonusHubPage = lazy(() => import("./routes/BonusHubPage"));

// ---- Small helper: scroll to top on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // If there is an anchor, let the browser handle it
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

// ---- Fallback UI while lazy chunks load
function Loading() {
  return (
    <div style={{
      display: "grid",
      placeItems: "center",
      height: "100vh",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    }}>
      <div style={{ opacity: 0.8 }}>Chargement…</div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter /* hash routing = compatible GitHub Pages */>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Accueil */}
          <Route path="/" element={<StartPage />} />

          {/* Lancement d’un niveau “legacy” via paramètre */}
          <Route path="/level/:levelId" element={<LegacyLevelPage />} />

          {/* Hub bonus + variante avec :bonusId */}
          <Route path="/bonus" element={<BonusHubPage />} />
          <Route path="/bonus/:bonusId" element={<BonusHubPage />} />

          {/* Zone QR/POI sous layout commun */}
          <Route element={<AppLayout />}>
            <Route path="/qr" element={<QrHub />} />
            <Route path="/poi/:id/market" element={<PoiMarket />} />
            <Route path="/poi/:id/realmap" element={<RealMap />} />
          </Route>

          {/* Catch-all → retour accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
