import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '../../config/profile-matching.json');

let cached;

function loadConfig() {
  if (!cached) {
    cached = JSON.parse(readFileSync(configPath, 'utf8'));
  }
  return cached;
}

export function getProfileCustomizationOptions() {
  return loadConfig();
}

/**
 * Validates learning goal, communication style, and commitment level.
 * @param {object} options - If options.requireAll is true (profile create), all three fields are required.
 *   Otherwise empty strings mean "omit" on update.
 */
export function validateProfileCustomizationFields(
  { learning_goal, communication_style, commitment_level },
  options = {}
) {
  const cfg = loadConfig();
  const errors = [];
  const requireAll = options.requireAll === true;

  const lgTrim =
    learning_goal !== undefined && learning_goal !== null ? String(learning_goal).trim() : '';
  const csTrim =
    communication_style !== undefined && communication_style !== null
      ? String(communication_style).trim()
      : '';

  if (requireAll) {
    if (!lgTrim) errors.push('learning_goal is required');
    if (!csTrim) errors.push('communication_style is required');
    if (commitment_level === undefined || commitment_level === null || commitment_level === '') {
      errors.push('commitment_level is required');
    }
  }

  if (lgTrim) {
    if (!cfg.learningGoals.includes(lgTrim)) {
      errors.push('learning_goal must be one of the allowed values');
    }
  }

  if (csTrim) {
    if (!cfg.communicationStyles.includes(csTrim)) {
      errors.push('communication_style must be one of the allowed values');
    }
  }

  if (commitment_level !== undefined && commitment_level !== null && commitment_level !== '') {
    const n = typeof commitment_level === 'number' ? commitment_level : parseInt(String(commitment_level), 10);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      errors.push(
        `commitment_level must be an integer between ${cfg.commitmentLevel.min} and ${cfg.commitmentLevel.max}`
      );
    } else if (n < cfg.commitmentLevel.min || n > cfg.commitmentLevel.max) {
      errors.push(
        `commitment_level must be between ${cfg.commitmentLevel.min} and ${cfg.commitmentLevel.max}`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

export function normalizeCommitmentLevel(raw, fallback) {
  const cfg = loadConfig();
  if (raw === undefined || raw === null || raw === '') return fallback ?? cfg.commitmentLevel.default;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback ?? cfg.commitmentLevel.default;
  return Math.min(cfg.commitmentLevel.max, Math.max(cfg.commitmentLevel.min, n));
}
