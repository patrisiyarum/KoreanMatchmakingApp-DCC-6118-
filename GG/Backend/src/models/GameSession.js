import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class GameSession extends Model {
    static associate(models) {
      if (models.UserAccount) {
        GameSession.belongsTo(models.UserAccount, { foreignKey: 'userId', as: 'player' });
      }
      if (models.Challenge) {
        GameSession.belongsTo(models.Challenge, { foreignKey: 'challengeId', as: 'challenge' });
      }
    }
  }

  GameSession.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Beginner',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    correct: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    challengeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: 'GameSession',
  });

  return GameSession;
};
