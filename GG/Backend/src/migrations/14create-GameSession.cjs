'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GameSession', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserAccount', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      gameType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      difficulty: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Beginner',
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      correct: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'abandoned'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      challengeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Challenge', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('GameSession');
  },
};
