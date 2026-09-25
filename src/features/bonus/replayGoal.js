// Read-only suggestion from the retained local leaderboard. No new score rules.
export function replayGoal(entries) {
 const scores=(Array.isArray(entries)?entries:[]).map(entry=>entry?.score).filter(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0);
 return scores.length?Math.max(...scores):null;
}
