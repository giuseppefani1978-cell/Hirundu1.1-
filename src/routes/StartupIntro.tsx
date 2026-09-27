import { useLayoutEffect, useRef, useState } from "react";
import { LANG } from "../i18n.js";
import { withBase } from "../utils/basePath.js";
import "./StartupIntro.css";

type Props = {
  onComplete: () => void;
};

const introLabels = {
  fr: { skip: "Passer", start: "Commencer" },
  it: { skip: "Salta", start: "Inizia" },
  en: { skip: "Skip", start: "Start" },
  es: { skip: "Omitir", start: "Empezar" },
} as const;

export default function StartupIntro({ onComplete }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canEnter, setCanEnter] = useState(false);
  const labels = introLabels[(LANG in introLabels ? LANG : "fr") as keyof typeof introLabels];

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Important for iOS/PWA: create the element imperatively so autoplay,
    // muted and playsinline exist BEFORE the MP4 source is attached.
    const video = document.createElement("video");
    video.className = "startup-intro__video";
    video.autoplay = true;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.controls = false;
    video.disablePictureInPicture = true;
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("preload", "auto");

    const updateFinalAction = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      setCanEnter(video.currentTime >= Math.max(0, video.duration - 2.2));
    };
    const ended = () => setCanEnter(true);

    video.addEventListener("timeupdate", updateFinalAction);
    video.addEventListener("ended", ended);
    video.addEventListener("error", onComplete);

    host.replaceChildren(video);

    // Attach the source only after the autoplay-safe properties above are set.
    video.src = withBase("assets/hirundu_intro.mp4");
    video.load();

    let cancelled = false;
    let manualFallback = false;
    let fallbackFrame = 0;
    let fallbackStart = 0;
    let fallbackBaseTime = 0;

    const stopManualFallback = () => {
      manualFallback = false;
      if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
      fallbackFrame = 0;
    };

    const runManualFallback = (now: number) => {
      if (cancelled || !manualFallback) return;
      if (!fallbackStart) {
        fallbackStart = now;
        fallbackBaseTime = Math.max(0, video.currentTime || 0);
      }
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        fallbackFrame = requestAnimationFrame(runManualFallback);
        return;
      }

      const target = Math.min(
        video.duration,
        fallbackBaseTime + (now - fallbackStart) / 1000,
      );

      // Low Power Mode can forbid play(), but seeking a muted local video is
      // still allowed. Advancing currentTime therefore keeps the cinematic
      // visibly moving without a user gesture.
      if (!video.seeking && Math.abs(video.currentTime - target) >= 0.07) {
        try { video.currentTime = target; } catch {}
      }

      if (target >= video.duration - 0.06) {
        manualFallback = false;
        setCanEnter(true);
        return;
      }
      fallbackFrame = requestAnimationFrame(runManualFallback);
    };

    const startManualFallback = () => {
      if (cancelled || manualFallback || video.ended) return;
      manualFallback = true;
      video.pause();
      fallbackStart = 0;
      fallbackBaseTime = video.currentTime || 0;
      fallbackFrame = requestAnimationFrame(runManualFallback);
    };

    const tryPlay = () => {
      if (cancelled || manualFallback || video.ended || !video.paused) return;
      video.muted = true;
      const attempt = video.play();
      if (attempt && typeof attempt.then === "function") {
        void attempt
          .then(() => stopManualFallback())
          .catch((error) => {
            if (error?.name === "NotAllowedError") startManualFallback();
          });
      }
    };

    const timers = [0, 80, 220, 500, 1000, 1800].map((delay) =>
      window.setTimeout(tryPlay, delay),
    );
    // If iOS keeps the video paused despite the normal autoplay attempts,
    // switch automatically to frame-by-frame visual playback.
    timers.push(window.setTimeout(() => {
      if (!cancelled && video.paused && !video.ended) startManualFallback();
    }, 850));

    const onReady = () => tryPlay();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (manualFallback) return;
        tryPlay();
      }
    };

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    window.addEventListener("pageshow", onReady);
    window.addEventListener("focus", onReady);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      stopManualFallback();
      timers.forEach((timer) => window.clearTimeout(timer));
      video.pause();
      video.removeEventListener("timeupdate", updateFinalAction);
      video.removeEventListener("ended", ended);
      video.removeEventListener("error", onComplete);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      window.removeEventListener("pageshow", onReady);
      window.removeEventListener("focus", onReady);
      document.removeEventListener("visibilitychange", onVisible);
      video.remove();
    };
  }, [onComplete]);

  return (
    <section className="startup-intro" aria-label="Introduction HIRUNDU">
      <div ref={hostRef} className="startup-intro__media" />

      <button
        type="button"
        className="startup-intro__skip"
        onClick={onComplete}
      >
        {labels.skip}
      </button>

      {canEnter && (
        <button
          type="button"
          className="startup-intro__enter"
          aria-label={labels.start}
          onClick={onComplete}
        >
          {labels.start}
        </button>
      )}
    </section>
  );
}
