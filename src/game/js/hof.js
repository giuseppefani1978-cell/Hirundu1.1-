import { fmtTime, escapeHtml } from './utils.js';

const HOF_KEY = 'salento_hof_v1';
const HOF_SIZE = 10;

function loadEntries() {
  try {
    const raw = localStorage.getItem(HOF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(HOF_KEY, JSON.stringify(entries));
  } catch {
    // storage might be disabled, ignore
  }
}

function pushEntry(entry) {
  const list = loadEntries();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, HOF_SIZE);
  saveEntries(trimmed);
  return trimmed;
}

function formatBonusBreakdown(breakdown = {}) {
  const p = breakdown.pasticciotto || 0;
  const r = breakdown.rustico || 0;
  const c = breakdown.caffe || 0;
  return `P:${p} • R:${r} • C:${c}`;
}

function ensurePanel() {
  let panel = document.getElementById('__hof__');
  if (panel) {
    return panel;
  }

  panel = document.createElement('div');
  panel.id = '__hof__';
  panel.style.cssText = `
    position:fixed; inset:0; z-index:10002; display:none;
    background:linear-gradient(180deg, rgba(0,0,0,.85), rgba(0,0,0,.75));
    color:#fff; font:14px system-ui; overflow:hidden;
  `;

  panel.innerHTML = `
    <div style="height:100%;max-width:900px;margin:0 auto;display:flex;flex-direction:column;padding:16px">
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between">
        <h2 style="margin:0;font:600 22px system-ui">🏆 Hall of Fame</h2>
        <button id="__hof_close" type="button"
          style="background:#fff;color:#000;border:0;border-radius:10px;padding:10px 14px;cursor:pointer">Fermer</button>
      </div>
      <div id="__hof_table_wrap"
           style="margin-top:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);
                  border-radius:12px;overflow:auto;flex:1;min-height:0">
        <div id="__hof_table"></div>
      </div>
      <div style="margin-top:10px;opacity:.8;font-size:12px">Les scores sont stockés localement sur cet appareil.</div>
    </div>
  `;

  document.body.appendChild(panel);

  const closeBtn = panel.querySelector('#__hof_close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
      history.replaceState(null, '', location.pathname);
    });
  }

  return panel;
}

function renderTable(entries) {
  const host = ensurePanel();
  const table = host.querySelector('#__hof_table');
  if (!table) {
    return;
  }

  const rows = entries.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${entry.country?.flag || '🏳️'}</td>
      <td>${escapeHtml(entry.name)}</td>
      <td class="score">${entry.score}</td>
      <td>${entry.stars}★</td>
      <td>${entry.bonuses}</td>
      <td>${formatBonusBreakdown(entry.bonusBreakdown)}</td>
      <td>${entry.hits}</td>
      <td>${fmtTime(entry.time)}</td>
      <td>${new Date(entry.date).toLocaleString()}</td>
    </tr>
  `).join('');

  table.innerHTML = `
    <style>
      #__hof__ table{width:100%;border-collapse:collapse;font-size:13px}
      #__hof__ thead th{position:sticky;top:0;background:rgba(0,0,0,.5);backdrop-filter:saturate(120%) blur(2px)}
      #__hof__ th, #__hof__ td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.1);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
      #__hof__ td.score{font-weight:700}
      @media (max-width:480px){
        #__hof__ table{font-size:12px}
        #__hof__ th, #__hof__ td{padding:6px 8px}
      }
    </style>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Pays</th><th>Joueur</th><th>Score</th><th>Étoiles</th>
          <th>Bonus</th><th>Détail bonus</th><th>Coups</th><th>Temps</th><th>Date</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="10" style="opacity:.8">Aucun score pour l’instant.</td></tr>`}</tbody>
    </table>
  `;
}

function openPanel() {
  renderTable(loadEntries());
  const panel = ensurePanel();
  panel.style.display = 'block';
}

function ensureHudButton(openHandler) {
  const hud = document.getElementById('hud');
  if (!hud) {
    return;
  }

  let link = document.getElementById('__hof_in_hud');
  if (!link) {
    link = document.createElement('button');
    link.id = '__hof_in_hud';
    link.type = 'button';
    link.textContent = '🏆 Hall of Fame';
    link.style.cssText = `
      margin-top:8px; width:100%;
      background:#fff; color:#000; border:0; border-radius:10px; padding:6px 10px;
      font:600 12px system-ui; cursor:pointer;
    `;
    hud.appendChild(link);
  }
  link.addEventListener('click', openHandler);
}

function setupHashRouting(openHandler) {
  const handler = () => {
    if (location.hash === '#hof') {
      openHandler();
    }
  };
  window.addEventListener('hashchange', handler);
  handler();
}

export function createHallOfFameController() {
  return {
    addEntry(entry) {
      const list = pushEntry(entry);
      renderTable(list);
      return list;
    },
    open: openPanel,
    attachHudLink() {
      ensureHudButton(openPanel);
    },
    ensureHashRouting() {
      setupHashRouting(openPanel);
    },
    load: loadEntries,
  };
}
