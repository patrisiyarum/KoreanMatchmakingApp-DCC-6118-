import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class FriendsModel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

    }
  };
  FriendsModel.init({
    user1_ID: DataTypes.INTEGER,
    user2_ID: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM('pending', 'accepted'),
      allowNull: false,
      defaultValue: 'accepted',
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'FriendsModel',
    indexes: [
      {
        unique: true,
        fields: ['user1_ID', 'user2_ID'],
      },
    ],
  });

  return FriendsModel;
};