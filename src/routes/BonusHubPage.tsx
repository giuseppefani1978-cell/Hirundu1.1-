import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBonusProgress } from '../features/bonus/useBonusProgress';
import { BONUS_MAPS, type BonusKey } from '../features/bonus/bonusData';
import LanguageSelect from '../ui/LanguageSelect';
import DiscoveryCard from '../features/bonus/DiscoveryCard';
import { collectionCopy } from '../features/bonus/collectionCopy';
import '../features/bonus/PassportCollection.css';
import { copy } from '../ui/copy.js';
import { LANG } from '../i18n.js';
import { getCardOrigins, readCardInventory } from '../features/bonus/cardTrade';
import './BonusHubPage.css';
const Rankings = lazy(() => import('../features/bonus/HallOfFameSection'));
import '../features/bonus/BonusIndex.css';

type CardFilter = 'all' | 'game' | 'exchange';

const cardCollectionLabels = {
  fr: {
    title: 'Mes cartes',
    lead: 'Toutes les cartes que tu possèdes restent ici, quelle que soit leur origine.',
    all: 'Toutes',
    game: 'Gagnées dans le jeu',
    exchange: 'Acquises par échange',
    empty: 'Aucune carte dans cette catégorie.',
  },
  it: {
    title: 'Le mie carte',
    lead: 'Tutte le carte che possiedi restano qui, qualunque sia la loro origine.',
    all: 'Tutte',
    game: 'Vinte nel gioco',
    exchange: 'Acquisite con scambio',
    empty: 'Nessuna carta in questa categoria.',
  },
  en: {
    title: 'My cards',
    lead: 'Every card you own stays here, whatever its origin.',
    all: 'All',
    game: 'Earned in the game',
    exchange: 'Acquired by trade',
    empty: 'No cards in this category.',
  },
  es: {
    title: 'Mis tarjetas',
    lead: 'Todas las tarjetas que posees permanecen aquí, sea cual sea su origen.',
    all: 'Todas',
    game: 'Ganadas en el juego',
    exchange: 'Adquiridas por intercambio',
    empty: 'No hay tarjetas en esta categoría.',
  },
} as const;

export default function BonusHubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { progress, unlockedKeys } = useBonusProgress();
  const [more, setMore] = useState(location.search.includes('hof'));
  const [inventory, setInventory] = useState(readCardInventory);
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const language = (LANG in cardCollectionLabels ? LANG : 'fr') as keyof typeof cardCollectionLabels;
  const cardLabels = cardCollectionLabels[language];

  useEffect(() => {
    const refreshCards = () => setInventory(readCardInventory());
    window.addEventListener('hirundu:cards', refreshCards);
    window.addEventListener('storage', refreshCards);
    return () => {
      window.removeEventListener('hirundu:cards', refreshCards);
      window.removeEventListener('storage', refreshCards);
    };
  }, []);

  const inventoryCards = (Object.entries(inventory.cards) as [BonusKey, number][])
    .filter(([, count]) => count > 0)
    .map(([key, count]) => {
      const origins = getCardOrigins(inventory, key);
      const acquiredBy: Array<'game' | 'exchange'> = [];
      if ((origins.game ?? 0) > 0) acquiredBy.push('game');
      if ((origins.exchange ?? 0) > 0) acquiredBy.push('exchange');
      return { key, count, origins, acquiredBy };
    })
    .filter((card) => cardFilter === 'all' || (card.origins[cardFilter] ?? 0) > 0)
    .sort((a, b) => BONUS_MAPS[a.key].title.localeCompare(BONUS_MAPS[b.key].title));

  const next = progress.find((level) => !level.done && level.unlocked);
  const completed = progress.filter((level) => level.done).length;
  const unlockedKey = (location.state as { unlockedKey?: string } | null)?.unlockedKey;
  const featured = progress.find(level=>level.key===unlockedKey&&level.done) || [...progress].reverse().find(level=>level.done);
  const collection = collectionCopy();
  return <main className="discoveries">
    <header className="discoveries__nav">
      <button className="app-button app-button--ghost" onClick={() => navigate('/')}>← {copy.home}</button>
      <LanguageSelect />
    </header>
    <section className="discoveries__hero">
      {unlockedKey && <p className="discoveries__success" role="status">✓ {copy.won}</p>}
      <p className="discoveries__eyebrow">HIRUNDU · {completed} / {progress.length}</p>
      <h1>{copy.bonus}</h1><p>{copy.bonusLead}</p>
      {next ? <button className="app-button app-button--dark" onClick={() => navigate(`/level/${next.id}`)}>
        ▶ {copy.continue} · {copy.level} {next.id}
      </button> : <><p>{copy.complete}</p><button className="app-button" onClick={() => navigate('/level/1')}>{copy.replay}</button></>}
    </section>
    <section className="discoveries__collection-nav" aria-label={copy.cardTrade}>
      <button className="discoveries__collection-action discoveries__collection-action--trade" onClick={() => navigate('/card-trade')}>
        <span className="discoveries__collection-icon" aria-hidden="true">⇄</span>
        <span><strong>{copy.cardTrade}</strong><small>{copy.cardTradeHint}</small></span>
        <span aria-hidden="true">›</span>
      </button>
      <button className="discoveries__collection-action" onClick={() => navigate('/passport')}>
        <span className="discoveries__collection-icon" aria-hidden="true">▤</span>
        <span><strong>{copy.passport}</strong><small>{copy.passportHint}</small></span>
        <span aria-hidden="true">›</span>
      </button>
    </section>
    <section className="discoveries__inventory" aria-labelledby="my-cards-title">
      <div className="discoveries__inventory-heading">
        <div>
          <h2 id="my-cards-title">{cardLabels.title}</h2>
          <p>{cardLabels.lead}</p>
        </div>
        <strong>{Object.values(inventory.cards).reduce((sum, count) => sum + Number(count || 0), 0)}</strong>
      </div>
      <div className="discoveries__card-tabs" role="tablist" aria-label={cardLabels.title}>
        {([
          ['all', cardLabels.all],
          ['game', cardLabels.game],
          ['exchange', cardLabels.exchange],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={cardFilter === id}
            className={cardFilter === id ? 'is-active' : ''}
            onClick={() => setCardFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {inventoryCards.length ? (
        <div className="discoveries__inventory-grid">
          {inventoryCards.map(({ key, count, acquiredBy }) => (
            <DiscoveryCard key={key} mapKey={key} earned acquiredBy={acquiredBy} count={count} />
          ))}
        </div>
      ) : <p className="discoveries__inventory-empty">{cardLabels.empty}</p>}
    </section>
    {featured && <section className="discoveries__spotlight">
      <h2>{featured.key===unlockedKey ? collection[0] : collection[14]}</h2>
      <DiscoveryCard mapKey={featured.key} earned/>
      <div className="discoveries__spotlight-actions">
        <button className="app-button app-button--dark" onClick={()=>navigate('/level/'+featured.id)}>↻ {copy.replay} · {copy.level} {featured.id}</button>
        <button className="app-button" onClick={()=>navigate('/passport/'+featured.key)}>{collection[12]} · {completed} / {progress.length}</button>
      </div>
    </section>}
    <section aria-labelledby="maps-title">
      <h2 id="maps-title">{copy.maps}</h2><p>{copy.mapHint}</p>
      <div className="discoveries__maps">{progress.map((level) => {
        const unlocked = unlockedKeys.includes(level.key) || level.done;
        return <article key={level.key} className="discoveries__card">
          <span>{copy.level} {level.id}</span><h3>{BONUS_MAPS[level.key].title}</h3>
          <DiscoveryCard mapKey={level.key} earned={level.done}/>
          <div className="discoveries__card-actions">
            <button className="app-button" disabled={!unlocked} onClick={() => navigate(`/poi/${level.key}/realmap`)}>
              {unlocked ? copy.open : copy.locked}
            </button>
            {level.done ? <button className="app-button app-button--ghost" onClick={() => navigate(`/level/${level.id}`)}>↻ {copy.replay}</button> : null}
          </div>
        </article>;
      })}</div>
    </section>
    <section className="discoveries__passport">
      <div><h2>{copy.passport}</h2><p>{copy.passportHint}</p></div>
      <button className="app-button" onClick={() => navigate('/passport/otranto')}>{copy.passportOpen}</button>
    </section>
    <details className="discoveries__more" open={more} onToggle={(e) => setMore(e.currentTarget.open)}>
      <summary>{copy.more}</summary>
      {more && <Suspense fallback={<p>{copy.loading}</p>}><Rankings /></Suspense>}
    </details>
  </main>;
}
