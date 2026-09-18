import { bootReboundLevel5 } from './reboundLevel5.js';

// Level 5 now uses the stabilized rebound-hunt/battle format established by Level 3.
// The legacy regional implementation is preserved in Git history and in the stable base branch.
export function startLevel5(options = {}) {
  return bootReboundLevel5(options);
}

export function boot(options = {}) {
  return startLevel5(options);
}
