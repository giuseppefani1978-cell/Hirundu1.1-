import { Link, useLocation, useNavigate } from 'react-router-dom';
import TestShortcuts from '../ui/TestShortcuts';
import LanguageSelect from '../ui/LanguageSelect';
import { copy } from '../ui/copy.js';
import { t } from '../i18n.js';
import { useBonusProgress } from '../features/bonus/useBonusProgress';
import { journeyState } from '../features/bonus/journeyState';
import { journeyCopy } from '../ui/journeyCopy';
import OriginalStartPage from './OriginalStartPage';
import './StartPage.css';

export default function StartPage() {
  const location = useLocation();
  if (new URLSearchParams(location.search).get('home') === 'original') return <OriginalStartPage />;
  return <PlayerHome />;
}
function PlayerHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { progress } = useBonusProgress();
  const { completed, current, complete } = journeyState(progress);
  const words = journeyCopy();
  return <main className="start-page start-page--player">
    <div className="start-page__hero"><div className="start-page__content">
      <div className="start-page__top"><span>HIRUNDU</span><LanguageSelect /></div>
      <p className="start-page__eyebrow">{t('title', 'HIRUNDU')}</p>
      <h1 className="start-page__title">{complete ? copy.complete : copy.ready}</h1>
      <p className="start-page__lead">{complete ? words.all : copy.lead}</p>
      <div className="start-page__resume"><span>{current ? words.nextHunt : words.journeyLink}</span><strong>{current ? `${copy.level} ${current.id} / ${progress.length}` : `${completed} / ${progress.length}`}</strong></div>
      {current && <p className="start-page__territory">{current.name}</p>}
      <button type="button" className="start-page__play" onClick={() => navigate(current ? `/level/${current.id}` : '/journey')}>
        {current ? completed > 0 ? copy.continue : copy.start : words.chooseReplay}<span aria-hidden="true">↗</span>
      </button>
      <nav className="start-page__links" aria-label={words.journeyLink}>
        <Link to="/journey"><span aria-hidden="true">⌖</span>{words.journeyLink}<span aria-hidden="true">›</span></Link>
        <Link to="/bonus" state={{ fromIntro: true }}><span aria-hidden="true">◇</span>{copy.bonus}<span aria-hidden="true">›</span></Link>
        <Link to="/passport"><span aria-hidden="true">▤</span>{words.passport}<span aria-hidden="true">›</span></Link>
        <Link to="/settings"><span aria-hidden="true">⚙</span>{t('settings', 'Réglages')}<span aria-hidden="true">›</span></Link>
      </nav>
      {new URLSearchParams(location.search).has('debug') && <TestShortcuts />}
    </div></div>
  </main>;
}
