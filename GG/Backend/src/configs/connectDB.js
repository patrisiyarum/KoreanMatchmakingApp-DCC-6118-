// get the client
import pg from 'pg';

const pgPool = new pg.Pool({
  host: '127.0.0.1',
  user: 'root',
  database: 'languageexchangematchmaker',
  password: null
});

// mysql2-compatible wrapper
function convertPlaceholders(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

const pool = {
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

export default pool;
