import { copy } from './ui/copy.js';
import {
  FLOW_PHASES,
  setGameFlowPhase,
  watchRequiredOrientation,
} from './game_flow.js';

// Battle intro is an intentional orientation gate:
// hunt = portrait, battle = landscape on mobile.
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
} = {}) {
  setGameFlowPhase(FLOW_PHASES.BATTLE_INTRO, { level, boss });

  const overlay = document.createElement('div');
  overlay.id = '__battle_intro__';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', '__battle_intro_title__');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10005;display:grid;place-items:center;background:#141420;color:white;padding:20px;overflow:auto;text-align:center';

  const card = document.createElement('section');
  card.style.cssText = 'width:min(640px,94vw);padding:24px;border:1px solid #ffffff44;border-radius:20px;background:#252535;box-shadow:0 24px 70px rgba(0,0,0,.4)';

  const heading = document.createElement('h2');
  heading.id = '__battle_intro_title__';
  heading.textContent = title;

  const orientation = document.createElement('div');
  orientation.id = '__battle_intro_orientation__';
  orientation.style.cssText = 'margin:14px 0;padding:14px;border-radius:14px;background:#171725;border:1px solid #ffffff22';

  const orientationIcon = document.createElement('div');
  orientationIcon.style.cssText = 'font-size:38px;line-height:1;margin-bottom:8px';
  orientationIcon.textContent = '📱↔️';

  const hint = document.createElement('p');
  hint.style.cssText = 'margin:0;font:700 16px/1.4 system-ui';
  hint.textContent = copy.rotateLandscape || copy.battleOrientation;

  const orientationStatus = document.createElement('p');
  orientationStatus.id = '__battle_orientation_status__';
  orientationStatus.style.cssText = 'margin:8px 0 0;font:600 13px/1.35 system-ui;color:#f8d66d';

  orientation.append(orientationIcon, hint, orientationStatus);

  const supplies = document.createElement('p');
  supplies.textContent = `${collectibleIcon} ${collectibleLabel}: ${ammo.stars|0} · 🍩 Pasticciotto: ${ammo.pasticciotto|0} · 🥟 Rustico: ${ammo.rustico|0} · ☕ Caffè: ${ammo.caffe|0}`;

  const instructions = document.createElement('p');
  instructions.textContent = subtitle;

  const button = document.createElement('button');
  button.id = '__battle_start_btn';
  button.type = 'button';
  button.textContent = startLabel;
  button.style.cssText = 'padding:14px 20px;border:0;border-radius:12px;background:#ffd166;color:#302000;font:700 18px system-ui;cursor:pointer;transition:opacity .18s ease,transform .18s ease';

  card.append(heading, orientation, supplies, instructions, button);
  overlay.append(card);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('mode-battle-intro');
  document.body.append(overlay);

  let cleaned = false;
  let canProceed = true;

  const stopOrientationWatch = watchRequiredOrientation('landscape', ({ mobile, matches }) => {
    canProceed = matches;
    button.disabled = !matches;
    button.setAttribute('aria-disabled', String(!matches));
    button.style.opacity = matches ? '1' : '.45';
    button.style.cursor = matches ? 'pointer' : 'not-allowed';
    document.body.classList.toggle('mobile-portrait', mobile && !matches);

    if (!mobile) {
      orientationStatus.textContent = '';
      return;
    }
    orientationStatus.textContent = matches
      ? copy.landscapeReady
      : (copy.rotateLandscape || copy.battleOrientation);
    orientationStatus.style.color = matches ? '#86efac' : '#f8d66d';
  });

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    stopOrientationWatch?.();
    button.removeEventListener('click', proceed);
    overlay.remove();
    document.getElementById('__battle_rotate__')?.remove();
    document.body.classList.remove('mode-battle-intro', 'mobile-portrait');
    document.body.style.overflow = previousOverflow;
  }

  function proceed() {
    if (cleaned || !canProceed) return;
    setGameFlowPhase(FLOW_PHASES.BATTLE, { level, boss });
    cleanup();
    onProceed?.();
  }

  button.addEventListener('click', proceed);
  if (!button.disabled) button.focus();

  return cleanup;
}
