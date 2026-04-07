'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Challenge', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      challengerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserAccount', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      challengedId: {
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
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
      },
      challengerScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      challengedScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      winnerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    await queryInterface.dropTable('Challenge');
  },
};
