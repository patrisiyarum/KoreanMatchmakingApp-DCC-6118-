/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('UserProfile');

    // Add the new zodiac column (if missing)
    if (!table.zodiac) {
      await queryInterface.addColumn('UserProfile', 'zodiac', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Remove the old hobby column (if present)
    if (table.hobby) {
      await queryInterface.removeColumn('UserProfile', 'hobby');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('UserProfile');

    if (table.zodiac) {
      await queryInterface.removeColumn('UserProfile', 'zodiac');
    }

    if (!table.hobby) {
      await queryInterface.addColumn('UserProfile', 'hobby', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  }
};
