import React, { forwardRef, useEffect, useState } from "react";
import { t } from "../i18n.js";
import { copy } from "../ui/copy.js";
import { PERF_EVENT, PAUSE_EVENT, setGamePaused, toggleGamePaused } from "../game_flow.js";

export type LegacyGameShellProps = {
  level?: number;
  onStartClick?: () => void;
  onDiscoveriesClick?: () => void;
  versionLabel?: string;
  debug?: boolean;
};

const LegacyGameShell = forwardRef<HTMLCanvasElement, LegacyGameShellProps>(function LegacyGameShell(
  { level = 1, onStartClick, onDiscoveriesClick, versionLabel = "v2025-08-20-g", debug = false },
  canvasRef
) {
  const [paused, setPaused] = useState(false);
  const [perf, setPerf] = useState({ fps: 0, jank: 0, worstFrameMs: 0 });

  useEffect(() => {
    const onPause = (event: Event) => {
      const detail = (event as CustomEvent<{ paused?: boolean }>).detail;
      setPaused(Boolean(detail?.paused));
    };
    const onPerf = (event: Event) => {
      const detail = (event as CustomEvent<{ fps?: number; jank?: number; worstFrameMs?: number }>).detail;
      if (detail) setPerf({
        fps: Number(detail.fps || 0),
        jank: Number(detail.jank || 0),
        worstFrameMs: Number(detail.worstFrameMs || 0),
      });
    };
    window.addEventListener(PAUSE_EVENT, onPause as EventListener);
    window.addEventListener(PERF_EVENT, onPerf as EventListener);
    return () => {
      window.removeEventListener(PAUSE_EVENT, onPause as EventListener);
      window.removeEventListener(PERF_EVENT, onPerf as EventListener);
      setGamePaused(false);
    };
  }, []);

  const restart = () => {
    setGamePaused(false);
    window.setTimeout(() => document.getElementById("replayFloat")?.click(), 0);
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
              {level === 1 && (() => { try { return !localStorage.getItem('player_name'); } catch { return true; } })() && <label id="playerNameField" htmlFor="playerName" style={{display:'grid', gap:'6px', margin:'12px 0', textAlign:'left'}}>
                {copy.name}
                <input id="playerName" type="text" maxLength={40} autoComplete="nickname"
                  defaultValue={(() => { try { return localStorage.getItem('player_name') || ''; } catch { return ''; } })()}
                  placeholder={copy.player} style={{fontSize:'16px', padding:'10px', borderRadius:'8px', width:'100%', boxSizing:'border-box'}} />
              </label>}
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
                <button type="button" className="game-pause__primary" onClick={() => setGamePaused(false)}>
                  ▶ {copy.resume}
                </button>
                <button type="button" onClick={restart}>↻ {copy.restartLevel}</button>
                <button type="button" onClick={() => document.getElementById("musicBtn")?.click()}>
                  ♪ {copy.musicStart}
                </button>
                {onDiscoveriesClick ? (
                  <button type="button" onClick={() => { setGamePaused(false); onDiscoveriesClick(); }}>
                    🎁 {copy.bonus}
                  </button>
                ) : null}
                {debug ? (
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

          {debug ? (
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
