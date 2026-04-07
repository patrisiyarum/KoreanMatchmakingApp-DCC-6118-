import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Interest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.UserProfile, {
        through: models.UserInterest,
        foreignKey: 'interest_id'
      });
    }
  }

  Interest.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    interest_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Interest',
    tableName: 'Interest',
    timestamps: false
  });
  return Interest;
};