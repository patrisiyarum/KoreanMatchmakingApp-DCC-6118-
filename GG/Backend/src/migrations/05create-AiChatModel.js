export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable("AIChats", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "UserAccount", key: "id" },
        onDelete: "CASCADE",
      },
      conversation: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("AIChats");
  }
  