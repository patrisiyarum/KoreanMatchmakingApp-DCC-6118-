import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PostcardModel extends Model {
    static associate(models) {}
  }

  PostcardModel.init(
    {
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Free-text message (max 200 chars enforced at controller)
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Key into the predefined BACKGROUNDS catalog (e.g. 'cherry-blossom')
      backgroundRef: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'cream',
      },
      // JSON array of sticker keys from the predefined STICKERS catalog (max 5)
      // Stored as TEXT and parsed in the service layer for broad MySQL compatibility
      stickerRefs: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('stickerRefs');
          try {
            return JSON.parse(raw || '[]');
          } catch {
            return [];
          }
        },
        set(val) {
          this.setDataValue('stickerRefs', JSON.stringify(Array.isArray(val) ? val : []));
        },
      },
      // Set to createdAt on insert; kept separate so it's explicit and queryable
      sentAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      // Null until the recipient opens the postcard
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // JSON array of /uploads/... paths — max 4 for attachment, max 1 for background
      imageUrls: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('imageUrls');
          try { return JSON.parse(raw || '[]'); } catch { return []; }
        },
        set(val) {
          this.setDataValue('imageUrls', JSON.stringify(Array.isArray(val) ? val : []));
        },
      },
      // How attached images are displayed: 'background' (dim overlay) | 'attachment' (flip carousel)
      imagePlacement: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'attachment',
      },
    },
    {
      sequelize,
      modelName: 'PostcardModel',
      tableName: 'PostcardModel',
    }
  );

  return PostcardModel;
};
