import TestShortcuts from '../ui/TestShortcuts';
import LanguageSelect from '../ui/LanguageSelect';
import { copy } from '../ui/copy.js';
import { t } from '../i18n.js';
import {
  BONUS_PROGRESS_EVENT,
  getProgressList,
  getResumeTarget,
  resetBonusProgress,
} from '../features/bonus/bonusStorage';
import { readDurableProgress } from '../progressStorage.js';
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StartPage.css";

export default function StartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const debug = new URLSearchParams(location.search).has("debug");
  const [revision, setRevision] = useState(0);
  const [replayLevel, setReplayLevel] = useState(1);
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener(BONUS_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BONUS_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  void revision;
  const progress = getProgressList();
  const resumeTarget = getResumeTarget();
  const durable = readDurableProgress();
  const unlockedLevels = progress.filter((entry) => entry.unlocked || entry.done);
  const allDone = progress.every((entry) => entry.done);
  const hasProgress =
    progress.some((entry) => entry.done) ||
    Boolean(durable?.completedLevels?.length) ||
    Boolean(durable?.discoveries?.length) ||
    Boolean(Object.keys(durable?.huntProgress || {}).length);

  useEffect(() => {
    if (!unlockedLevels.some((entry) => entry.id === replayLevel)) {
      setReplayLevel(unlockedLevels[0]?.id ?? 1);
    }
  }, [replayLevel, unlockedLevels]);

  const startFreshGame = () => {
    resetBonusProgress();
    setConfirmNewGame(false);
    setRevision((value) => value + 1);
    navigate("/level/1", { state: { newGame: true } });
  };

  return (
    <div className="start-page">
      <div className="start-page__hero">
        <div className="start-page__content">
          <p>HIRUNDU · v9 · TEST</p>
          <LanguageSelect /><p className="start-page__eyebrow">{t.title}</p>
          <h1 className="start-page__title">{copy.ready}</h1>
          <p className="start-page__lead">
            {copy.lead}
          </p>

          <div className="start-page__actions">
            {hasProgress && !allDone && resumeTarget ? (
              <button
                type="button"
                className="app-button app-button--dark start-page__cta"
                onClick={() => navigate(`/level/${resumeTarget.id}`)}
              >
                ▶︎ {copy.continue} · {copy.level} {resumeTarget.id}
              </button>
            ) : allDone ? (
              <button
                type="button"
                className="app-button app-button--dark start-page__cta"
                onClick={() => navigate("/bonus")}
              >
                ✓ {copy.complete}
              </button>
            ) : (
              <button
                type="button"
                className="app-button app-button--dark start-page__cta"
                onClick={() => navigate("/level/1")}
              >
                ▶︎ {copy.start} · 1
              </button>
            )}

            {hasProgress ? (
              <div className="start-page__replay">
                <label htmlFor="start-page-replay-level">{copy.replayLevel}</label>
                <div className="start-page__replay-row">
                  <select
                    id="start-page-replay-level"
                    aria-label={copy.chooseLevel}
                    value={replayLevel}
                    onChange={(event) => setReplayLevel(Number(event.target.value))}
                  >
                    {unlockedLevels.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {copy.level} {entry.id}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="app-button app-button--ghost"
                    onClick={() => navigate(`/level/${replayLevel}`, { state: { replay: true } })}
                  >
                    ↻ {copy.replay}
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="app-button app-button--ghost"
              onClick={() => navigate("/bonus/otranto", { state: { fromIntro: true } })}
            >
              🎁 {copy.bonus}
            </button>

            {hasProgress ? (
              <button
                type="button"
                className="app-button app-button--ghost start-page__new-game"
                onClick={() => setConfirmNewGame(true)}
              >
                {copy.newGame}
              </button>
            ) : null}
          </div>

          {confirmNewGame ? (
            <div className="start-page__confirm" role="dialog" aria-modal="true">
              <p>{copy.confirmNewGame}</p>
              <div className="start-page__confirm-actions">
                <button
                  type="button"
                  className="app-button app-button--dark"
                  onClick={startFreshGame}
                >
                  {copy.confirm}
                </button>
                <button
                  type="button"
                  className="app-button app-button--ghost"
                  onClick={() => setConfirmNewGame(false)}
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          ) : null}

          {debug ? <TestShortcuts /> : null}
        </div>
      </div>
      {/* Hall of Fame stays inside BonusIndex. */}
    </div>
  );
}
