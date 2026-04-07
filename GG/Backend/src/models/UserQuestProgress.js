

import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserQuestProgress extends Model {
    static associate(models) {
      if (models.UserAccount) {
        UserQuestProgress.belongsTo(models.UserAccount, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
      if (models.Quest) {
        UserQuestProgress.belongsTo(models.Quest, {
          foreignKey: 'questId',
          as: 'quest',
        });
      }
    }
  }

  UserQuestProgress.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    lastResetAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: 'UserQuestProgress',
    tableName: 'UserQuestProgress',
  });

  return UserQuestProgress;
};
