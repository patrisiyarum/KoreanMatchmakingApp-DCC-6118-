import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserTranslations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
    }
  };
  UserTranslations.init({
    en: {
        type: DataTypes.STRING,
        primaryKey: true
      },
    ko: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'UserTranslations',
  });

  return UserTranslations;
};