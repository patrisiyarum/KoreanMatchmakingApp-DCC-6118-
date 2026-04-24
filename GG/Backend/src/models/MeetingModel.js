import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Meeting extends Model {
    /**
     * Define associations.
     * Called automatically by models/index.js
     */
    static associate(models) {
      // Meeting → UserProfile (user 1)
      this.belongsTo(models.UserProfile, {
        as: 'user1',
        foreignKey: 'user1_id',
        onDelete: 'CASCADE'
      });

      // Meeting → UserProfile (user 2)
      this.belongsTo(models.UserProfile, {
        as: 'user2',
        foreignKey: 'user2_id',
        onDelete: 'CASCADE'
      });
    }
  }

  Meeting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      user1_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      user2_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      day_of_week: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      start_time: {
        type: DataTypes.TIME,
        allowNull: false
      },

      end_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      topic: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zoom_link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Meeting',
      // Default matches migration `MeetingModel`. If production DB has a different casing/name, set MEETING_TABLE_NAME in .env.
      tableName: process.env.MEETING_TABLE_NAME || "MeetingModel",
      timestamps: true,     // createdAt + updatedAt
      underscored: true
    }
  );

  return Meeting;
};