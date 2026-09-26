import { useEffect, useRef, useState } from "react";
import { withBase } from "../utils/basePath.js";
import "./StartupIntro.css";

type Props = {
  onComplete: () => void;
};

export default function StartupIntro({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canEnter, setCanEnter] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const play = () => {
      void video.play().catch(() => {
        // Mobile browsers may delay autoplay; a first tap on the intro retries it.
      });
    };
    play();

    const retry = () => {
      if (video.paused && !video.ended) play();
    };
    window.addEventListener("pointerdown", retry, { once: true });
    return () => window.removeEventListener("pointerdown", retry);
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
        Passer
      </button>

      {canEnter && (
        <button
          type="button"
          className="startup-intro__enter"
          aria-label="Commencer HIRUNDU"
          onClick={onComplete}
        >
          Commencer
        </button>
      )}
    </section>
  );
}
