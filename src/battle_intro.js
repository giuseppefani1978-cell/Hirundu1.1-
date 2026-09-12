import { copy } from './ui/copy.js';

// Explicit, gesture-driven start. No timer or portrait gate can strand the player.
export function startBattleIntro({ ammo = {}, onProceed, title = `⚔️ ${copy.battle} · Otranto`, subtitle = copy.battleHint, startLabel = copy.fight } = {}) {
  const overlay = document.createElement('div');
  overlay.id = '__battle_intro__';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', '__battle_intro_title__');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10005;display:grid;place-items:center;background:#141420;color:white;padding:20px;overflow:auto;text-align:center';
  const card = document.createElement('section');
  card.style.cssText = 'max-width:640px;padding:24px;border:1px solid #ffffff44;border-radius:20px;background:#252535';
  const heading = document.createElement('h2');
  heading.id = '__battle_intro_title__'; heading.textContent = title;
  const hint = document.createElement('p'); hint.textContent = copy.battleOrientation;
  const supplies = document.createElement('p');
  supplies.textContent = `⭐ ${copy.battleStars}: ${ammo.stars|0} · 🍩 Pasticciotto: ${ammo.pasticciotto|0} · 🥟 Rustico: ${ammo.rustico|0} · ☕ Caffè: ${ammo.caffe|0}`;
  const instructions = document.createElement('p'); instructions.textContent = subtitle;
  const button = document.createElement('button');
  button.id = '__battle_start_btn'; button.type = 'button'; button.textContent = startLabel;
  button.style.cssText = 'padding:14px 20px;border:0;border-radius:12px;background:#ffd166;color:#302000;font:700 18px system-ui;cursor:pointer';
  card.append(heading, hint, supplies, instructions, button); overlay.append(card);
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.classList.remove('mobile-portrait');
  document.body.classList.add('mode-battle-intro');
  document.body.append(overlay);
  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    button.removeEventListener('click', proceed);
    overlay.remove();
    document.getElementById('__battle_rotate__')?.remove();
    document.body.classList.remove('mode-battle-intro', 'mobile-portrait');
    document.body.style.overflow = previousOverflow;
  }
  function proceed() {
    if (cleaned) return;
    cleanup();
    onProceed?.();
  }
  button.addEventListener('click', proceed);
  button.focus();
  return cleanup;
}
