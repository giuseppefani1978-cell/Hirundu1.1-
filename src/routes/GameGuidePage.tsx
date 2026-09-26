import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSelect from '../ui/LanguageSelect';
import { LANG } from '../i18n.js';
import { attachPractice } from '../legacy/practice.js';
import { withBase } from '../utils/basePath.js';
import '../legacy/practice.css';
import './GameGuidePage.css';

type Family = 'classic' | 'arkanoid' | 'flight';
type PreviewMode = Family | 'battle';

const STORAGE_KEY = 'hirundu_game_guide_v1';

function GameFamilyPreview({
  family,
  label,
}: {
  family: PreviewMode;
  label: string;
}) {
  const sceneClass = `game-guide__preview game-guide__preview--${family}`;
  if (family === 'classic')
    return (
      <div className={sceneClass} role="img" aria-label={label}>
        <img
          className="game-guide__preview-map"
          src={withBase('assets/salento-map.PNG')}
          alt=""
          aria-hidden="true"
        />
        <img
          className="game-guide__preview-bird"
          src={withBase('assets/aracne .PNG')}
          alt=""
          aria-hidden="true"
        />
        <img
          className="game-guide__preview-enemy"
          src={withBase('assets/crow.PNG')}
          alt=""
          aria-hidden="true"
        />
        <i className="game-guide__preview-target">1</i>
        <span className="game-guide__preview-controls" aria-hidden="true">
          ‹ ↑ ›
        </span>
      </div>
    );
  if (family === 'arkanoid')
    return (
      <div className={sceneClass} role="img" aria-label={label}>
        <img
          className="game-guide__preview-map"
          src={withBase('assets/salento-map.PNG')}
          alt=""
          aria-hidden="true"
        />
        <div className="game-guide__preview-walls" aria-hidden="true">
          {Array.from({ length: 12 }, (_, position) => (
            <i key={position} />
          ))}
        </div>
        <i className="game-guide__preview-target">2</i>
        <img
          className="game-guide__preview-bird"
          src={withBase('level4-flight/assets/bird.png')}
          alt=""
          aria-hidden="true"
        />
        <span className="game-guide__preview-trail" aria-hidden="true" />
        <span className="game-guide__preview-paddle" aria-hidden="true" />
      </div>
    );
  if (family === 'battle')
    return (
      <div className={sceneClass} role="img" aria-label={label}>
        <img
          className="game-guide__preview-battle-bg"
          src={withBase('assets/battle_bg_lecce.webp')}
          alt=""
          aria-hidden="true"
        />
        <div className="game-guide__preview-battle-hud" aria-hidden="true">
          <span>ARACNE</span>
          <i><b /></i>
          <span>BOSS</span>
          <i><b /></i>
        </div>
        <img
          className="game-guide__preview-bird"
          src={withBase('assets/aracne .PNG')}
          alt=""
          aria-hidden="true"
        />
        <img
          className="game-guide__preview-boss"
          src={withBase('assets/tarantula .PNG')}
          alt=""
          aria-hidden="true"
        />
        <div className="game-guide__preview-battle-controls" aria-hidden="true">
          <span>←</span><span>↑</span><span>→</span><b>A</b><b>B</b>
        </div>
      </div>
    );
  return (
    <div className={sceneClass} role="img" aria-label={label}>
      <img
        className="game-guide__preview-coast"
        src={withBase('level4-flight/coast.webp')}
        alt=""
        aria-hidden="true"
      />
      <img
        className="game-guide__preview-bird"
        src={withBase('level4-flight/assets/bird.png')}
        alt=""
        aria-hidden="true"
      />
      <img
        className="game-guide__preview-enemy"
        src={withBase('level4-flight/assets/crow.png')}
        alt=""
        aria-hidden="true"
      />
      <i
        className="game-guide__preview-obstacle game-guide__preview-obstacle--one"
        aria-hidden="true"
      />
      <i
        className="game-guide__preview-obstacle game-guide__preview-obstacle--two"
        aria-hidden="true"
      />
      <i className="game-guide__preview-target">3</i>
      <span className="game-guide__preview-controls" aria-hidden="true">
        ← ↑ →
      </span>
    </div>
  );
}

const copy = {
  fr: {
    guide: 'Guide du jeu',
    back: 'Retour à l’accueil',
    skip: 'Passer',
    previous: 'Précédent',
    next: 'Continuer',
    finish: 'Commencer l’aventure',
    step: 'Étape',
    practice: 'Choisis une famille puis ouvre l’entraînement.',
    safe: 'Cet exercice n’ajoute ni point, ni victoire, ni visite.',
    families: {
      classic: 'Chasse classique',
      arkanoid: 'Chasse à rebonds',
      flight: 'Vol vertical',
    },
    familyDetails: {
      classic: {
        levels: 'Niveaux 1, 2 et 9',
        description:
          'Déplace Aracne sur la carte, lis l’énigme et rejoins le lieu qui lui correspond.',
        cue: 'Explore, observe, trouve la bonne cible.',
        alt: 'Exemple de chasse classique avec Aracne, une cible et un ennemi sur la carte',
      },
      arkanoid: {
        levels: 'Niveaux 3, 5 et 7',
        description:
          'Déplace la barre, lance Aracne puis replace la barre sous lui pour enchaîner les rebonds. Les bords orientent sa trajectoire.',
        cue: 'Fais rebondir Aracne, brise les murs, vise le bon lieu.',
        alt: 'Exemple de chasse à rebonds avec Aracne, une barre et des murs à briser',
      },
      flight: {
        levels: 'Niveaux 4, 6 et 8',
        description:
          'Maintiens les flèches pour piloter Aracne. Le décor avance tout seul : évite les obstacles et rejoins la cible.',
        cue: 'Pilote Aracne, le paysage défile automatiquement.',
        alt: 'Exemple de vol vertical avec Aracne, des obstacles et une cible',
      },
    },
    battle: {
      title: 'Bataille',
      when: 'Après les dix découvertes de chaque niveau',
      description:
        'Tourne le téléphone en paysage. Déplace Aracne, évite les attaques du boss et utilise A, B et les bonus récoltés pour riposter.',
      cue: 'Survis aux attaques, puis frappe lorsque le boss devient vulnérable.',
      alt: 'Exemple de bataille en paysage avec Aracne, un boss, les jauges de vie et les commandes de combat',
    },
    steps: [
      {
        icon: '⌖',
        title: 'Ton voyage',
        text: 'Explore neuf territoires du Salento. Chaque niveau propose une chasse, puis une bataille contre le boss du territoire.',
        bullets: [
          'Niveaux 1, 2 et 9 : chasse classique',
          'Niveaux 3, 5 et 7 : chasse à rebonds',
          'Niveaux 4, 6 et 8 : vol vertical',
        ],
      },
      {
        icon: '✦',
        title: 'Apprends en jouant',
        text: 'Les commandes changent selon la famille. Fais le véritable exercice interactif avant de commencer.',
        bullets: [
          'Déplacer Aracne',
          'Réussir un rebond avec la barre',
          'Rejoindre la cible indiquée',
        ],
      },
      {
        icon: '⚔',
        title: 'Chasse, puis bataille',
        text: 'Lis l’énigme de Tarantula et rejoins le bon lieu. Dix découvertes ouvrent la bataille.',
        bullets: [
          'Évite ennemis et obstacles',
          'Ramasse les bonus alimentaires',
          'Tourne le téléphone lorsque la bataille le demande',
        ],
      },
      {
        icon: '◇',
        title: 'Tes découvertes',
        text: 'Une victoire révèle la carte culturelle du territoire : illustration, anecdote et accès à sa carte réelle.',
        bullets: [
          'Les cartes secrètes restent masquées',
          'Rejouer ne retire aucune découverte',
          'Le souvenir gagné dans le jeu reste protégé',
        ],
      },
      {
        icon: '▤',
        title: 'Du jeu au monde réel',
        text: 'Collection et passeport sont distincts. Posséder une carte ne prouve jamais une visite.',
        bullets: [
          'QR partenaire autorisé : carte + visite du lieu',
          'Carte physique : carte seulement',
          'Échange : carte seulement',
        ],
      },
      {
        icon: '⇄',
        title: 'Échange tes doubles',
        text: 'Affiche une offre sur un téléphone. L’autre joueur la scanne, accepte, puis montre le reçu à l’expéditeur.',
        bullets: [
          'Deux téléphones, aucun compte',
          'Offre valable quinze minutes',
          'Un échange ne débloque ni niveau ni visite',
        ],
      },
    ],
  },
  it: {
    guide: 'Guida al gioco',
    back: 'Torna alla home',
    skip: 'Salta',
    previous: 'Indietro',
    next: 'Continua',
    finish: 'Inizia l’avventura',
    step: 'Tappa',
    practice: 'Scegli una famiglia e apri l’allenamento.',
    safe: 'L’esercizio non aggiunge punti, vittorie o visite.',
    families: {
      classic: 'Caccia classica',
      arkanoid: 'Caccia a rimbalzi',
      flight: 'Volo verticale',
    },
    familyDetails: {
      classic: {
        levels: 'Livelli 1, 2 e 9',
        description:
          'Muovi Aracne sulla mappa, leggi l’enigma e raggiungi il luogo corrispondente.',
        cue: 'Esplora, osserva, trova il bersaglio giusto.',
        alt: 'Esempio di caccia classica con Aracne, un bersaglio e un nemico sulla mappa',
      },
      arkanoid: {
        levels: 'Livelli 3, 5 e 7',
        description:
          'Muovi la barra, lancia Aracne e rimettila sotto di lui per continuare i rimbalzi. I bordi ne orientano la traiettoria.',
        cue: 'Fai rimbalzare Aracne, rompi i muri, mira al luogo giusto.',
        alt: 'Esempio di caccia a rimbalzi con Aracne, una barra e muri da rompere',
      },
      flight: {
        levels: 'Livelli 4, 6 e 8',
        description:
          'Tieni premute le frecce per pilotare Aracne. Lo scenario scorre da solo: evita gli ostacoli e raggiungi il bersaglio.',
        cue: 'Pilota Aracne mentre il paesaggio scorre automaticamente.',
        alt: 'Esempio di volo verticale con Aracne, ostacoli e un bersaglio',
      },
    },
    battle: {
      title: 'Battaglia',
      when: 'Dopo le dieci scoperte di ogni livello',
      description:
        'Ruota il telefono in orizzontale. Muovi Aracne, evita gli attacchi del boss e usa A, B e i bonus raccolti per contrattaccare.',
      cue: 'Resisti agli attacchi, poi colpisci quando il boss è vulnerabile.',
      alt: 'Esempio di battaglia orizzontale con Aracne, un boss, le barre di energia e i comandi di combattimento',
    },
    steps: [
      {
        icon: '⌖',
        title: 'Il tuo viaggio',
        text: 'Esplora nove territori del Salento. Ogni livello propone una caccia e poi la battaglia contro il boss.',
        bullets: [
          'Livelli 1, 2 e 9: caccia classica',
          'Livelli 3, 5 e 7: caccia a rimbalzi',
          'Livelli 4, 6 e 8: volo verticale',
        ],
      },
      {
        icon: '✦',
        title: 'Impara giocando',
        text: 'I comandi cambiano secondo la famiglia. Prova il vero esercizio interattivo prima di iniziare.',
        bullets: [
          'Muovere Aracne',
          'Riuscire in un rimbalzo con la barra',
          'Raggiungere il bersaglio indicato',
        ],
      },
      {
        icon: '⚔',
        title: 'Caccia, poi battaglia',
        text: 'Leggi l’enigma di Tarantula e raggiungi il luogo giusto. Dieci scoperte aprono la battaglia.',
        bullets: [
          'Evita nemici e ostacoli',
          'Raccogli i bonus alimentari',
          'Ruota il telefono quando richiesto',
        ],
      },
      {
        icon: '◇',
        title: 'Le tue scoperte',
        text: 'La vittoria rivela la carta culturale del territorio con immagine, aneddoto e mappa reale.',
        bullets: [
          'Le carte segrete restano nascoste',
          'Rigiocare non cancella le scoperte',
          'Il ricordo vinto nel gioco resta protetto',
        ],
      },
      {
        icon: '▤',
        title: 'Dal gioco al mondo reale',
        text: 'Collezione e passaporto sono distinti. Possedere una carta non prova una visita.',
        bullets: [
          'QR partner autorizzato: carta + visita',
          'Carta fisica: solo carta',
          'Scambio: solo carta',
        ],
      },
      {
        icon: '⇄',
        title: 'Scambia i doppioni',
        text: 'Mostra l’offerta su un telefono. L’altro giocatore la scansiona, accetta e mostra la ricevuta.',
        bullets: [
          'Due telefoni, nessun account',
          'Offerta valida quindici minuti',
          'Lo scambio non sblocca livelli o visite',
        ],
      },
    ],
  },
  en: {
    guide: 'Game guide',
    back: 'Back to home',
    skip: 'Skip',
    previous: 'Previous',
    next: 'Continue',
    finish: 'Start the adventure',
    step: 'Step',
    practice: 'Choose a family, then open its practice.',
    safe: 'Practice adds no score, victory or visit.',
    families: {
      classic: 'Classic hunt',
      arkanoid: 'Rebound hunt',
      flight: 'Vertical flight',
    },
    familyDetails: {
      classic: {
        levels: 'Levels 1, 2 and 9',
        description:
          'Move Aracne across the map, read the clue and reach the place that matches it.',
        cue: 'Explore, observe and find the right target.',
        alt: 'Classic hunt example with Aracne, a target and an enemy on the map',
      },
      arkanoid: {
        levels: 'Levels 3, 5 and 7',
        description:
          'Move the paddle, launch Aracne, then keep the paddle beneath him to continue bouncing. Its edges steer his path.',
        cue: 'Bounce Aracne, break the walls and aim for the right place.',
        alt: 'Rebound hunt example with Aracne, a paddle and walls to break',
      },
      flight: {
        levels: 'Levels 4, 6 and 8',
        description:
          'Hold the arrows to steer Aracne. The scenery scrolls by itself: avoid obstacles and reach the target.',
        cue: 'Steer Aracne while the scenery scrolls automatically.',
        alt: 'Vertical flight example with Aracne, obstacles and a target',
      },
    },
    battle: {
      title: 'Battle',
      when: 'After the ten discoveries in every level',
      description:
        'Turn the phone sideways. Move Aracne, dodge the boss attacks, then use A, B and the bonuses you collected to strike back.',
      cue: 'Survive the attacks, then strike while the boss is vulnerable.',
      alt: 'Landscape battle example with Aracne, a boss, health bars and combat controls',
    },
    steps: [
      {
        icon: '⌖',
        title: 'Your journey',
        text: 'Explore nine Salento territories. Each level has a hunt followed by a battle against its boss.',
        bullets: [
          'Levels 1, 2 and 9: classic hunt',
          'Levels 3, 5 and 7: rebound hunt',
          'Levels 4, 6 and 8: vertical flight',
        ],
      },
      {
        icon: '✦',
        title: 'Learn by playing',
        text: 'Controls change with each family. Try the real interactive practice before starting.',
        bullets: [
          'Move Aracne',
          'Bounce on the paddle',
          'Reach the marked target',
        ],
      },
      {
        icon: '⚔',
        title: 'Hunt, then battle',
        text: 'Read Tarantula’s clue and reach the right place. Ten discoveries open the battle.',
        bullets: [
          'Avoid enemies and obstacles',
          'Collect food bonuses',
          'Rotate your phone when battle asks',
        ],
      },
      {
        icon: '◇',
        title: 'Your discoveries',
        text: 'Victory reveals the territory’s cultural card with an illustration, short fact and real map.',
        bullets: [
          'Secret cards stay hidden',
          'Replaying removes nothing',
          'Your in-game souvenir stays protected',
        ],
      },
      {
        icon: '▤',
        title: 'From game to real world',
        text: 'Collection and passport are separate. Owning a card never proves a visit.',
        bullets: [
          'Authorised partner QR: card + place visit',
          'Physical card: card only',
          'Trade: card only',
        ],
      },
      {
        icon: '⇄',
        title: 'Trade your duplicates',
        text: 'Show an offer on one phone. The other player scans, accepts and shows the receipt back.',
        bullets: [
          'Two phones, no account',
          'Offer valid for fifteen minutes',
          'A trade unlocks no level or visit',
        ],
      },
    ],
  },
  es: {
    guide: 'Guía del juego',
    back: 'Volver al inicio',
    skip: 'Omitir',
    previous: 'Anterior',
    next: 'Continuar',
    finish: 'Empezar la aventura',
    step: 'Etapa',
    practice: 'Elige una familia y abre el entrenamiento.',
    safe: 'El ejercicio no añade puntos, victorias ni visitas.',
    families: {
      classic: 'Caza clásica',
      arkanoid: 'Caza de rebotes',
      flight: 'Vuelo vertical',
    },
    familyDetails: {
      classic: {
        levels: 'Niveles 1, 2 y 9',
        description:
          'Mueve a Aracne por el mapa, lee la pista y alcanza el lugar que le corresponde.',
        cue: 'Explora, observa y encuentra el objetivo correcto.',
        alt: 'Ejemplo de caza clásica con Aracne, un objetivo y un enemigo en el mapa',
      },
      arkanoid: {
        levels: 'Niveles 3, 5 y 7',
        description:
          'Mueve la barra, lanza a Aracne y vuelve a colocarla debajo para encadenar los rebotes. Los bordes orientan su trayectoria.',
        cue: 'Haz rebotar a Aracne, rompe los muros y apunta al lugar correcto.',
        alt: 'Ejemplo de caza de rebotes con Aracne, una barra y muros que romper',
      },
      flight: {
        levels: 'Niveles 4, 6 y 8',
        description:
          'Mantén pulsadas las flechas para pilotar a Aracne. El escenario avanza solo: evita obstáculos y alcanza el objetivo.',
        cue: 'Pilota a Aracne mientras el paisaje se desplaza automáticamente.',
        alt: 'Ejemplo de vuelo vertical con Aracne, obstáculos y un objetivo',
      },
    },
    battle: {
      title: 'Batalla',
      when: 'Después de los diez descubrimientos de cada nivel',
      description:
        'Gira el teléfono en horizontal. Mueve a Aracne, evita los ataques del jefe y utiliza A, B y los bonus recogidos para responder.',
      cue: 'Resiste los ataques y golpea cuando el jefe sea vulnerable.',
      alt: 'Ejemplo de batalla horizontal con Aracne, un jefe, barras de energía y controles de combate',
    },
    steps: [
      {
        icon: '⌖',
        title: 'Tu viaje',
        text: 'Explora nueve territorios del Salento. Cada nivel tiene una caza y una batalla contra su jefe.',
        bullets: [
          'Niveles 1, 2 y 9: caza clásica',
          'Niveles 3, 5 y 7: caza de rebotes',
          'Niveles 4, 6 y 8: vuelo vertical',
        ],
      },
      {
        icon: '✦',
        title: 'Aprende jugando',
        text: 'Los controles cambian según la familia. Prueba el ejercicio interactivo real antes de empezar.',
        bullets: [
          'Mover a Aracne',
          'Rebotar con la barra',
          'Alcanzar el objetivo indicado',
        ],
      },
      {
        icon: '⚔',
        title: 'Caza y después batalla',
        text: 'Lee la pista de Tarantula y alcanza el lugar correcto. Diez descubrimientos abren la batalla.',
        bullets: [
          'Evita enemigos y obstáculos',
          'Recoge bonus de comida',
          'Gira el teléfono cuando se indique',
        ],
      },
      {
        icon: '◇',
        title: 'Tus descubrimientos',
        text: 'La victoria revela la tarjeta cultural del territorio con imagen, anécdota y mapa real.',
        bullets: [
          'Las tarjetas secretas siguen ocultas',
          'Repetir no elimina descubrimientos',
          'El recuerdo ganado queda protegido',
        ],
      },
      {
        icon: '▤',
        title: 'Del juego al mundo real',
        text: 'Colección y pasaporte son distintos. Tener una tarjeta nunca demuestra una visita.',
        bullets: [
          'QR autorizado: tarjeta + visita',
          'Tarjeta física: solo tarjeta',
          'Intercambio: solo tarjeta',
        ],
      },
      {
        icon: '⇄',
        title: 'Intercambia duplicados',
        text: 'Muestra una oferta en un teléfono. El otro jugador la escanea, acepta y devuelve el recibo.',
        bullets: [
          'Dos teléfonos, sin cuenta',
          'Oferta válida quince minutos',
          'Intercambiar no desbloquea niveles ni visitas',
        ],
      },
    ],
  },
} as const;

export default function GameGuidePage() {
  const navigate = useNavigate();
  const language = (LANG in copy ? LANG : 'fr') as keyof typeof copy;
  const t = copy[language];
  const [index, setIndex] = useState(0);
  const [family, setFamily] = useState<Family>('classic');
  const practiceHost = useRef<HTMLDivElement>(null);
  const current = t.steps[index];
  const last = index === t.steps.length - 1;

  useEffect(() => {
    if (index !== 1 || !practiceHost.current) return undefined;
    const practice = attachPractice({
      host: practiceHost.current,
      family,
      sprite: withBase('level4-flight/assets/bird.png'),
    });
    return () => practice.dispose();
  }, [family, index]);

  function leave(status: 'completed' | 'skipped') {
    try {
      window.localStorage.setItem(STORAGE_KEY, status);
    } catch {
      /* guide remains usable */
    }
    navigate('/');
  }

  return (
    <main className="game-guide">
      <div className="game-guide__shell">
        <nav className="game-guide__top">
          <button
            type="button"
            className="game-guide__text-button"
            onClick={() => navigate('/')}
          >
            ← {t.back}
          </button>
          <LanguageSelect />
        </nav>

        <header className="game-guide__progress">
          <div>
            <span>HIRUNDU</span>
            <strong>{t.guide}</strong>
          </div>
          <p>
            {t.step} {index + 1} / {t.steps.length}
          </p>
          <div className="game-guide__bar" aria-hidden="true">
            <span
              style={{ width: `${((index + 1) / t.steps.length) * 100}%` }}
            />
          </div>
        </header>

        <article className="game-guide__card" aria-live="polite">
          <div className="game-guide__icon" aria-hidden="true">
            {current.icon}
          </div>
          <h1>{current.title}</h1>
          <p className="game-guide__lead">{current.text}</p>
          <ul>
            {current.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          {index === 1 ? (
            <section className="game-guide__practice" aria-label={t.practice}>
              <p>{t.practice}</p>
              <div className="game-guide__families">
                {(Object.keys(t.families) as Family[]).map((id) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={family === id}
                    onClick={() => setFamily(id)}
                  >
                    <GameFamilyPreview
                      family={id}
                      label={t.familyDetails[id].alt}
                    />
                    <span>
                      <strong>{t.families[id]}</strong>
                      <small>{t.familyDetails[id].levels}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="game-guide__family-detail" aria-live="polite">
                <strong>{t.families[family]}</strong>
                <p>{t.familyDetails[family].description}</p>
                <small>{t.familyDetails[family].cue}</small>
              </div>
              <div ref={practiceHost} className="game-guide__practice-launch" />
              <small>{t.safe}</small>
            </section>
          ) : null}

          {index === 2 ? (
            <section className="game-guide__battle-card">
              <GameFamilyPreview family="battle" label={t.battle.alt} />
              <div>
                <strong>{t.battle.title}</strong>
                <small>{t.battle.when}</small>
                <p>{t.battle.description}</p>
                <em>{t.battle.cue}</em>
              </div>
            </section>
          ) : null}

          {index === 4 ? (
            <div className="game-guide__rule-grid" aria-label={current.title}>
              <span>
                <b>QR</b>
                <small>{current.bullets[0]}</small>
              </span>
              <span>
                <b>▣</b>
                <small>{current.bullets[1]}</small>
              </span>
              <span>
                <b>⇄</b>
                <small>{current.bullets[2]}</small>
              </span>
            </div>
          ) : null}
        </article>

        <footer className="game-guide__actions">
          <button
            type="button"
            className="game-guide__skip"
            onClick={() => leave('skipped')}
          >
            {t.skip}
          </button>
          <div>
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((value) => value - 1)}
              >
                {t.previous}
              </button>
            ) : null}
            <button
              type="button"
              className="game-guide__primary"
              onClick={() =>
                last ? leave('completed') : setIndex((value) => value + 1)
              }
            >
              {last ? t.finish : t.next}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
