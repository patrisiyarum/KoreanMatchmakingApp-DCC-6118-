import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class TeamInvite extends Model {
    static associate(models) {
      if (models.Team) {
        TeamInvite.belongsTo(models.Team, { foreignKey: 'teamId' });
      }
      if (models.UserAccount) {
        TeamInvite.belongsTo(models.UserAccount, { foreignKey: 'inviterId', as: 'inviter' });
        TeamInvite.belongsTo(models.UserAccount, { foreignKey: 'inviteeId', as: 'invitee' });
      }
    }
  }

  TeamInvite.init({
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    inviterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    inviteeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'TeamInvite',
    tableName: 'TeamInvite',
  });

  return TeamInvite;
};
