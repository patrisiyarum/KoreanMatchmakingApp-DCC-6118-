/**
 * One-time migration: adds imageUrls and imagePlacement columns to PostcardModel.
 * Run once with:  npx babel-node scripts/migrate-postcard-images.js
 */
import db from '../src/models/index.js';

const sequelize = db.sequelize;

async function run() {
  const [existing] = await sequelize.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'PostcardModel'
      AND COLUMN_NAME IN ('imageUrls', 'imagePlacement')
  `);
  const existingNames = existing.map((r) => r.COLUMN_NAME);

  if (!existingNames.includes('imageUrls')) {
    await sequelize.query(
      `ALTER TABLE PostcardModel ADD COLUMN imageUrls TEXT NULL`
    );
    console.log('✓ Added imageUrls column');
  } else {
    console.log('– imageUrls already exists, skipping');
  }

  if (!existingNames.includes('imagePlacement')) {
    await sequelize.query(
      `ALTER TABLE PostcardModel ADD COLUMN imagePlacement VARCHAR(255) NOT NULL DEFAULT 'attachment'`
    );
    console.log('✓ Added imagePlacement column');
  } else {
    console.log('– imagePlacement already exists, skipping');
  }

  console.log('Migration complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
