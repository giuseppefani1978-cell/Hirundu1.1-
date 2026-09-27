import { useEffect, useRef, useState } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canEnter, setCanEnter] = useState(false);
  const labels = introLabels[(LANG in introLabels ? LANG : "fr") as keyof typeof introLabels];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // iOS/PWA autoplay is reliable only when the media is already muted + inline
    // before play() is attempted. Retry on media readiness/pageshow as well so
    // opening the installed web app does not require a tap to start the intro.
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");

    const play = () => {
      if (video.ended || !video.paused) return;
      void video.play().catch(() => {
        // A later readiness/pageshow/visibility event retries automatically.
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") play();
    };

    play();
    video.addEventListener("loadeddata", play);
    video.addEventListener("canplay", play);
    window.addEventListener("pageshow", play);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
      window.removeEventListener("pageshow", play);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const updateFinalAction = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    setCanEnter(video.currentTime >= Math.max(0, video.duration - 2.2));
  };

  return (
    <section className="startup-intro" aria-label="Introduction HIRUNDU">
      <video
        ref={videoRef}
        className="startup-intro__video"
        src={withBase("assets/hirundu_intro.mp4")}
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onTimeUpdate={updateFinalAction}
        onEnded={() => setCanEnter(true)}
        onError={onComplete}
      />

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
          aria-label="Commencer HIRUNDU"
          onClick={onComplete}
        >
          {labels.start}
        </button>
      )}
    </section>
  );
}
