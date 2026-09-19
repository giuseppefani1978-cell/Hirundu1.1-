import React, { forwardRef } from "react";
import { t } from "../i18n.js";
import { copy } from "../ui/copy.js";

export type LegacyGameShellProps = {
  level?: number;
  onStartClick?: () => void;
  versionLabel?: string;
};

const LegacyGameShell = forwardRef<HTMLCanvasElement, LegacyGameShellProps>(function LegacyGameShell(
  { level = 1, onStartClick, versionLabel = "v2025-08-20-g" },
  canvasRef
) {
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
              <button
                id="startBtn"
                type="button"
                className="overlay-card__button"
                onClick={onStartClick}
              >
                ▶︎ {copy.start}
              </button>
            </div>
          </div>

          <button id="musicBtn" type="button">
            {t.musicOff}
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
        }}
      >
        Force Refresh
      </button>
    </>
  );
});

export default LegacyGameShell;
