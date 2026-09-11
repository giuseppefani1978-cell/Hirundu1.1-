import React, { lazy, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBonusProgress } from '../features/bonus/useBonusProgress';
import { BONUS_MAPS } from '../features/bonus/bonusData';
import LanguageSelect from '../ui/LanguageSelect';
import { copy } from '../ui/copy.js';
import './BonusHubPage.css';
const BonusIndex = lazy(() => import('../features/bonus/BonusIndex'));

export default function BonusHubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { progress, unlockedKeys } = useBonusProgress();
  const [more, setMore] = useState(location.search.includes('hof'));
  const next = progress.find((level) => !level.done && level.unlocked);
  const completed = progress.filter((level) => level.done).length;
  const unlockedKey = (location.state as { unlockedKey?: string } | null)?.unlockedKey;
  return <main className="discoveries">
    <header className="discoveries__nav">
      <button className="app-button app-button--ghost" onClick={() => navigate('/')}>← {copy.home}</button>
      <LanguageSelect />
    </header>
    <section className="discoveries__hero">
      {unlockedKey && <p className="discoveries__success" role="status">✓ {copy.won}</p>}
      <p className="discoveries__eyebrow">HIRUNDU · {completed} / 3</p>
      <h1>{copy.bonus}</h1><p>{copy.bonusLead}</p>
      {next ? <button className="app-button app-button--dark" onClick={() => navigate(`/level/${next.id}`)}>
        ▶ {copy.continue} · {copy.level} {next.id}
      </button> : <><p>{copy.complete}</p><button className="app-button" onClick={() => navigate('/level/1')}>{copy.replay}</button></>}
    </section>
    <section aria-labelledby="maps-title">
      <h2 id="maps-title">{copy.maps}</h2><p>{copy.mapHint}</p>
      <div className="discoveries__maps">{progress.map((level) => {
        const unlocked = unlockedKeys.includes(level.key) || level.done;
        return <article key={level.key} className="discoveries__card">
          <span>{copy.level} {level.id}</span><h3>{BONUS_MAPS[level.key].title}</h3>
          <button className="app-button" disabled={!unlocked} onClick={() => navigate(`/poi/${level.key}/realmap`)}>
            {unlocked ? copy.open : copy.locked}
          </button>
        </article>;
      })}</div>
    </section>
    <section className="discoveries__passport">
      <div><h2>{copy.passport}</h2><p>{copy.passportHint}</p></div>
      <button className="app-button" onClick={() => navigate('/qr')}>{copy.passportOpen}</button>
    </section>
    <details className="discoveries__more" open={more} onToggle={(e) => setMore(e.currentTarget.open)}>
      <summary>{copy.more}</summary>
      {more && <Suspense fallback={<p>{copy.loading}</p>}><BonusIndex /></Suspense>}
    </details>
  </main>;
}
