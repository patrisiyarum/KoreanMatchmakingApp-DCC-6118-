import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runtimePath = join(__dirname, '../../config/game-runtime.json');
const runtime = JSON.parse(readFileSync(runtimePath, 'utf8'));

export const XP_PER_LEVEL = Number(runtime.xpPerLevel ?? 500);
export const CHALLENGE_XP_BONUS = Number(runtime.challengeXpBonus ?? 25);
export const CHALLENGE_ACTIVE_STATUSES = runtime.challengeActiveStatuses ?? ['accepted', 'in_progress'];
