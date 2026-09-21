import type { BonusProgressEntry } from './bonusStorage';

// Old saves and replays can be non-contiguous: count is never an unlock rule.
export function journeyState(progress: BonusProgressEntry[]) {
  const completed = progress.filter(entry => entry.done).length;
  const current = progress.find(entry => !entry.done && entry.unlocked);
  return { completed, current, complete: progress.length > 0 && completed === progress.length };
}
export function stageState(entry: BonusProgressEntry, currentId?: number) {
  if (entry.done) return 'done';
  if (entry.id === currentId) return 'current';
  return entry.unlocked ? 'available' : 'future';
}
export function stageFamily(id: number) {
  return [3, 5, 7].includes(id) ? 1 : [4, 6, 8].includes(id) ? 2 : 0;
}
