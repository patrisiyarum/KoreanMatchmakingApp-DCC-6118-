import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Badge extends Model {
    static associate(models) {
      if (models.UserBadge) {
        Badge.hasMany(models.UserBadge, {
          foreignKey: 'badgeId',
          as: 'userBadges',
        });
      }
    }
  }

  Badge.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '🏅',
    },
    category: {
      type: DataTypes.ENUM('games', 'social', 'learning', 'streak', 'level'),
      allowNull: false,
      defaultValue: 'games',
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      allowNull: false,
      defaultValue: 'bronze',
    },
    criteriaType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    criteriaValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Badge',
  });

  return Badge;
};
