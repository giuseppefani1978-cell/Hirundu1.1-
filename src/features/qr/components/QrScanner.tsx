// src/features/qr/components/QrScanner.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

type QrScannerProps = {
  onResult: (text: string) => void;
  onError?: (e: Error) => void;
  onClose?: () => void;
};

// Overlay discret : carte compacte
const CARD_W = 360;
const CARD_AR = 3 / 4;

export default function QrScannerView({ onResult, onError, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  // phases: idle (avant permission), starting (pendant), running (OK),
  // blocked (permission refusée/lecture bloquée), fail (erreur)
  const [phase, setPhase] = useState<"idle" | "starting" | "running" | "blocked" | "fail">("idle");
  const [msg, setMsg] = useState<string>("");

  // Torch (facultatif)
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // --- Stoppe proprement (scanner + pistes caméra)
  const stopStreams = useCallback(() => {
    try { scannerRef.current?.stop(); } catch {}
    try { scannerRef.current?.destroy(); } catch {}
    scannerRef.current = null;

    const v = videoRef.current;
    const ms = v?.srcObject as MediaStream | null | undefined;
    if (ms) {
      ms.getTracks().forEach((t) => { try { t.stop(); } catch {} });
    }
    if (v) v.srcObject = null;
  }, []);

  // --- PATCH fermeture complète (caméra + overlay)
  const handleClose = useCallback(() => {
    // 1) Stop camera
    stopStreams();

    // 2) Reset local UI state
    setPhase("idle");
    setHasFlash(false);
    setFlashOn(false);

    // 3) Notify parent (qui doit démonter le composant)
    try { onClose?.(); } catch {}

    // 4) Au cas où (si overlay a été monté en dehors de React)
    const root = document.getElementById("__qr_overlay_root");
    if (root) root.remove();
  }, [onClose, stopStreams]);

  // Esc pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Démarrage explicite (nécessite clic utilisateur)
  const startCamera = useCallback(async () => {
    setMsg("");
    setPhase("starting");
    stopStreams();

    try {
      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) throw new Error("Aucune caméra disponible.");

      const s = new QrScanner(
        videoRef.current!,
        (res) => {
          const text = typeof res === "string" ? res : (res?.data ?? "");
          if (text) onResult(text);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          maxScansPerSecond: 10,
        }
      );
      scannerRef.current = s;

      await s.start();             // ← ne marche que suite à un geste utilisateur
      setPhase("running");

      // Torch dispo ?
      try {
        const ok = await s.hasFlash();
        setHasFlash(!!ok);
      } catch {
        // certains navigateurs ne supportent pas la détection
      }
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error(String(err));
      setMsg(e.message || "La lecture vidéo a été bloquée.");
      setPhase("blocked");
      onError?.(e);
    }
  }, [onResult, onError, stopStreams]);

  const retry = useCallback(() => { startCamera(); }, [startCamera]);

  const toggleFlash = useCallback(async () => {
    const next = !flashOn;

    // 1) API de qr-scanner si dispo
    try {
      const s: any = scannerRef.current;
      if (s?.setFlash) {
        await s.setFlash(next);
        setFlashOn(next);
        return;
      }
      if (s?.toggleFlash) {
        await s.toggleFlash();
        setFlashOn(next);
        return;
      }
    } catch {}

    // 2) Fallback par la track vidéo (MediaTrackConstraints torch)
    try {
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      const track = stream?.getVideoTracks?.()[0];
      const caps: any = track?.getCapabilities?.();
      if (track && caps && typeof caps.torch !== "undefined") {
        await track.applyConstraints({ advanced: [{ torch: next }] as any });
        setFlashOn(next);
      }
    } catch {}
  }, [flashOn]);

  // Cleanup au démontage
  useEffect(() => () => stopStreams(), [stopStreams]);

  // ---------- UI ----------
  return (
    <div
      id="__qr_overlay_root"
      role="dialog"
      aria-modal="true"
      aria-label="Scanner un QR"
      // Clic en dehors = fermeture (PATCH)
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      {/* Carte centrale (stopPropagation pour ne pas fermer au clic dedans) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: CARD_W,
          height: Math.round(CARD_W / CARD_AR),
          maxWidth: "92vw",
          maxHeight: "86vh",
          background: "#111",
          borderRadius: 16,
          boxShadow: "0 18px 60px rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        {/* Bouton fermer au-dessus de tout (PATCH) */}
        <button
          type="button"
          aria-label="Fermer"
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,            // au-dessus du flux vidéo
            border: 0,
            width: 36,
            height: 36,
            borderRadius: 999,
            fontWeight: 900,
            background: "rgba(255,255,255,.95)",
            color: "#111",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          ×
        </button>

        {/* Torch si dispo et en cours de scan */}
        {hasFlash && phase === "running" && (
          <button
            type="button"
            onClick={toggleFlash}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              zIndex: 3,
              border: 0,
              borderRadius: 12,
              padding: "8px 12px",
              font: "600 13px system-ui",
              background: flashOn ? "#ffde6a" : "#9ca3af",
              color: flashOn ? "#6b4e00" : "#111827",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(0,0,0,.25)",
            }}
            title="Lampe"
          >
            {flashOn ? "Lampe ON" : "Lampe OFF"}
          </button>
        )}

        {/* Préview vidéo */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none", // pour ne pas bloquer les clics sur ×
          }}
        />

        {/* Cadre de visée */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 20,
            borderRadius: 12,
            boxShadow:
              "inset 0 0 0 4px rgba(255,214,102,.9), 0 0 0 9999px rgba(0,0,0,0)",
            pointerEvents: "none",
          }}
        />

        {/* Bandeau infos/CTA en bas */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "10px 12px 38px",
            textAlign: "center",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 60%, rgba(0,0,0,.70) 100%)",
            color: "#f3f4f6",
            font: "500 12px/1.25 system-ui",
          }}
        >
          {/* États & actions */}
          {phase === "idle" && (
            <button type="button" onClick={startCamera} style={btnStyle}>
              Activer la caméra
            </button>
          )}

          {phase === "starting" && (
            <span style={{ color: "#ffe08a" }}>Initialisation de la caméra…</span>
          )}

          {phase === "blocked" && (
            <div>
              <div style={{ marginBottom: 6, color: "#ffd7a6" }}>
                La lecture vidéo a été bloquée. Cliquez sur « Activer la caméra ».
                {msg ? (
                  <>
                    <br />
                    <small>{msg}</small>
                  </>
                ) : null}
              </div>
              <button type="button" onClick={retry} style={btnStyle}>
                Activer la caméra
              </button>
            </div>
          )}

          {phase === "fail" && (
            <div style={{ color: "#fca5a5" }}>
              {msg || "Erreur caméra."}
              <div style={{ marginTop: 6 }}>
                <button type="button" onClick={retry} style={btnStyle}>
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Note vie privée */}
          <div style={{ marginTop: 6, opacity: 0.9 }}>
            Aucune image n’est enregistrée et aucune donnée personnelle n’est collectée.
          </div>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  font: "700 14px system-ui",
  background: "#ffde6a",
  color: "#1f2937",
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(0,0,0,.35)",
};
