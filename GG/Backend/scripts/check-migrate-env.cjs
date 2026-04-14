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

function mask(v) {
  if (v == null || v === '') return '(empty)';
  if (typeof v !== 'string') return '(set)';
  return '(set, length ' + v.length + ')';
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
console.log('DB_HOST:', process.env.DB_HOST || '(not set)');
console.log('DB_SOCKET:', process.env.DB_SOCKET || '(not set)');
console.log('--- end ---');
console.log(
  'If DB_USER / DB_NAME are missing here, migrations will fall back to config.json (often root / no password).'
);
console.log('Fix: put DB_* in GG/Backend/.env OR run migrate with DB_USER=... DB_PASSWORD=... on the same line.');
