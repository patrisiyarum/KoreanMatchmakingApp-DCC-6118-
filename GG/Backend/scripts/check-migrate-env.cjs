'use strict';

/**
 * Run from GG/Backend: npm run migrate:check
 * Shows whether DB_* / DATABASE_URL are visible to Sequelize CLI (without printing secrets).
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const backendRoot = path.join(__dirname, '..');
const envParent = path.join(backendRoot, '..', '.env');
const envBackend = path.join(backendRoot, '.env');
const envCwd = path.join(process.cwd(), '.env');

console.log('--- migrate env check ---');
console.log('process.cwd():', process.cwd());
console.log('Expected app root:', backendRoot);
console.log('parent .env (e.g. httpdocs/.env):', fs.existsSync(envParent), envParent);
console.log('GG/Backend/.env exists:', fs.existsSync(envBackend), envBackend);
console.log('cwd .env exists:', fs.existsSync(envCwd), envCwd);

if (fs.existsSync(envParent)) dotenv.config({ path: envParent, override: false });
if (fs.existsSync(envBackend)) dotenv.config({ path: envBackend, override: true });
if (fs.existsSync(envCwd)) dotenv.config({ path: envCwd, override: false });

/** Names only — helps spot typos (e.g. DB_USR) or `export` / BOM issues. */
function listAssignmentKeys(envPath) {
  if (!fs.existsSync(envPath)) return [];
  let text = fs.readFileSync(envPath, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) {
    console.log('WARNING: .env starts with a UTF-8 BOM; first variable may not load. Re-save as UTF-8 without BOM.');
    text = text.slice(1);
  }
  const keys = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m) keys.push(m[1]);
  }
  return keys;
}

const dbLike = (k) =>
  /^(DB_|MYSQL_|DATABASE_URL)/i.test(k) || /^DATABASE$/i.test(k);

function mask(v) {
  if (v == null || v === '') return '(empty)';
  if (typeof v !== 'string') return '(set)';
  return '(set, length ' + v.length + ')';
}

const keysInBackendEnv = listAssignmentKeys(envBackend);
const dbKeysInFile = keysInBackendEnv.filter(dbLike);
console.log(
  'DB-related key names found in GG/Backend/.env (not values):',
  dbKeysInFile.length ? dbKeysInFile.join(', ') : '(none — add DB_USER, DB_PASSWORD, DB_NAME or MYSQL_*)'
);
if (keysInBackendEnv.length && !dbKeysInFile.length) {
  console.log(
    'Other key names in .env (first 15):',
    keysInBackendEnv.slice(0, 15).join(', ') + (keysInBackendEnv.length > 15 ? '…' : '')
  );
}

const du = process.env.DATABASE_URL;
console.log('DATABASE_URL:', du ? '(set)' : '(not set)');
console.log('DB_USER:', process.env.DB_USER ? mask(process.env.DB_USER) : '(not set)');
console.log('MYSQL_USER:', process.env.MYSQL_USER ? mask(process.env.MYSQL_USER) : '(not set)');
console.log('DB_NAME:', process.env.DB_NAME || process.env.MYSQL_DATABASE || '(not set)');
console.log(
  'DB_PASSWORD:',
  process.env.DB_PASSWORD !== undefined ? mask(process.env.DB_PASSWORD) : '(not set)'
);
console.log(
  'MYSQL_PASSWORD:',
  process.env.MYSQL_PASSWORD !== undefined ? mask(process.env.MYSQL_PASSWORD) : '(not set)'
);
console.log('DB_HOST:', process.env.DB_HOST || '(not set)');
console.log('DB_SOCKET:', process.env.DB_SOCKET || '(not set)');
console.log('--- end ---');
console.log(
  'If DB_USER / DB_NAME are missing here, migrations will fall back to config.json (often root / no password).'
);
console.log('Fix: put DB_* in GG/Backend/.env OR run migrate with DB_USER=... DB_PASSWORD=... on the same line.');
