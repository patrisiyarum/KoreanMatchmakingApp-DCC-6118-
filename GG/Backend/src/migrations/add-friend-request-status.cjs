'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('FriendsModel');

    if (!table.status) {
      await queryInterface.addColumn('FriendsModel', 'status', {
        type: Sequelize.ENUM('pending', 'accepted'),
        allowNull: false,
        defaultValue: 'accepted',
      });
    }

    if (!table.requester_id) {
      await queryInterface.addColumn('FriendsModel', 'requester_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'UserAccount', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('FriendsModel');
    if (table.status) await queryInterface.removeColumn('FriendsModel', 'status');
    if (table.requester_id) await queryInterface.removeColumn('FriendsModel', 'requester_id');
  },
};
