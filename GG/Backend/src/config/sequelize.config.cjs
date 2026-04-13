'use strict';

/**
 * Sequelize CLI config — mirrors `src/models/index.js` env merge so migrations work on Plesk.
 * Uses DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_SOCKET, DB_DIALECT when set (same as the running app).
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const env = process.env.NODE_ENV || 'development';
const base = configFile[env] || configFile.development;

const database = process.env.DB_NAME || base.database;
const username = process.env.DB_USER || base.username;
const password =
  process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : base.password;
const host = process.env.DB_HOST || base.host || '127.0.0.1';
const dialect = process.env.DB_DIALECT || base.dialect || 'mysql';

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

// CLI picks one block from NODE_ENV; all blocks use the same merged credentials.
module.exports = {
  development: merged,
  production: merged,
  test: merged,
};
