// a test to make sure that connection to postgres was stable

import pg from 'pg';

const testDB = async () => {
  const client = new pg.Client({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'languageexchangematchmaker'
  });

  await client.connect();

  try {
    // Query to fetch user names
    const result = await client.query('SELECT "firstName", "lastName" FROM "UserAccount"');

    // Formatted the output to list each user's name in terminal
    console.log('User Names:');
    result.rows.forEach(row => {
      console.log(`${row.firstName} ${row.lastName}`);
    });
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await client.end();
  }
};

testDB();
