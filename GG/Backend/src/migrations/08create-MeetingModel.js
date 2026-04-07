'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MeetingModel', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user1_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'UserProfile', // must match your UserProfile table
          key: 'id',
        },
        onDelete: 'CASCADE',
      },

      user2_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'UserProfile', // must match your UserProfile table
          key: 'id',
        },
        onDelete: 'CASCADE',
      },

      day_of_week: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },

      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MeetingModel');
  },
};