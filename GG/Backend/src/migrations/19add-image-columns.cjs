'use strict';

async function columnExists(queryInterface, tableName, columnName) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'mysql') {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND LOWER(TABLE_NAME) = LOWER(:t)
         AND LOWER(COLUMN_NAME) = LOWER(:c)`,
      { replacements: { t: tableName, c: columnName } }
    );
    return rows.length > 0;
  }
  const desc = await queryInterface.describeTable(tableName);
  return Object.keys(desc).some((k) => k.toLowerCase() === String(columnName).toLowerCase());
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await columnExists(queryInterface, 'useraccount', 'profileImage'))) {
      await queryInterface.addColumn('useraccount', 'profileImage', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
        comment: 'Path to uploaded profile image, relative to /uploads/'
      });
    }

    if (!(await columnExists(queryInterface, 'Team', 'teamImage'))) {
      await queryInterface.addColumn('Team', 'teamImage', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
        comment: 'Path to uploaded team image, relative to /uploads/'
      });
    }
  },

  async down(queryInterface) {
    if (await columnExists(queryInterface, 'useraccount', 'profileImage')) {
      await queryInterface.removeColumn('useraccount', 'profileImage');
    }
    if (await columnExists(queryInterface, 'Team', 'teamImage')) {
      await queryInterface.removeColumn('Team', 'teamImage');
    }
  }
};
