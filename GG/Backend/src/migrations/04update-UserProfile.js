/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('UserProfile');

    // Add the new default_time_zone column (if missing)
    if (!table.default_time_zone) {
      await queryInterface.addColumn('UserProfile', 'default_time_zone', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'UTC',
      });
    }

    // Remove the old availability columns (if present)
    if (table.dates_available) {
      await queryInterface.removeColumn('UserProfile', 'dates_available');
    }
    if (table.times_available) {
      await queryInterface.removeColumn('UserProfile', 'times_available');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('UserProfile');

    // Remove the new default_time_zone column (if present)
    if (table.default_time_zone) {
      await queryInterface.removeColumn('UserProfile', 'default_time_zone');
    }

    // Add back the old availability columns (if missing)
    if (!table.dates_available) {
      await queryInterface.addColumn('UserProfile', 'dates_available', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!table.times_available) {
      await queryInterface.addColumn('UserProfile', 'times_available', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  }
};
