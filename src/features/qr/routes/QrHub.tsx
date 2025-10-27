import React, { useState } from "react";
import QrScanner from "../components/QrScanner";

export default function QrHub() {
  const [last, setLast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "1rem" }}>
      <h2 style={{ marginBottom: 12 }}>🔍 Scanner un QR</h2>

      {!last ? (
        <QrScanner
          onResult={(text) => {
            setLast(text);
            setError(null);
            // TODO: dispatch to store / navigate based on QR content, etc.
          }}
          onError={(e) => setError(String(e))}
          onClose={() => {
            // if you want to navigate away, do it here
            setLast(null);
          }}
        />
      ) : (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,.08)",
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Dernier scan</div>
          <code style={{ display: "block", padding: 8, background: "#f3f4f6" }}>
            {last}
          </code>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={() => setLast(null)}
              style={{
                padding: "10px 14px",
                border: 0,
                borderRadius: 12,
                background: "#10b981",
                color: "#083d2b",
                fontWeight: 700,
              }}
            >
              Scanner encore
            </button>
            <a
              href="#/poi/otranto/realmap"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "#2563eb",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              🗺️ Ouvrir la carte d’Otrante
            </a>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, color: "#b91c1c" }}>
            ⚠️ {error}
        </div>
      )}
    </div>
  );
}
