import React, { forwardRef } from "react";

export type LegacyGameShellProps = {
  onStartClick?: () => void;
  versionLabel?: string;
};

const LegacyGameShell = forwardRef<HTMLCanvasElement, LegacyGameShellProps>(function LegacyGameShell(
  { onStartClick, versionLabel = "v2025-08-20-g" },
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
                Le Vol d’Aracne
              </h1>
              <p className="overlay-card__subtitle" id="subtitleP">
                Collecte les 10 étoiles et découvre 10 lieux secrets du Salento.
              </p>
              <div className="overlay-card__highlight" id="overlayHighlight" hidden></div>
              <p className="overlay-card__description" id="overlayDescription"></p>
              <div className="overlay-card__heroes" id="overlayHeroes">
                <img id="heroAr" alt="Aracne" />
                <img id="heroTa" alt="Tarantula" />
              </div>
              <p className="overlay-card__footnote" id="overlayFootnote"></p>
              <button
                id="startBtn"
                type="button"
                className="overlay-card__button"
                onClick={onStartClick}
              >
                ▶︎ Lancer la chasse
              </button>
            </div>
          </div>

          <button id="musicBtn" type="button">
            🎵 Musique
          </button>
          <button id="replayFloat" type="button">
            ⟲ Rejouer
          </button>
          <div className="err" id="err" style={{ display: "none" }}>
            <b id="errTitle">⚠️ Problème d’assets</b>
            <div id="errText"></div>
          </div>

          <canvas id="c" ref={canvasRef}></canvas>

          <div className="hud" id="hud">
            <h3 id="hudLabel">Étoiles</h3>
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
