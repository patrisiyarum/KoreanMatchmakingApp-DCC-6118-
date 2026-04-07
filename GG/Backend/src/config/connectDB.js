
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const dbName = process.env.DB_NAME || 'languageexchangematchmaker';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : null;
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dialect = process.env.DB_DIALECT || 'mysql';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: dialect,
});

let connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

let pool;

if (dialect === 'postgres') {
  const pg = await import('pg');
  const pgPool = new pg.default.Pool({
    host: dbHost,
    user: dbUser,
    password: dbPass || '',
    database: dbName,
    max: 10,
  });

  // Converts ? placeholders to $1,$2,... and returns [rows, fields] like mysql2
  function convertPlaceholders(sql) {
    let idx = 0;
    return sql.replace(/\?/g, () => `$${++idx}`);
  }

  pool = {
    async execute(sql, params = []) {
      const pgSql = convertPlaceholders(sql);
      const result = await pgPool.query(pgSql, params);
      return [result.rows, result.fields || []];
    },
    async query(sql, params = []) {
      const pgSql = convertPlaceholders(sql);
      const result = await pgPool.query(pgSql, params);
      return [result.rows, result.fields || []];
    },
  };
} else {
  const mysql = await import('mysql2/promise');
  pool = mysql.default.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPass || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export { pool };
export default { pool, connectDB };
