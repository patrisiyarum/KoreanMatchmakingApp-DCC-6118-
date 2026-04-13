'use strict';

/**
 * Sequelize CLI config — mirrors `src/models/index.js` env merge so migrations work on Plesk.
 * Uses DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_SOCKET, DB_DIALECT when set (same as the running app).
 *
 * Loads `.env` from this file's project root (`GG/Backend/.env`) first, then `process.cwd()/.env`,
 * because Plesk "Run Node.js commands" may use a cwd where the default `dotenv` lookup misses `.env`.
 */
const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '../..');
const dotenv = require('dotenv');

for (const envPath of [
  path.join(backendRoot, '.env'),
  path.join(process.cwd(), '.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}
dotenv.config();

const configPath = path.join(__dirname, 'config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const env = process.env.NODE_ENV || 'development';
const base = configFile[env] || configFile.development;

const database =
  process.env.DB_NAME || process.env.MYSQL_DATABASE || base.database;
const username =
  process.env.DB_USER || process.env.MYSQL_USER || base.username;
const password =
  process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : process.env.MYSQL_PASSWORD !== undefined
      ? process.env.MYSQL_PASSWORD
      : base.password;
const host = process.env.DB_HOST || base.host || '127.0.0.1';
const dialect = process.env.DB_DIALECT || base.dialect || 'mysql';

const hasExplicitDbUser =
  Boolean(
    (process.env.DB_USER && String(process.env.DB_USER).trim()) ||
      (process.env.MYSQL_USER && String(process.env.MYSQL_USER).trim())
  );
const hasExplicitPassword =
  process.env.DB_PASSWORD !== undefined || process.env.MYSQL_PASSWORD !== undefined;

if (
  !hasExplicitDbUser &&
  username === 'root' &&
  (password === null || password === '') &&
  process.env.ALLOW_INSECURE_DB_MIGRATE !== '1'
) {
  throw new Error(
    '[Sequelize CLI] No database user/password in environment.\n\n' +
      'Migrations need the same credentials as your running app. Do one of the following:\n\n' +
      '1) Create or upload `GG/Backend/.env` with at least:\n' +
      '   DB_USER=your_mysql_login\n' +
      '   DB_PASSWORD=your_mysql_password\n' +
      '   DB_NAME=your_database_name\n' +
      '   (optional) DB_HOST=127.0.0.1   or   DB_SOCKET=/path/to/mysql.sock\n\n' +
      '2) Or run once with variables inline (Plesk “Run Node.js commands”):\n' +
      "   DB_USER='...' DB_PASSWORD='...' DB_NAME='...' npm run migrate\n\n" +
      'Copy DB_USER / DB_PASSWORD / DB_NAME from Plesk → Databases or from your Node.js app env vars.'
  );
}

const merged = {
  username,
  password,
  database,
  host,
  dialect,
  logging: base.logging ?? false,
  define: { ...(base.define || {}), freezeTableName: true },
};

if (process.env.DB_SOCKET) {
  merged.dialectOptions = { socketPath: process.env.DB_SOCKET };
  delete merged.host;
}

module.exports = {
  development: merged,
  production: merged,
  test: merged,
};
