'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserProfile', 'learning_goal', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('UserProfile', 'communication_style', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('UserProfile', 'commitment_level', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('UserProfile', 'learning_goal');
    await queryInterface.removeColumn('UserProfile', 'communication_style');
    await queryInterface.removeColumn('UserProfile', 'commitment_level');
  },
};
