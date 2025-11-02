import { removeVictoryCTA } from "../bonus_transition.js";

export type ChromeCleanup = () => void;

function setHostBadge() {
  if (typeof document === "undefined") return;
  const hostSpan = document.getElementById("__host__");
  if (hostSpan) {
    hostSpan.textContent = window.location.host || "local";
  }
}

async function handleServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const isProd = Boolean(import.meta?.env?.PROD);
  if (isProd) {
    try {
      const base = import.meta?.env?.BASE_URL ?? new URL(".", document.baseURI).pathname;
      const swUrl = `${base.replace(/\/?$/, "/")}sw.js`;
      await navigator.serviceWorker.register(swUrl);
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.warn("Unable to unregister service workers", error);
  }

  if (window.caches) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
      // eslint-disable-next-line no-console
      console.log("[DEV] SW disabled, caches cleared");
    } catch (error) {
      console.warn("Unable to clear caches", error);
    }
  }
}

function setupForceRefresh(): ChromeCleanup {
  if (typeof document === "undefined") {
    return () => undefined;
  }
  const button = document.getElementById("__force__");
  if (!button) {
    return () => undefined;
  }

  const handler = () => {
    try {
      removeVictoryCTA();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  button.addEventListener("click", handler);
  return () => {
    button.removeEventListener("click", handler);
  };
}

function ensureBattleTheme() {
  if (typeof window === "undefined") return;
  if (!window.__BATTLE_THEME_URL__) {
    window.__BATTLE_THEME_URL__ = "assets/battle_loop.mp3";
  }
}

export function initLegacyChrome(): ChromeCleanup {
  setHostBadge();
  ensureBattleTheme();
  // eslint-disable-next-line no-console
  console.info("[legacy] chrome initialized", import.meta.env.MODE);
  handleServiceWorker();

  const cleanupFns: ChromeCleanup[] = [];
  cleanupFns.push(setupForceRefresh());

  return () => {
    cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore individual cleanup failures
      }
    });
  };
}

declare global {
  interface Window {
    __BATTLE_THEME_URL__?: string;
  }
}
