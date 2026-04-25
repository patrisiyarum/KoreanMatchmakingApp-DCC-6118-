import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PostcardRecentMediaModel extends Model {
    static associate(models) {}
  }

  PostcardRecentMediaModel.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // 'sticker' or 'background'
      assetType: {
        type: DataTypes.ENUM('sticker', 'background'),
        allowNull: false,
      },
      // The catalog key (e.g. 'cherry-blossom', 'lantern')
      assetRef: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'PostcardRecentMediaModel',
      tableName: 'PostcardRecentMediaModel',
      indexes: [
        // Unique constraint enables upsert by (userId, assetType, assetRef)
        { unique: true, fields: ['userId', 'assetType', 'assetRef'] },
      ],
    }
  );

  return PostcardRecentMediaModel;
};
