export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("PronunciationRatings", {
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

    time: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn("NOW"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("PronunciationRatings");
}
