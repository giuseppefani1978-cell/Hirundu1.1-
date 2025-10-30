import { addHallOfFameEntry, loadHallOfFame, getHallOfFameBonusUrl } from '../../hof/storage.js';
import { fmtTime, escapeHtml } from './utils.js';

function formatBonusBreakdown(breakdown = {}) {
  const p = breakdown.pasticciotto || 0;
  const r = breakdown.rustico || 0;
  const c = breakdown.caffe || 0;
  return `P:${p} • R:${r} • C:${c}`;
}

function redirectToBonusPage() {
  try {
    window.location.assign(getHallOfFameBonusUrl());
  } catch (error) {
    console.warn('[hof] unable to open bonus page', error);
  }
}

export function createHallOfFameController() {
  return {
    addEntry(entry) {
      const list = addHallOfFameEntry(entry);
      return list.map((item, index) => ({
        ...item,
        rank: index + 1,
        breakdown: formatBonusBreakdown(item.bonusBreakdown),
        timeLabel: fmtTime(item.time),
        nameHtml: escapeHtml(item.name),
      }));
    },
    open() {
      redirectToBonusPage();
    },
    attachHudLink() {
      // HUD link removed — scoreboard désormais accessible via le hub Bonus.
    },
    ensureHashRouting() {
      const handler = () => {
        if (location.hash === '#hof') {
          redirectToBonusPage();
        }
      };
      window.addEventListener('hashchange', handler);
      handler();
    },
    load: loadHallOfFame,
  };
}
