const STORAGE_KEY = '__level_transition_v1__';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getStorage() {
  if (!isBrowser()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readTransitionMap() {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    if (parsed.transitions && typeof parsed.transitions === 'object') {
      return { ...parsed.transitions };
    }
    return {};
  } catch {
    return {};
  }
}

function writeTransitionMap(map) {
  const storage = getStorage();
  if (!storage) return;
  try {
    const payload = { transitions: map };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function consumeLevelTransition(level) {
  if (!isBrowser()) return null;
  const key = String(level ?? '');
  if (!key) return null;
  const map = readTransitionMap();
  const entry = map[key];
  if (!entry) return null;
  delete map[key];
  writeTransitionMap(map);
  return entry;
}

function mergeHighlight(baseHighlight, queuedHighlight) {
  if (queuedHighlight == null) return baseHighlight;
  if (baseHighlight == null) return queuedHighlight;
  if (typeof queuedHighlight === 'string') return queuedHighlight;
  if (typeof baseHighlight === 'string') return queuedHighlight;
  return {
    title: queuedHighlight.title ?? baseHighlight.title,
    body: queuedHighlight.body ?? baseHighlight.body,
  };
}

function renderHighlight(element, highlight) {
  if (!element) return;
  if (!highlight) {
    element.hidden = true;
    element.textContent = '';
    if (typeof element.replaceChildren === 'function') {
      element.replaceChildren();
    } else {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
    return;
  }

  element.hidden = false;
  if (typeof element.replaceChildren === 'function') {
    element.replaceChildren();
  } else {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  if (typeof highlight === 'string') {
    element.textContent = highlight;
    return;
  }

  if (highlight.title) {
    const strong = document.createElement('strong');
    strong.textContent = highlight.title;
    element.appendChild(strong);
  }

  if (highlight.body) {
    const span = document.createElement('span');
    span.textContent = highlight.body;
    element.appendChild(span);
  }
}

function applyTheme(card, theme) {
  if (!card) return;
  if (theme) {
    card.dataset.theme = theme;
  } else {
    delete card.dataset.theme;
  }
}

export function prepareLevelIntro(config) {
  if (!isBrowser()) return;

  const {
    level,
    theme,
    badge,
    title,
    subtitle,
    description,
    highlight,
    footnote,
    startLabel,
    accentColor,
  } = config || {};

  const queued = consumeLevelTransition(level);
  const finalTheme = queued?.theme ?? theme ?? null;
  const finalBadge = queued?.badge ?? badge ?? (level ? `Niveau ${level}` : '');
  const finalSubtitle = queued?.subtitle ?? subtitle ?? '';
  const finalDescription = queued?.description ?? description ?? '';
  const finalFootnote = queued?.footnote ?? footnote ?? '';
  const finalStartLabel = queued?.startLabel ?? startLabel ?? '▶︎ Lancer la chasse';
  const finalAccent = queued?.accentColor ?? accentColor ?? null;
  const finalHighlight = mergeHighlight(highlight, queued?.highlight);

  const titleEl = document.getElementById('titleH1');
  const subtitleEl = document.getElementById('subtitleP');
  const badgeEl = document.getElementById('overlayBadge');
  const descriptionEl = document.getElementById('overlayDescription');
  const highlightEl = document.getElementById('overlayHighlight');
  const footnoteEl = document.getElementById('overlayFootnote');
  const startBtn = document.getElementById('startBtn');
  const card = document.getElementById('overlayCard');

  applyTheme(card, finalTheme || (level === 1 ? 'otranto' : ''));

  if (card && finalAccent) {
    card.style.setProperty('--overlay-accent', finalAccent);
  }

  if (titleEl && title) {
    titleEl.textContent = title;
  }
  if (subtitleEl) {
    subtitleEl.textContent = finalSubtitle;
  }
  if (badgeEl) {
    badgeEl.textContent = finalBadge ?? '';
  }
  if (descriptionEl) {
    descriptionEl.textContent = finalDescription;
    descriptionEl.hidden = !finalDescription;
  }

  renderHighlight(highlightEl, finalHighlight);

  if (footnoteEl) {
    footnoteEl.textContent = finalFootnote;
    footnoteEl.hidden = !finalFootnote;
  }

  if (startBtn) {
    startBtn.textContent = finalStartLabel;
  }

  if (finalTheme) {
    document.body.dataset.levelTheme = finalTheme;
  } else {
    delete document.body.dataset.levelTheme;
  }
}

export function queueLevelTransition(payload) {
  if (!payload || typeof payload.targetLevel !== 'number') return;
  if (!isBrowser()) return;

  const map = readTransitionMap();
  const key = String(payload.targetLevel);
  const next = { ...payload };
  delete next.targetLevel;
  next.timestamp = Date.now();
  map[key] = next;
  writeTransitionMap(map);
}

export function clearLevelTransitions() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

