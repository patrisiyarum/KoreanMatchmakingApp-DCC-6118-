import { Model } from 'sequelize';
 
export default (sequelize, DataTypes) => {
  class TeamMember extends Model {
    static associate(models) {
      if (models.Team) {
        TeamMember.belongsTo(models.Team, { foreignKey: 'teamId' });
      }
      if (models.UserAccount) {
        TeamMember.belongsTo(models.UserAccount, { foreignKey: 'userId', as: 'user' });
      }
    }
  }
 
  TeamMember.init({
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('owner', 'member'),
      allowNull: false,
      defaultValue: 'member',
    },
  }, {
    sequelize,
    modelName: 'TeamMember',
  });
 
  return TeamMember;
};
 