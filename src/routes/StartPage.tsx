import TestShortcuts from '../ui/TestShortcuts';
import LanguageSelect from '../ui/LanguageSelect';
import { copy } from '../ui/copy.js';
import { t } from '../i18n.js';
import React from "react";
import { useNavigate } from "react-router-dom";
import "./StartPage.css";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="start-page">
      <div className="start-page__hero">
        <div className="start-page__content">
          <p>HIRUNDU · v5 · TEST</p>
          <LanguageSelect /><p className="start-page__eyebrow">{t.title}</p>
          <h1 className="start-page__title">{copy.ready}</h1>
          <p className="start-page__lead">
            {copy.lead}
          </p>
          <div className="start-page__actions">
            <button
              type="button"
              className="app-button app-button--dark start-page__cta"
              onClick={() => navigate("/level/1")}
            >
              ▶︎ {copy.start} · 1
            </button>
            <button
              type="button"
              className="app-button app-button--ghost"
              onClick={() => navigate("/bonus/otranto", { state: { fromIntro: true } })}
            >
              🎁 {copy.bonus}
            </button>
          </div>
          <TestShortcuts />
        </div>
      </div>
      {/* PATCH : suppression du Hall of Fame sur la page d’accueil.
          Il doit désormais être affiché uniquement dans la page Bonus (BonusIndex). */}
    </div>
  );
}
