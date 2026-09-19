import { bootReboundLevel7 } from './reboundLevel7.js';

// Level 7 uses the stabilized rebound-hunt/battle format established by Levels 3 and 5.
// Its Nardò POIs, Macina boss, difficulty and rewards remain level-specific.
export function startLevel7(options = {}) {
  return bootReboundLevel7(options);
}

export function boot(options = {}) {
  return startLevel7(options);
}
