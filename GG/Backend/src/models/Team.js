import { Model } from 'sequelize';
 
export default (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
      if (models.TeamMember) {
        Team.hasMany(models.TeamMember, { foreignKey: 'teamId', as: 'members' });
      }
      if (models.UserAccount) {
        Team.belongsTo(models.UserAccount, { foreignKey: 'ownerID', as: 'owner' });
      }
    }
  }
 
  Team.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '🏆',
    },
    inviteCode: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true,
    },
    totalXP: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ownerID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teamImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: 'Team',
  });
 
  return Team;
};
 