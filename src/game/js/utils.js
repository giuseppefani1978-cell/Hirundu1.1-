import { DEBUG } from './config.js';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function fmtTime(ms) {
  const safe = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}m${String(seconds).padStart(2, '0')}s`;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

export function getCountry() {
  try {
    const lang = navigator.language || Intl.DateTimeFormat().resolvedOptions().locale;
    const region = lang && lang.includes('-') ? lang.split('-')[1] : null;
    if (!region) {
      return { code: '??', flag: '🏳️', label: '??' };
    }
    const flag = region.replace(/./g, (c) => String.fromCodePoint(127397 + c.toUpperCase().charCodeAt()));
    return { code: region, flag, label: region };
  } catch (err) {
    if (DEBUG) {
      console.warn('[country]', err);
    }
    return { code: '??', flag: '🏳️', label: '??' };
  }
}

export function debugLog(...args) {
  if (DEBUG) {
    console.log('[GAME]', ...args);
  }
}

export const now = () => performance.now();
