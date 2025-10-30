import React, { useState } from "react";
import QrScanner from "../components/QrScanner";
import "./QrHub.css";

export default function QrHub() {
  const [last, setLast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="app-section qr-hub">
      <header className="qr-hub__header">
        <h2 className="qr-hub__title">🔍 Scanner un QR</h2>
        <p className="qr-hub__subtitle">
          Lance le scanner pour lire un code partenaire ou teste le flux vidéo depuis ton poste.
        </p>
      </header>

      {!last ? (
        <QrScanner
          onResult={(text) => {
            setLast(text);
            setError(null);
          }}
          onError={(e) => setError(String(e))}
          onClose={() => {
            setLast(null);
          }}
        />
      ) : (
        <article className="surface-card qr-hub__result" aria-live="polite">
          <div className="qr-hub__result-head">
            <h3>Dernier scan</h3>
            <span className="app-tag">Réussi</span>
          </div>
          <code className="qr-hub__result-code">{last}</code>
          <div className="qr-hub__actions">
            <button
              type="button"
              className="app-button app-button--success"
              onClick={() => setLast(null)}
            >
              Scanner encore
            </button>
            <a className="app-button app-button--link" href="#/poi/otranto/realmap">
              🗺️ Ouvrir la carte d’Otrante
            </a>
          </div>
        </article>
      )}

      {error && (
        <div className="qr-hub__error" role="alert">
          <span aria-hidden>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
