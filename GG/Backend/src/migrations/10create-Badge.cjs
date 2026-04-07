'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Badge', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '🏅',
      },
      category: {
        type: Sequelize.ENUM('games', 'social', 'learning', 'streak', 'level'),
        allowNull: false,
        defaultValue: 'games',
      },
      tier: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum'),
        allowNull: false,
        defaultValue: 'bronze',
      },
      criteriaType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      criteriaValue: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Badge');
  },
};
