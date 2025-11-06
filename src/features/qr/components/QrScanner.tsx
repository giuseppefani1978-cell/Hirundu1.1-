// src/features/qr/components/QrScanner.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import workerUrl from "qr-scanner/qr-scanner-worker.min?url";
import "./QrScanner.css";

QrScanner.WORKER_PATH = workerUrl;

type QrScannerProps = {
  onResult: (text: string) => void;
  onError?: (e: Error) => void;
  onClose?: () => void;
};

type Phase = "idle" | "consent" | "starting" | "running" | "blocked" | "fail";
type Pref = "once" | "active" | "never";
const LS_KEY: string = "qr_permission_pref";

export default function QrScannerView({ onResult, onError, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState<string>("");
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [pref, setPref] = useState<Pref>(() => {
    try {
      const v = localStorage.getItem(LS_KEY) as Pref | null;
      return v ?? "once";
    } catch {
      return "once";
    }
  });

  const persistPref = (p: Pref) => {
    try {
      localStorage.setItem(LS_KEY, p);
    } catch {}
    setPref(p);
  };

  /** Stop camera tracks and destroy scanner */
  const stopStreams = useCallback(() => {
    try { scannerRef.current?.stop(); } catch {}
    try { scannerRef.current?.destroy(); } catch {}
    scannerRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null | undefined;
    if (stream) {
      for (const t of stream.getTracks()) {
        try { t.stop(); } catch {}
      }
    }
    if (video) {
      try { video.pause(); } catch {}
      (video as any).srcObject = null;
    }
  }, []);

  /** Close overlay safely — let parent unmount the component */
  const handleClose = useCallback(() => {
    stopStreams();
    setPhase("idle");
    setHasFlash(false);
    setFlashOn(false);
    try { onClose?.(); } catch {}
    // ❗ Do NOT remove DOM nodes manually here; React will unmount this component.
  }, [onClose, stopStreams]);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [handleClose]);

  /** Start camera (respects user preference) */
  const startCamera = useCallback(async () => {
    setMsg("");

    if (pref === "never") {
      setPhase("blocked");
      setMsg("Le scanner est désactivé (préférence : jamais).");
      return;
    }

    setPhase("starting");
    stopStreams();

    try {
      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) throw new Error("Aucune caméra disponible.");

      const scanner = new QrScanner(
        videoRef.current!,
        (res) => {
          const text = typeof res === "string" ? res : res?.data ?? "";
          if (text) onResult(text);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          maxScansPerSecond: 10,
        }
      );
      scannerRef.current = scanner;

      await scanner.start();
      setPhase("running");

      try {
        setHasFlash(!!(await scanner.hasFlash()));
      } catch {}
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setMsg(error.message || "La lecture vidéo a été bloquée.");
      setPhase("blocked");
      onError?.(error);
    }
  }, [onResult, onError, pref, stopStreams]);

  const askConsentThenStart = useCallback(
    (chosen: Pref) => {
      persistPref(chosen);
      if (chosen !== "never") startCamera();
      else {
        setPhase("blocked");
        setMsg("Le scanner est désactivé (préférence : jamais).");
      }
    },
    [startCamera]
  );

  const retry = useCallback(() => {
    if (pref === "once") {
      setPhase("consent");
      return;
    }
    startCamera();
  }, [pref, startCamera]);

  const toggleFlash = useCallback(async () => {
    const next = !flashOn;
    try {
      const scanner: any = scannerRef.current;
      if (scanner?.setFlash) {
        await scanner.setFlash(next);
        setFlashOn(next);
        return;
      }
      if (scanner?.toggleFlash) {
        await scanner.toggleFlash();
        setFlashOn(next);
        return;
      }
    } catch {}
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

  // Cleanup on unmount
  useEffect(() => () => stopStreams(), [stopStreams]);

  // Initial phase based on preference
  useEffect(() => {
    if (phase !== "idle") return;
    if (pref === "once") setPhase("consent");
    else if (pref === "never") {
      setPhase("blocked");
      setMsg("Le scanner est désactivé (préférence : jamais).");
    } else {
      startCamera();
    }
  }, [phase, pref, startCamera]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scanner un QR"
      className="qr-overlay"
      onClick={handleClose}
    >
      <div className="qr-overlay__card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Fermer"
          className="qr-overlay__close"
          onClick={handleClose}
        >
          <span aria-hidden>×</span>
        </button>

        {hasFlash && phase === "running" ? (
          <button
            type="button"
            onClick={toggleFlash}
            className={`qr-overlay__flash ${flashOn ? "qr-overlay__flash--on" : ""}`}
            title="Lampe"
          >
            {flashOn ? "Lampe ON" : "Lampe OFF"}
          </button>
        ) : null}

        <video ref={videoRef} muted playsInline className="qr-overlay__video" />
        <div className="qr-overlay__frame" aria-hidden />

        <div className="qr-overlay__hud" aria-live="polite">
          {phase === "consent" && (
            <div className="qr-overlay__message qr-overlay__message--info">
              <p>Utiliser le scanner&nbsp;?</p>
              <div className="qr-overlay__consent">
                <button className="app-button" onClick={() => askConsentThenStart("once")}>
                  Une fois
                </button>
                <button className="app-button app-button--dark" onClick={() => askConsentThenStart("active")}>
                  Tant que l’app est ouverte
                </button>
                <button className="app-button app-button--ghost" onClick={() => askConsentThenStart("never")}>
                  Jamais
                </button>
              </div>
            </div>
          )}

          {phase === "starting" && (
            <p className="qr-overlay__message qr-overlay__message--info">
              Initialisation de la caméra…
            </p>
          )}

          {phase === "running" && (
            <p className="qr-overlay__message qr-overlay__message--success">
              Scanner actif — aligne un QR dans le cadre lumineux.
            </p>
          )}

          {phase === "blocked" && (
            <div className="qr-overlay__message qr-overlay__message--warning">
              <span>La lecture vidéo a été bloquée.</span>
              {msg ? <small>{msg}</small> : null}
              <button type="button" className="app-button qr-overlay__action" onClick={retry}>
                Réessayer
              </button>
            </div>
          )}

          {phase === "fail" && (
            <div className="qr-overlay__message qr-overlay__message--error">
              <span>{msg || "Erreur caméra."}</span>
              <button type="button" className="app-button qr-overlay__action" onClick={retry}>
                Réessayer
              </button>
            </div>
          )}

          <p className="qr-overlay__privacy">
            Aucune image n’est enregistrée et aucune donnée personnelle n’est collectée.
          </p>
        </div>
      </div>
    </div>
  );
}
