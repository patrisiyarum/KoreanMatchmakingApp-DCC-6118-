/**
 * Keep in sync with GG/Backend/config/game-runtime.json (same keys / values).
 */
import runtime from './game-runtime.json';

export const XP_PER_LEVEL = Number(runtime.xpPerLevel ?? 500);
export const CHALLENGE_XP_BONUS = Number(runtime.challengeXpBonus ?? 25);
