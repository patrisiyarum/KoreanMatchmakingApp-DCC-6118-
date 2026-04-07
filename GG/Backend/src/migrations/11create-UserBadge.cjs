'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserBadge', {
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
      badgeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Badge', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      earnedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    await queryInterface.addIndex('UserBadge', ['userId', 'badgeId'], {
      unique: true,
      name: 'user_badge_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('UserBadge');
  },
};
