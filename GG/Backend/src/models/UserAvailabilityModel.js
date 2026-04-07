import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserAvailability extends Model {
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

    }
  };
  UserAvailability.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserProfile',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    day_of_week: {
      type: DataTypes.STRING, // e.g., 'Monday', 'Tuesday',...
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME, // e.g. '09:00'
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME, // e.g. '17:00'
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'UserAvailability'
  });
  return UserAvailability;
};