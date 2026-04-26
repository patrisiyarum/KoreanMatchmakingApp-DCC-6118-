import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class VideoCallInvite extends Model {
    static associate(models) {
      if (models.UserAccount) {
        VideoCallInvite.belongsTo(models.UserAccount, { foreignKey: 'callerId', as: 'caller' });
        VideoCallInvite.belongsTo(models.UserAccount, { foreignKey: 'calleeId', as: 'callee' });
      }
    }
  }

  VideoCallInvite.init(
    {
      callerId: { type: DataTypes.INTEGER, allowNull: false },
      calleeId: { type: DataTypes.INTEGER, allowNull: false },
      channelId: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('ringing', 'accepted', 'declined', 'cancelled', 'missed'),
        allowNull: false,
        defaultValue: 'ringing',
      },
      respondedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'VideoCallInvite',
      indexes: [
        { fields: ['calleeId', 'status'] },
        { fields: ['callerId', 'status'] },
        { fields: ['channelId'] },
      ],
    }
  );

  return VideoCallInvite;
};
