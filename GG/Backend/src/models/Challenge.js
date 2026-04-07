import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Challenge extends Model {
    static associate(models) {
      if (models.UserAccount) {
        Challenge.belongsTo(models.UserAccount, { foreignKey: 'challengerId', as: 'challenger' });
        Challenge.belongsTo(models.UserAccount, { foreignKey: 'challengedId', as: 'challenged' });
      }
      if (models.GameSession) {
        Challenge.hasMany(models.GameSession, { foreignKey: 'challengeId', as: 'sessions' });
      }
    }
  }

  Challenge.init({
    challengerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    challengedId: {
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
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    challengerScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    challengedScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    winnerId: {
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
    modelName: 'Challenge',
  });

  return Challenge;
};
