import TestShortcuts from '../ui/TestShortcuts';
import LanguageSelect from '../ui/LanguageSelect';
import { copy } from '../ui/copy.js';
import { t } from '../i18n.js';
import { getResumeTarget } from '../features/bonus/bonusStorage';
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StartPage.css";

export default function StartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const debug = new URLSearchParams(location.search).has("debug");
  const resumeTarget = getResumeTarget();
  const resumeLevel = resumeTarget?.id ?? 1;
  const hasProgress = resumeLevel > 1;

  return (
    <div className="start-page">
      <div className="start-page__hero">
        <div className="start-page__content">
          <p>HIRUNDU · v9 · TEST</p>
          <LanguageSelect />
          <p className="start-page__eyebrow">{t("title", "HIRUNDU")}</p>
          <h1 className="start-page__title">{copy.ready}</h1>
          <p className="start-page__lead">{copy.lead}</p>
          <div className="start-page__actions">
            <button
              type="button"
              className="app-button app-button--dark start-page__cta"
              onClick={() => navigate(`/level/${resumeLevel}`)}
            >
              ▶︎ {hasProgress ? copy.continue : copy.start} · {copy.level} {resumeLevel}
            </button>
            <button
              type="button"
              className="app-button app-button--ghost"
              onClick={() => navigate("/bonus/otranto", { state: { fromIntro: true } })}
            >
              🎁 {copy.bonus}
            </button>
          </div>
          {debug ? <TestShortcuts /> : null}
        </div>
      </div>
    </div>
  );
}
