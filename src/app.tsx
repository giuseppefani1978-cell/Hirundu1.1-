// src/app.tsx
import { copy } from "./ui/copy.js";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { initializeDurableProgress, syncDurableProgress } from "./progressStorage.js";
import { applyComfort } from "./features/comfort/preferences.js";

// ---- Lazy load pages (code-splitting)
const QrHub = lazy(() => import("./features/qr/routes/QrHub"));
const PoiMarket = lazy(() => import("./features/qr/routes/PoiMarket"));
const RealMap = lazy(() => import("./features/qr/routes/RealMap"));
const AppLayout = lazy(() => import("./ui/AppLayout"));
const StartPage = lazy(() => import("./routes/StartPage"));
const JourneyPage = lazy(() => import("./routes/JourneyPage"));
const DiscoveryPreview = lazy(() => import("./routes/DiscoveryPreview"));
const TradePreview = lazy(() => import("./routes/TradePreview"));
const CardTradePage = lazy(() => import("./routes/CardTradePage"));
const LegacyLevelPage = lazy(() => import("./routes/LegacyLevelPage"));
const BonusHubPage = lazy(() => import("./routes/BonusHubPage"));
const RegionLevelPage = lazy(() => import("./levels/RegionLevelPage"));
const RegionDiscoveries = lazy(() => import("./levels/RegionDiscoveries"));
const SettingsPage = lazy(() => import("./routes/SettingsPage"));

type AppErrorBoundaryProps = { children: React.ReactNode };
type AppErrorBoundaryState = { failed: boolean };

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("HIRUNDU application recovery", error);
    syncDurableProgress();
  }

  private retry = () => {
    syncDurableProgress();
    const url = new URL(window.location.href);
    url.searchParams.set("fresh", Date.now().toString());
    window.location.replace(url.toString());
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return (
      <main style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}>
        <section style={{ maxWidth: 520 }}>
          <h1>HIRUNDU</h1>
          <p>{copy.reloadRequired}</p>
          {offline ? <p>{copy.offlineNotGuaranteed}</p> : null}
          <p>{copy.localSaveSafe}</p>
          <button type="button" className="app-button app-button--dark" onClick={this.retry}>
            {copy.retry}
          </button>
        </section>
      </main>
    );
  }
}

// ---- Small helper: scroll to top on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith("/level/")) document.getElementById("__score_live")?.remove();
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
      <div style={{ opacity: 0.8 }}>{copy.loading}</div>
    </div>
  );
}

export default function App() {
  const [, setLanguageRevision] = useState(0);

  useEffect(() => {
    initializeDurableProgress();
    applyComfort();
    const sync = () => { syncDurableProgress(); };
    const refreshLanguage = () => setLanguageRevision((value) => value + 1);
    window.addEventListener("pagehide", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("hirundu:language", refreshLanguage);
    return () => {
      window.removeEventListener("pagehide", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("hirundu:language", refreshLanguage);
    };
  }, []);

  return (
    <AppErrorBoundary>
      <HashRouter /* hash routing = compatible GitHub Pages */>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          <Routes>
          {/* Accueil */}
          <Route path="/" element={<StartPage />} />
          <Route path="/journey" element={<JourneyPage />} />
          <Route path="/discovery-preview" element={<DiscoveryPreview />} />
          <Route path="/trade-preview" element={<TradePreview />} />
          <Route path="/card-trade" element={<CardTradePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Lancement d’un niveau “legacy” via paramètre */}
          <Route path="/level/:levelId" element={<LegacyLevelPage />} />
          <Route path="/region/:levelId" element={<RegionLevelPage />} />
          <Route path="/region/:levelId/discoveries" element={<RegionDiscoveries />} />

          {/* Hub bonus + variante avec :bonusId */}
          <Route path="/bonus" element={<BonusHubPage />} />
          <Route path="/bonus/:bonusId" element={<BonusHubPage />} />

          <Route path="/passport" element={<RealMap passportOnly />} />
          <Route path="/passport/:id" element={<RealMap passportOnly />} />

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
    </AppErrorBoundary>
  );
}
