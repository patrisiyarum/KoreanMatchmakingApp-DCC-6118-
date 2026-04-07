export default (sequelize, DataTypes) => {
  const UserRatings = sequelize.define(
    "UserRatings",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "UserProfile", 
          key: "id",
        },
      },

      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
    },
    {
      tableName: "UserRatings",
      timestamps: true,
    }
  );

  UserRatings.associate = (models) => {
    UserRatings.belongsTo(models.UserProfile, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return UserRatings;
};