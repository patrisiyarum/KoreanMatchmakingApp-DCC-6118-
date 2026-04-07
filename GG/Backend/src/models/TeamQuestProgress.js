

import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class TeamQuestProgress extends Model {
    static associate(models) {
      if (models.Team) {
        TeamQuestProgress.belongsTo(models.Team, {
          foreignKey: 'teamId',
          as: 'team',
        });
      }
      if (models.Quest) {
        TeamQuestProgress.belongsTo(models.Quest, {
          foreignKey: 'questId',
          as: 'quest',
        });
      }
    }
  }

  TeamQuestProgress.init({
    teamId: {
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
    modelName: 'TeamQuestProgress',
    tableName: 'TeamQuestProgress',
  });

  return TeamQuestProgress;
};
