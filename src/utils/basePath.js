export function withBase(path = '') {
  const base = import.meta?.env?.BASE_URL ?? new URL('.', document.baseURI).pathname;
  const normalized = String(path ?? '');
  if (!normalized) {
    return base;
  }

  const trimmed = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${trimmed}`;
}
