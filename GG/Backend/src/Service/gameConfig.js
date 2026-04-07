import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runtimePath = join(__dirname, '../../config/game-runtime.json');
const runtime = JSON.parse(readFileSync(runtimePath, 'utf8'));

export const XP_PER_LEVEL = runtime.xpPerLevel;
export const CHALLENGE_ACTIVE_STATUSES = runtime.challengeActiveStatuses;
