import { copy } from './ui/copy.js';
import {
  FLOW_PHASES,
  setGameFlowPhase,
  watchRequiredOrientation,
  orientationMatches,
  LANGUAGE_EVENT,
} from './game_flow.js';

// Battle intro is an intentional orientation gate:
// hunt = portrait, battle = landscape on mobile.
// It stays visually connected to the hunt by keeping the game canvas visible.
export function startBattleIntro({
  ammo = {},
  onProceed,
  title = `⚔️ ${copy.battle} · Otranto`,
  subtitle = copy.battleHint,
  startLabel = copy.fight,
  collectibleLabel = copy.battleStars,
  collectibleIcon = '⭐',
  level = null,
  boss = null,
  bossSprite = null,
  backdrop = null,
} = {}) {
  setGameFlowPhase(FLOW_PHASES.BATTLE_INTRO, { level, boss });

  const overlay = document.createElement('div');
  overlay.id = '__battle_intro__';
  overlay.className = 'battle-transition';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', '__battle_intro_title__');

  const scrim = document.createElement('div');
  scrim.className = 'battle-transition__scrim';

  const card = document.createElement('section');
  card.className = 'battle-transition__card';

  const resolveCopy = (value, fallback = '') => {
    const resolved = typeof value === 'function' ? value() : value;
    return resolved ?? fallback;
  };

  const phase = document.createElement('div');
  phase.className = 'battle-transition__phase';
  phase.textContent = copy.huntComplete;

  const visual = document.createElement('div');
  visual.className = 'battle-transition__visual';
  if (backdrop) {
    const png = String(backdrop).replace(/"/g, '%22');
    const webp = /\.png$/i.test(png) ? png.replace(/\.png$/i, '.webp') : png;
    visual.style.backgroundImage = `linear-gradient(180deg,rgba(10,18,32,.12),rgba(10,18,32,.72)),image-set(url("${webp}") type("image/webp"), url("${png}") type("image/png"))`;
  }

  const bossImg = document.createElement('img');
  bossImg.className = 'battle-transition__boss';
  bossImg.alt = boss || '';
  if (bossSprite) {
    bossImg.src = bossSprite;
    visual.appendChild(bossImg);
  }

  const incoming = document.createElement('div');
  incoming.className = 'battle-transition__incoming';
  incoming.textContent = copy.bossIncoming;
  visual.appendChild(incoming);

  const heading = document.createElement('h2');
  heading.id = '__battle_intro_title__';
  heading.className = 'battle-transition__title';
  heading.textContent = resolveCopy(title);

  const orientation = document.createElement('div');
  orientation.id = '__battle_intro_orientation__';
  orientation.className = 'battle-transition__orientation';

  const orientationIcon = document.createElement('div');
  orientationIcon.className = 'battle-transition__phone';
  orientationIcon.textContent = '📱↔️';

  const hint = document.createElement('p');
  hint.className = 'battle-transition__orientation-hint';
  hint.textContent = copy.rotateLandscape || copy.battleOrientation;

  const orientationStatus = document.createElement('p');
  orientationStatus.id = '__battle_orientation_status__';
  orientationStatus.className = 'battle-transition__orientation-status';

  orientation.append(orientationIcon, hint, orientationStatus);

  const supplies = document.createElement('p');
  supplies.className = 'battle-transition__supplies';
  const refreshSupplies = () => {
    supplies.textContent = `${collectibleIcon} ${resolveCopy(collectibleLabel, copy.battleStars)}: ${ammo.stars|0} · 🍩 ${ammo.pasticciotto|0} · 🥟 ${ammo.rustico|0} · ☕ ${ammo.caffe|0}`;
  };
  refreshSupplies();

  const instructions = document.createElement('p');
  instructions.className = 'battle-transition__instructions';
  instructions.textContent = resolveCopy(subtitle, copy.battleHint);

  const button = document.createElement('button');
  button.id = '__battle_start_btn';
  button.type = 'button';
  button.className = 'battle-transition__start';
  button.textContent = resolveCopy(startLabel, copy.fight);

  card.append(phase, visual, heading, orientation, supplies, instructions, button);
  overlay.append(scrim, card);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('mode-battle-intro');
  document.body.append(overlay);

  const reveal = () => overlay.classList.add('is-visible');
  if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(reveal);
  else window.setTimeout(reveal, 0);

  let cleaned = false;
  let removalTimer = 0;
  let isMobile = false;
  let landscapeReady = true;
  let rotationRequestPending = false;
  let armedForLandscape = false;

  const refreshLanguage = () => {
    phase.textContent = copy.huntComplete;
    incoming.textContent = copy.bossIncoming;
    heading.textContent = boss ? `⚔️ ${copy.battle} · ${boss}` : resolveCopy(title);
    hint.textContent = copy.rotateLandscape || copy.battleOrientation;
    instructions.textContent = resolveCopy(subtitle, copy.battleHint);
    button.textContent = resolveCopy(startLabel, copy.fight);
    refreshSupplies();
    if (orientationStatus.dataset.ready === 'true') {
      orientationStatus.textContent = copy.landscapeReady;
    } else if (orientationStatus.textContent) {
      orientationStatus.textContent = copy.rotateLandscape || copy.battleOrientation;
    }
  };
  window.addEventListener(LANGUAGE_EVENT, refreshLanguage);

  const stopOrientationWatch = watchRequiredOrientation('landscape', ({ mobile, matches }) => {
    isMobile = mobile;
    landscapeReady = matches;

    // Android fix: keep the CTA available in portrait so the user gesture can
    // request fullscreen + Screen Orientation API landscape lock.
    button.disabled = !!rotationRequestPending;
    button.setAttribute('aria-disabled', String(!!rotationRequestPending));
    document.body.classList.toggle('mobile-portrait', mobile && !matches);
    overlay.classList.toggle('is-landscape-ready', matches);

    if (!mobile) {
      orientationStatus.textContent = '';
      return;
    }

    orientationStatus.textContent = matches
      ? copy.landscapeReady
      : (copy.rotateLandscape || copy.battleOrientation);
    orientationStatus.dataset.ready = matches ? 'true' : 'false';

    // If the player already tapped "Fight" in portrait, enter the battle as
    // soon as Android reports the landscape viewport.
    if (armedForLandscape && matches && !rotationRequestPending && !cleaned) {
      window.setTimeout(enterBattle, 0);
    }
  });

  function cleanup({ animate = false } = {}) {
    if (!cleaned) {
      cleaned = true;
      stopOrientationWatch?.();
      window.removeEventListener(LANGUAGE_EVENT, refreshLanguage);
      button.removeEventListener('click', proceed);
      document.getElementById('__battle_rotate__')?.remove();
      document.body.classList.remove('mode-battle-intro', 'mobile-portrait');
      document.body.style.overflow = previousOverflow;
    }

    // A later level cleanup must be able to override the cosmetic fade.
    if (removalTimer) {
      window.clearTimeout(removalTimer);
      removalTimer = 0;
    }

    overlay.classList.remove('is-visible');
    if (animate && overlay.isConnected) {
      removalTimer = window.setTimeout(() => {
        removalTimer = 0;
        overlay.remove();
      }, 180);
    } else {
      overlay.remove();
    }
  }

  function enterBattle() {
    if (cleaned) return;
    armedForLandscape = false;
    setGameFlowPhase(FLOW_PHASES.BATTLE, { level, boss });
    cleanup({ animate: true });
    onProceed?.();
  }

  async function requestLandscapeFromGesture() {
    // Chrome/Android generally requires a user gesture and, in browser mode,
    // fullscreen before screen.orientation.lock() is accepted.
    try {
      const root = document.documentElement;
      if (!document.fullscreenElement && root?.requestFullscreen) {
        await root.requestFullscreen();
        window.__HIRUNDU_BATTLE_FULLSCREEN__ = true;
      }
    } catch {}

    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
        window.__HIRUNDU_BATTLE_ORIENTATION_LOCKED__ = true;
      }
    } catch {}

    // Give Android/browser chrome a short time to resize the visual viewport.
    for (const delay of [0, 120, 280, 600]) {
      if (delay) await new Promise(resolve => window.setTimeout(resolve, delay));
      if (orientationMatches('landscape')) return true;
    }
    return false;
  }

  async function proceed() {
    if (cleaned || rotationRequestPending) return;

    if (!isMobile || landscapeReady || orientationMatches('landscape')) {
      enterBattle();
      return;
    }

    armedForLandscape = true;
    rotationRequestPending = true;
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('aria-busy', 'true');

    const rotated = await requestLandscapeFromGesture();

    rotationRequestPending = false;
    button.removeAttribute('aria-busy');
    button.disabled = false;
    button.setAttribute('aria-disabled', 'false');

    if (cleaned) return;
    landscapeReady = orientationMatches('landscape');
    if (rotated || landscapeReady) {
      enterBattle();
      return;
    }

    // Locking can be refused by some Android/browser combinations. In that
    // case keep the intro open and armed: a manual rotation will continue.
    orientationStatus.textContent = copy.rotateLandscape || copy.battleOrientation;
    orientationStatus.dataset.ready = 'false';
    try { navigator.vibrate?.(40); } catch {}
  }

  button.addEventListener('click', proceed);
  button.focus();

  return cleanup;
}
