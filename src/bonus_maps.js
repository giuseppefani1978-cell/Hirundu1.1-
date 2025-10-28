// src/bonus_maps.js
// Gestion centralisée des cartes bonus + déblocages + QR partenaires

// Clé LS (nouveau format)
const LS_KEY = 'bonus_unlocked_v1';

// ---------- Migration depuis anciens flags ----------
function __bm_readRaw(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function __bm_readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function __bm_truthy(v) {
  if (v === true) return true;
  if (v === 'true' || v === '1' || v === 1) return true;
  // si quelqu’un a stocké "TRUE" / "True"…
  if (typeof v === 'string' && v.toLowerCase?.() === 'true') return true;
  return false;
}

function __bm_loadUnlocked() {
  // état courant (nouveau format)
  let current = __bm_readJSON(LS_KEY);
  if (!current || typeof current !== 'object') current = {};

  // migration depuis anciens booléens
  let migrated = false;
  try {
    // gallipoli – accepter JSON, string ou chiffre
    const gJson = __bm_readJSON('gallipoli_bonus_unlocked');
    const gRaw  = __bm_readRaw('gallipoli_bonus_unlocked');
    if (__bm_truthy(gJson) || __bm_truthy(gRaw)) {
      if (!current.gallipoli) { current.gallipoli = true; migrated = true; }
    }

    // otranto – mêmes variantes historiques
    const o1Json = __bm_readJSON('otranto_bonus_unlocked');
    const o1Raw  = __bm_readRaw('otranto_bonus_unlocked');
    const o2Json = __bm_readJSON('bonus_otranto_unlocked');
    const o2Raw  = __bm_readRaw('bonus_otranto_unlocked');
    if (__bm_truthy(o1Json) || __bm_truthy(o1Raw) || __bm_truthy(o2Json) || __bm_truthy(o2Raw)) {
      if (!current.otranto) { current.otranto = true; migrated = true; }
    }
  } catch {}

  if (migrated) __bm_saveUnlocked(current);
  return current;
}

function __bm_saveUnlocked(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

// ---------- API publique ----------
export function isBonusUnlocked(key) {
  const st = __bm_loadUnlocked();
  return !!st[key];
}

export function unlockBonus(key) {
  const st = __bm_loadUnlocked();
  if (!st[key]) {
    st[key] = true;
    __bm_saveUnlocked(st);
  }
}

export function getUnlockedKeys() {
  return Object.keys(__bm_loadUnlocked()).filter((k) => !!BONUS_MAPS[k]);
}

// ---------- Config des cartes ----------
export const BONUS_MAPS = {
  otranto: {
    title: 'Otranto',
    lat: 40.1489, lng: 18.4863, zoom: 14,
    markerText: 'Tu as libéré Otranto ! 🌊',
    partners: []
  },
  gallipoli: {
    title: 'Gallipoli',
    lat: 40.0553, lng: 17.9889, zoom: 14,
    markerText: 'Bravo ! Aracne triomphe à Gallipoli ! 🕊️',
    partners: []
  },
  lecce: {
    title: 'Lecce',
    lat: 40.3520, lng: 18.1750, zoom: 13,
    markerText: 'Bienvenue à Lecce – le cœur du Salento ! ☀️',
    partners: []
  }
};

// ---------- Ouverture d’une carte (redirige vers l’app React) ----------
export function openBonusMap(key) {
  const cfg = BONUS_MAPS[key];
  if (!cfg) { alert('Carte bonus inconnue.'); return; }

  unlockBonus(key); // on marque comme débloquée

  // L’app React (app.html) rend la Leaflet page: /poi/:id/realmap
  const url = `/app.html#/poi/${encodeURIComponent(key)}/realmap`;
  // ouvre dans le même onglet (ou replace par window.open si tu préfères un nouvel onglet)
  window.location.assign(url);
}

// ---------- Petit hub autonome (liste les cartes débloquées) ----------
export function openBonusHub() {
  const unlocked = getUnlockedKeys();
  if (!unlocked.length) { alert("Aucun bonus débloqué pour l’instant."); return; }

  const win = window.open('', '_blank', 'width=520,height=520,noopener');
  win.document.write(`
    <html><head><meta charset="utf-8"/><title>Cartes bonus</title>
      <style>
        body{margin:0;background:#0b0d10;color:#fff;font:14px system-ui}
        .box{max-width:460px;margin:30px auto;padding:16px 18px;border-radius:12px;
             background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
             border:1px solid rgba(255,255,255,.12)}
        h2{margin:.2rem 0 1rem 0;font:700 20px system-ui}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        a.btn{display:block;text-align:center;padding:10px 12px;border-radius:10px;
             text-decoration:none;color:#fff;background:#1f2937}
        a.btn:hover{background:#374151}
      </style>
    </head>
    <body>
      <div class="box">
        <h2>Cartes bonus débloquées</h2>
        <div class="grid">
          ${unlocked.map(k => `
            <a class="btn" href="/app.html#/poi/${k}/realmap" target="_blank" rel="noopener">
              ${BONUS_MAPS[k].title}
            </a>`).join('')}
        </div>
      </div>
    </body></html>
  `);
}
// -------------------------------------------------------------
// PROGRESSION — niveaux (1=Otranto, 2=Gallipoli, 3=Lecce)
// -------------------------------------------------------------

export function markLevelWin(levelId) {
  try {
    localStorage.setItem(`level${levelId}_won`, 'true');
    localStorage.setItem(`level${levelId}_won_at`, String(Date.now()));

    // déblocage du suivant
    if (levelId === 1) localStorage.setItem('bonus_gallipoli_unlocked', 'true');
    if (levelId === 2) localStorage.setItem('bonus_lecce_unlocked', 'true');
  } catch (e) {
    console.warn('markLevelWin failed', e);
  }
}

export function getProgressList() {
  return [
    {
      id: 1,
      name: 'Otranto',
      key: 'otranto',
      done: localStorage.getItem('level1_won') === 'true',
      unlocked: true,
      href: '/app.html#otranto',
    },
    {
      id: 2,
      name: 'Gallipoli',
      key: 'gallipoli',
      done: localStorage.getItem('level2_won') === 'true',
      unlocked: localStorage.getItem('bonus_gallipoli_unlocked') === 'true',
      href: '/app.html#gallipoli',
    },
    {
      id: 3,
      name: 'Lecce',
      key: 'lecce',
      done: localStorage.getItem('level3_won') === 'true',
      unlocked: localStorage.getItem('bonus_lecce_unlocked') === 'true',
      href: '/app.html#lecce',
    },
  ];
}

export function getNextLevel() {
  const list = getProgressList();
  const next = list.find(l => !l.done && l.unlocked);
  return next || list.find(l => !l.done); // fallback
}
// Propose la prochaine "chasse" à jouer pour le gros bouton noir.
// Règle souhaitée :
// - s'il existe un niveau *non terminé* ET *déverrouillé* → on le propose
// - sinon, on boucle sur le niveau 1 (rejouer le jeu depuis le début)
export function getResumeTarget() {
  const list = getProgressList();

  // 1) premier niveau non fait ET déverrouillé
  const next = list.find(l => !l.done && l.unlocked);
  if (next) return next;

  // 2) tout est terminé → boucle sur le 1
  return list[0];
}
