'use strict';

async function hasColumn(queryInterface, tableName, columnName) {
  const desc = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(desc, columnName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasColumn(queryInterface, 'MeetingModel', 'topic'))) {
      await queryInterface.addColumn('MeetingModel', 'topic', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!(await hasColumn(queryInterface, 'MeetingModel', 'zoom_link'))) {
      await queryInterface.addColumn('MeetingModel', 'zoom_link', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    if (await hasColumn(queryInterface, 'MeetingModel', 'zoom_link')) {
      await queryInterface.removeColumn('MeetingModel', 'zoom_link');
    }
    if (await hasColumn(queryInterface, 'MeetingModel', 'topic')) {
      await queryInterface.removeColumn('MeetingModel', 'topic');
    }
  },
};
