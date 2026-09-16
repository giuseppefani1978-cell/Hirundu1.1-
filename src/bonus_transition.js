// V9.1 — legacy victory CTA retired.
//
// Victory flow is now owned by the battle callback + React router.
// These exports remain as compatibility shims for legacy level modules.

const CTA_IDS = ['__victory_bonus_btn','__bonus_cta','__otranto_bonus_link','__gallipoli_bonus_link','__lecce_bonus_link'];

export function removeVictoryCTA() {
  if (typeof document === 'undefined') return;
  CTA_IDS.forEach((id) => document.getElementById(id)?.remove());
}

export function setupVictoryCTAHandlers() {
  // Idempotent compatibility shim: no global listeners are installed.
  removeVictoryCTA();
  return removeVictoryCTA;
}
