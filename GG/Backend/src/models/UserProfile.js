import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserProfile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define associations here
      this.hasMany(models.UserAvailability, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE'
      });
      this.belongsToMany(models.Interest, {
        through: models.UserInterest,
        foreignKey: 'user_id'
      });
      
    }
  };
  UserProfile.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    native_language: DataTypes.STRING,
    target_language: DataTypes.STRING,
    target_language_proficiency: DataTypes.STRING,
    age: DataTypes.INTEGER,
    gender: DataTypes.STRING,
    profession: DataTypes.STRING,
    mbti: DataTypes.STRING,
    zodiac: DataTypes.STRING,
    default_time_zone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'UTC'
    },
      rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    learning_goal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    communication_style: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    commitment_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
    },
    visibility: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserProfile',
  });
  return UserProfile;
};