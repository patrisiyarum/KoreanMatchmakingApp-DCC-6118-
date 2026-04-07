

import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Quest extends Model {
    static associate(models) {
      if (models.UserQuestProgress) {
        Quest.hasMany(models.UserQuestProgress, {
          foreignKey: 'questId',
          as: 'userProgress',
        });
      }
      if (models.TeamQuestProgress) {
        Quest.hasMany(models.TeamQuestProgress, {
          foreignKey: 'questId',
          as: 'teamProgress',
        });
      }
    }
  }

  Quest.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('individual', 'team'),
      allowNull: false,
      defaultValue: 'individual',
    },
    gameType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    goal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    xpReward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
    },
    resetType: {
      type: DataTypes.ENUM('daily', 'weekly', 'permanent'),
      allowNull: false,
      defaultValue: 'permanent',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Quest',
    tableName: 'Quest',
  });

  return Quest;
};
