import React, { forwardRef, useEffect, useState } from "react";
import { setLang, t } from "../i18n.js";
import { copy } from "../ui/copy.js";
import { PERF_EVENT, PAUSE_EVENT, setGamePaused, toggleGamePaused } from "../game_flow.js";
import { AUDIO_STATE_EVENT, isMusicOn } from "../audio.js";

const GENERIC_PLAYER_NAMES = new Set(["joueur", "giocatore", "player", "jugador"]);
const PWA_INSTALL_STATE_EVENT = "hirundu:pwa-install-state";

type HirunduInstallWindow = Window & {
  __HIRUNDU_PWA_INSTALL_AVAILABLE__?: boolean;
  __HIRUNDU_INSTALL_APP__?: () => Promise<unknown>;
};

const GAME_LANGUAGES = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "it", label: "IT" },
  { value: "es", label: "ES" },
];

function getGameLanguage(): string {
  try {
    const stored = (window.localStorage.getItem("__lang__") || "").slice(0, 2).toLowerCase();
    if (GAME_LANGUAGES.some((item) => item.value === stored)) return stored;
  } catch {}
  const htmlLang = (document.documentElement.lang || navigator.language || "fr").slice(0, 2).toLowerCase();
  return GAME_LANGUAGES.some((item) => item.value === htmlLang) ? htmlLang : "fr";
}

function normalizeStoredPlayerName(value: string | null): string {
  if (!value) return "";
  let candidate: unknown = value.trim();
  if (!candidate) return "";

  try {
    const parsed = JSON.parse(String(candidate));
    if (typeof parsed === "string") candidate = parsed;
    else if (parsed && typeof parsed === "object" && "name" in parsed) {
      candidate = (parsed as { name?: unknown }).name;
    }
  } catch {
    // Legacy plain-string values are valid.
  }

  const name = String(candidate ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  if (!name) return "";

  const token = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const fallback = String(copy.player || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (GENERIC_PLAYER_NAMES.has(token) || (fallback && token === fallback)) return "";
  return name;
}

function getSavedPlayerName(): string {
  try {
    return normalizeStoredPlayerName(window.localStorage.getItem("player_name"));
  } catch {
    return "";
  }
}

function getInstallAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as HirunduInstallWindow).__HIRUNDU_PWA_INSTALL_AVAILABLE__);
}

function getCurrentScore(): string {
  if (typeof document === "undefined") return "0";
  const raw = document.getElementById("__score_live")?.textContent?.trim() || "0";
  const normalized = raw.replace(/^0+(?=\d)/, "");
  return normalized || "0";
}

export type LegacyGameShellProps = {
  level?: number;
  onStartClick?: () => void;
  onDiscoveriesClick?: () => void;
  versionLabel?: string;
  debug?: boolean;
  showPerf?: boolean;
};

const LegacyGameShell = forwardRef<HTMLCanvasElement, LegacyGameShellProps>(function LegacyGameShell(
  { level = 1, onStartClick, onDiscoveriesClick, versionLabel = "v2025-08-20-g", debug = false, showPerf = false },
  canvasRef
) {
  const [paused, setPaused] = useState(false);
  const [pauseScore, setPauseScore] = useState("0");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [language, setLanguage] = useState(getGameLanguage);
  const [installAvailable, setInstallAvailable] = useState(getInstallAvailable);
  const [perf, setPerf] = useState({ fps: 0, jank: 0, worstFrameMs: 0 });
  const [savedPlayerName] = useState(() => getSavedPlayerName());
  const [editingPlayerName, setEditingPlayerName] = useState(false);
  const shouldAskName = !savedPlayerName || editingPlayerName;

  useEffect(() => {
    const onPause = (event: Event) => {
      const detail = (event as CustomEvent<{ paused?: boolean }>).detail;
      const nextPaused = Boolean(detail?.paused);
      if (nextPaused) setPauseScore(getCurrentScore());
      setPaused(nextPaused);
    };
    const onPerf = (event: Event) => {
      const detail = (event as CustomEvent<{ fps?: number; jank?: number; worstFrameMs?: number }>).detail;
      if (detail) setPerf({
        fps: Number(detail.fps || 0),
        jank: Number(detail.jank || 0),
        worstFrameMs: Number(detail.worstFrameMs || 0),
      });
    };
    const onAudio = () => setMusicEnabled(isMusicOn());
    const onInstallState = (event: Event) => {
      const detail = (event as CustomEvent<{ available?: boolean }>).detail;
      setInstallAvailable(Boolean(detail?.available));
    };
    onAudio();
    setInstallAvailable(getInstallAvailable());
    window.addEventListener(PAUSE_EVENT, onPause as EventListener);
    window.addEventListener(PERF_EVENT, onPerf as EventListener);
    window.addEventListener(AUDIO_STATE_EVENT, onAudio);
    window.addEventListener(PWA_INSTALL_STATE_EVENT, onInstallState as EventListener);
    return () => {
      window.removeEventListener(PAUSE_EVENT, onPause as EventListener);
      window.removeEventListener(PERF_EVENT, onPerf as EventListener);
      window.removeEventListener(AUDIO_STATE_EVENT, onAudio);
      window.removeEventListener(PWA_INSTALL_STATE_EVENT, onInstallState as EventListener);
      setGamePaused(false);
    };
  }, []);

  const restart = () => {
    setGamePaused(false);
    window.setTimeout(() => document.getElementById("replayFloat")?.click(), 0);
  };

  const installApp = async () => {
    const appWindow = window as HirunduInstallWindow;
    const install = appWindow.__HIRUNDU_INSTALL_APP__;
    if (!install) {
      setInstallAvailable(false);
      return;
    }
    setInstallAvailable(false);
    try {
      await install();
    } catch (error) {
      console.warn("Unable to open PWA install prompt", error);
    }
  };

  const changeLanguage = (nextLanguage: string) => {
    if (!GAME_LANGUAGES.some((item) => item.value === nextLanguage)) return;
    setLanguage(nextLanguage);
    try {
      window.localStorage.setItem("hirundu_arcade_language", nextLanguage);
    } catch {}
    setLang(nextLanguage);
  };

  return (
    <>
      <div
        id="__ver__"
        style={{
          position: "fixed",
          right: "8px",
          bottom: "8px",
          zIndex: 9999,
          background: "rgba(0,0,0,.55)",
          color: "#fff",
          font: "12px system-ui",
          padding: "4px 6px",
          borderRadius: "6px",
          pointerEvents: "none",
          display: debug ? "block" : "none",
        }}
      >
        {versionLabel} • host=<span id="__host__"></span>
      </div>

      <div className="wrap">
        <div className="game">
          <div className="overlay" id="overlay">
            <div className="overlay-card" id="overlayCard">
              <div className="overlay-card__badge" id="overlayBadge"></div>
              <h1 className="overlay-card__title" id="titleH1">
                {t.title}
              </h1>
              <p className="overlay-card__subtitle" id="subtitleP">
                {t.subtitle}
              </p>
              <div className="overlay-card__highlight" id="overlayHighlight" hidden></div>
              <p className="overlay-card__description" id="overlayDescription"></p>
              <div className="overlay-card__heroes" id="overlayHeroes">
                <img id="heroAr" alt="Aracne" />
                <img id="heroTa" alt="Tarantula" />
              </div>
              <p className="overlay-card__footnote" id="overlayFootnote"></p>
              {shouldAskName ? (
                <label
                  id="playerNameField"
                  htmlFor="playerName"
                  className="overlay-card__player-name"
                >
                  <span>{copy.name}</span>
                  <input
                    id="playerName"
                    type="text"
                    maxLength={40}
                    autoComplete="nickname"
                    defaultValue={savedPlayerName}
                    placeholder={copy.player}
                  />
                </label>
              ) : (
                <div className="overlay-card__player-profile" aria-label={savedPlayerName}>
                  <span className="overlay-card__player-profile-name">👤 {savedPlayerName}</span>
                  <button
                    type="button"
                    className="overlay-card__player-profile-edit"
                    onClick={() => {
                      setEditingPlayerName(true);
                      window.setTimeout(() => document.getElementById("playerName")?.focus(), 0);
                    }}
                  >
                    {copy.editPlayer}
                  </button>
                </div>
              )}
              <div className="overlay-card__actions">
                <button
                  id="startBtn"
                  type="button"
                  className="overlay-card__button"
                  onClick={onStartClick}
                >
                  ▶︎ {copy.start}
                </button>
                {onDiscoveriesClick ? (
                  <button
                    type="button"
                    className="overlay-card__secondary"
                    onClick={onDiscoveriesClick}
                  >
                    🎁 {copy.bonus}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <button id="musicBtn" type="button">
            {t.musicOff}
          </button>
          <button id="pauseBtn" type="button" aria-label={copy.pause} onClick={() => toggleGamePaused()}>
            {paused ? "▶" : "Ⅱ"}
          </button>
          <button id="replayFloat" type="button">
            {t.replay}
          </button>
          <div className="err" id="err" style={{ display: "none" }}>
            <b id="errTitle">{t.errTitle}</b>
            <div id="errText"></div>
          </div>

          <canvas id="c" ref={canvasRef}></canvas>

          <div className="hud" id="hud">
            <h3 id="hudLabel">{t.hudStars}</h3>
            <div className="score" id="score">
              0/10
            </div>
            <div className="stars" id="stars"></div>
          </div>

          <div className="tarTop" id="tarTop">
            <img id="tarAvatar" alt="Tarantula" />
            <div className="bdBubble">
              <div className="bdTitle" id="bdTitle">
                Tarantula
              </div>
              <p id="bdText"></p>
            </div>
          </div>

          {paused ? (
            <div className="game-pause" role="dialog" aria-modal="true" aria-label={copy.pause}>
              <div className="game-pause__card">
                <div className="game-pause__icon">Ⅱ</div>
                <h2>{copy.pause}</h2>
                <p>{copy.pauseHint}</p>
                <div className="game-pause__score">
                  <span>{copy.points}</span>
                  <strong>{pauseScore}</strong>
                </div>
                <button type="button" className="game-pause__primary" onClick={() => setGamePaused(false)}>
                  ▶ {copy.resume}
                </button>
                <button type="button" onClick={restart}>↻ {copy.restartLevel}</button>
                <button type="button" onClick={() => document.getElementById("musicBtn")?.click()}>
                  ♪ {musicEnabled ? copy.musicStop : copy.musicStart}
                </button>
                <label className="game-pause__language">
                  <span>🌐 {copy.language}</span>
                  <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
                    {GAME_LANGUAGES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                {installAvailable ? (
                  <button type="button" onClick={installApp}>
                    📲 {copy.installApp}
                  </button>
                ) : null}
                {onDiscoveriesClick ? (
                  <button type="button" onClick={() => { setGamePaused(false); onDiscoveriesClick(); }}>
                    🎁 {copy.bonus}
                  </button>
                ) : null}
                {(debug || showPerf) ? (
                  <div className="game-pause__perf">
                    <strong>{copy.performance}</strong>
                    <span>{copy.fps}: {perf.fps}</span>
                    <span>{copy.jank}: {perf.jank}</span>
                    <span>{copy.worstFrame}: {perf.worstFrameMs} ms</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {(debug || showPerf) ? (
            <div id="perfHud" className="perf-hud">
              {perf.fps} FPS · jank {perf.jank} · {perf.worstFrameMs} ms
            </div>
          ) : null}

          <div className="touch" id="touch">
            <div className="dpad">
              <div></div>
              <div className="btn" data-dx="0" data-dy="-1">
                ↑
              </div>
              <div></div>
              <div className="btn" data-dx="-1" data-dy="0">
                ←
              </div>
              <div></div>
              <div className="btn" data-dx="1" data-dy="0">
                →
              </div>
              <div></div>
              <div className="btn" data-dx="0" data-dy="1">
                ↓
              </div>
              <div></div>
            </div>
          </div>
        </div>
      </div>

      <div id="debugBox" style={{ display: "none" }}></div>

      <button
        id="__force__"
        type="button"
        style={{
          position: "fixed",
          left: "8px",
          bottom: "8px",
          zIndex: 9999,
          background: "#ffd",
          textTransform: "uppercase",
          border: "1px solid #cc3",
          borderRadius: "6px",
          padding: "6px 8px",
          font: "12px system-ui",
          cursor: "pointer",
          display: debug ? "block" : "none",
        }}
      >
        Force Refresh
      </button>
    </>
  );
});

export default LegacyGameShell;
