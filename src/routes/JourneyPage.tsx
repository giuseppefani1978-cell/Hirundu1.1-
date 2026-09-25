import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBonusProgress } from '../features/bonus/useBonusProgress';
import { journeyState, stageFamily, stageState } from '../features/bonus/journeyState';
import { journeyCopy } from '../ui/journeyCopy';
import LanguageSelect from '../ui/LanguageSelect';
import ReplayGoal from '../features/bonus/ReplayGoal';
import { copy } from '../ui/copy.js';
import { t } from '../i18n.js';
import './JourneyPage.css';

const symbols = ['⌖', '▦', '➤'];
export default function JourneyPage() {
  const { progress, unlockedKeys } = useBonusProgress();
  const { completed, current, complete } = journeyState(progress);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = progress.find(entry => entry.id === selectedId) ?? current ?? progress[0];
  const navigate = useNavigate();
  const words = journeyCopy();
  if (!selected) return null;
  const selectedState = stageState(selected, current?.id);
  const rewardUnlocked = unlockedKeys.includes(selected.key);
  const canPlay = selected.done || selected.unlocked;
  return <main id="hirundu-parcours" className="journey-page">
    <div className="hp-phone">
      <nav className="hp-navigation" aria-label={copy.home}><Link className="hp-home" to="/">← {copy.home}</Link><LanguageSelect /></nav>
      <header className="hp-header">
        <p className="hp-brand">HIRUNDU · {t('title', 'HIRUNDU')}</p>
        <div className="hp-heading"><h2>{words.title}</h2><div className="hp-seal" aria-hidden="true">✦</div></div>
        <p className="hp-subtitle">{complete ? words.all : words.subtitle}</p>
        <div className="hp-summary"><span>{completed} / {progress.length} {words.completed}</span><span>{unlockedKeys.length} {words.cards}</span></div>
        <div className="hp-progress-track" role="progressbar" aria-label={words.completed} aria-valuemin={0} aria-valuemax={progress.length} aria-valuenow={completed}><div style={{ width: `${completed / progress.length * 100}%` }} /></div>
      </header>
      <ol className="hp-journey" aria-label={words.journey}>
        {progress.map(entry => {
          const state = stageState(entry, current?.id), family = stageFamily(entry.id);
          return <li key={entry.id} className={`hp-step hp-${state}`}>
            <button type="button" aria-pressed={selected.id === entry.id} aria-current={state === 'current' ? 'step' : undefined}
              aria-label={`${copy.level} ${entry.id}, ${words[state]}, ${state === 'future' ? words.secret : entry.name}, ${words.modes[family]}`}
              onClick={() => setSelectedId(entry.id)}>
              <span className="hp-medallion" aria-hidden="true">{entry.id}<span className="hp-state-mark">{state === 'done' ? '✓' : state === 'current' || state === 'available' ? '▶' : '?'}</span></span>
              <span>{symbols[family]} {words.modes[family]}</span>
            </button>
          </li>;
        })}
      </ol>
      <section className="hp-detail" aria-live="polite" aria-atomic="true">
        <div className="hp-detail-top"><span>{copy.level} {selected.id} · {words[selectedState]}</span><span>{symbols[stageFamily(selected.id)]} {words.modes[stageFamily(selected.id)]}</span></div>
        <h3>{selectedState === 'future' ? words.secret : selected.name}</h3>
        <p id="hp-description">{selectedState === 'future' ? words.locked : rewardUnlocked ? words.reward : selected.done ? words.pendingReward : words.mission}</p>
        <button id="hp-play" type="button" disabled={!canPlay} onClick={() => { if (canPlay) navigate(`/level/${selected.id}`); }}>
          {!canPlay ? words.unavailable : selected.done ? words.replay : completed === 0 ? words.start : words.play}
        </button>
        {rewardUnlocked && selectedState !== 'future' && <Link className="hp-card-link" to={`/poi/${selected.key}/realmap`}>{words.viewMap} →</Link>}
        {selected.done && <ReplayGoal key={selected.id} level={selected.id}/>}
      </section>
    </div>
  </main>;
}
