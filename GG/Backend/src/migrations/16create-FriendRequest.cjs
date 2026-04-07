'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FriendRequest', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserAccount', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserAccount', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pairUser1Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      pairUser2Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'cancelled', 'removed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastActionBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      blockedUntil: {
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

    await queryInterface.addConstraint('FriendRequest', {
      fields: ['pairUser1Id', 'pairUser2Id'],
      type: 'unique',
      name: 'friendrequest_unique_pair',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('FriendRequest', 'friendrequest_unique_pair');
    await queryInterface.dropTable('FriendRequest');
  },
};
