import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserInterest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define associations here
      this.belongsTo(models.UserProfile, {
        foreignKey: 'user_id'
      });
      this.belongsTo(models.Interest, {
        foreignKey: 'interest_id'
      });
    }
  }

  UserInterest.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'UserProfile',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    interest_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Interest',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'UserInterest',
    timestamps: true
  });
  return UserInterest;
};