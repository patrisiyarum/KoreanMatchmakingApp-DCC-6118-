import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class AIChatModel extends Model {
    static associate(models) {
    }
  }

  AIChatModel.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      conversation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "AIChatModel",
      tableName: "AIChats",
      timestamps: true,
    }
  );

  return AIChatModel;
};