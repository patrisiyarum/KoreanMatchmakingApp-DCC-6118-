import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserBadge extends Model {
    static associate(models) {
      if (models.UserAccount) {
        UserBadge.belongsTo(models.UserAccount, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
      if (models.Badge) {
        UserBadge.belongsTo(models.Badge, {
          foreignKey: 'badgeId',
          as: 'badge',
        });
      }
    }
  }

  UserBadge.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    badgeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    earnedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'UserBadge',
    indexes: [
      { unique: true, fields: ['userId', 'badgeId'] },
    ],
  });

  return UserBadge;
};
