import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class TeamMatch extends Model {
    static associate(models) {
      if (models.Team) {
        TeamMatch.belongsTo(models.Team, { foreignKey: 'teamAId', as: 'teamA' });
        TeamMatch.belongsTo(models.Team, { foreignKey: 'teamBId', as: 'teamB' });
      }
    }
  }

  TeamMatch.init(
    {
      teamAId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      teamBId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('waiting', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'waiting',
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'TeamMatch',
      indexes: [
        { fields: ['teamAId'] },
        { fields: ['teamBId'] },
        { fields: ['status'] },
      ],
    }
  );

  return TeamMatch;
};
