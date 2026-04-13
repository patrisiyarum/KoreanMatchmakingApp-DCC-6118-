import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../config/config.json');

const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = configFile[env] || configFile.development;

const db = {};
let sequelize;

// Plesk / production: use DB_* env vars when set (matches hosting panel)
const dbName = process.env.DB_NAME || config.database;
const dbUser = process.env.DB_USER || config.username;
const dbPass =
    process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.password;
const dbHost = process.env.DB_HOST || config.host || "127.0.0.1";

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  const dialect = process.env.DB_DIALECT || config.dialect;
  const opts = {
    host: dbHost,
    dialect: dialect,
    logging: config.logging,
    // Must match local DB table names (e.g. useraccount). Production config.json omitted this and caused UserAccounts.
    define: { ...(config.define || {}), freezeTableName: true },
  };
  // Plesk/Linux: MySQL often uses a Unix socket for "localhost"; set DB_SOCKET if TCP fails.
  if (process.env.DB_SOCKET) {
    opts.dialectOptions = { socketPath: process.env.DB_SOCKET };
    delete opts.host;
  }
  sequelize = new Sequelize(dbName, dbUser, dbPass, opts);
}

const files = fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js');

for (const file of files) {
  const modelModule = await import(pathToFileURL(path.join(__dirname, file)));
  const model = modelModule.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 * If `UserProfile.bio` is not in the database, drop it from the Sequelize model so every
 * SELECT/UPSERT avoids "Unknown column 'bio'". Run after sequelize.sync() so alter can add the column first.
 */
export async function alignUserProfileBioWithDatabase() {
  const UserProfile = db.UserProfile;
  if (!UserProfile || typeof UserProfile.removeAttribute !== 'function') return;

  const dialect = sequelize.getDialect();
  const tableRef = UserProfile.getTableName();
  const tableName = typeof tableRef === 'string' ? tableRef : tableRef.tableName;

  try {
    let count = 0;
    if (dialect === 'mysql') {
      const variants = [...new Set([tableName, tableName.toLowerCase(), tableName.toUpperCase()])];
      const placeholders = variants.map(() => '?').join(',');
      const [rows] = await sequelize.query(
        `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME IN (${placeholders})
           AND COLUMN_NAME = 'bio'`,
        { replacements: variants }
      );
      const row = rows && rows[0];
      count = Number(row?.c ?? row?.C ?? 0);
    } else if (dialect === 'postgres') {
      const [rows] = await sequelize.query(
        `SELECT COUNT(*)::int AS c FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = :tn
           AND column_name = 'bio'`,
        { replacements: { tn: String(tableName).toLowerCase() } }
      );
      count = Number(rows?.[0]?.c ?? 0);
    } else {
      return;
    }

    if (count === 0) {
      UserProfile.removeAttribute('bio');
      console.warn(
        '[DB] UserProfile has no `bio` column; Sequelize omits it. Add the column (migration 22add-bio-to-userprofile.js or schema.mysql.sql) and restart to enable bio.'
      );
    }
  } catch (err) {
    console.warn('[DB] Could not verify UserProfile.bio column:', err.message);
  }
}

export { sequelize };
export default db;