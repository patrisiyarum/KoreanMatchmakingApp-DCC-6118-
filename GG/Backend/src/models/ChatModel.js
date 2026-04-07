import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ChatModel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

    }
  };
  ChatModel.init({
    senderId: DataTypes.STRING,
    receiverId: DataTypes.STRING,

    aiAccessAllowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }
  }, {
    sequelize,
    modelName: 'ChatModel',
    tableName: 'ChatModel'
  });

  return ChatModel;
};