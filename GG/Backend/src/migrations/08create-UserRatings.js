export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("UserRatings", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "UserProfile", key: "id" },
      onDelete: "CASCADE",
    },

    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn("NOW"),
    },

    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn("NOW"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("UserRatings");
}