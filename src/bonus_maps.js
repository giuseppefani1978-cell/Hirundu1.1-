// src/bonus_maps.js
// Pont de compatibilité pour les modules historiques qui consomment la logique des cartes bonus.

export { BONUS_MAPS } from "./features/bonus/bonusData";
export {
  BONUS_PROGRESS_EVENT,
  broadcastBonusUpdate,
  getNextLevel,
  getItineraryState,
  getProgressList,
  getResumeTarget,
  getUnlockedKeys,
  isBonusUnlocked,
  markLevelWin,
  readBonusSnapshot,
  unlockBonus,
} from "./features/bonus/bonusStorage";
export { openBonusHub, openBonusMap } from "./features/bonus/bonusNavigation";
