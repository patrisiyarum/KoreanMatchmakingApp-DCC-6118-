import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class FriendRequest extends Model {
    static associate(models) {
      if (models.UserAccount) {
        FriendRequest.belongsTo(models.UserAccount, { foreignKey: 'requesterId', as: 'requester' });
        FriendRequest.belongsTo(models.UserAccount, { foreignKey: 'recipientId', as: 'recipient' });
      }
    }
  }

  FriendRequest.init(
    {
      requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      recipientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pairUser1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pairUser2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled', 'removed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      lastActionBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      blockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'FriendRequest',
      indexes: [
        {
          unique: true,
          fields: ['pairUser1Id', 'pairUser2Id'],
        },
      ],
    }
  );

  return FriendRequest;
};
