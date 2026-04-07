export async function up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("AIChats");
  
    // If `user_id` exists, rename it to `userId`
    if (tableInfo.user_id && !tableInfo.userId) {
      await queryInterface.renameColumn("AIChats", "user_id", "userId");
      console.log("Renamed column user_id → userId in AIChats");
    } 
    // If neither exist, add `userId`
    else if (!tableInfo.user_id && !tableInfo.userId) {
      await queryInterface.addColumn("AIChats", "userId", {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
      console.log("Added column userId to AIChats");
    } else {
      console.log("userId column already exists, skipping");
    }
  }
  
  export async function down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("AIChats");
  
    // If `userId` exists, rename it back to `user_id`
    if (tableInfo.userId && !tableInfo.user_id) {
      await queryInterface.renameColumn("AIChats", "userId", "user_id");
      console.log("Renamed column userId → user_id in AIChats");
    } 
    // If `userId` exists and `user_id` doesn’t, but you want to drop instead
    else if (tableInfo.userId) {
      await queryInterface.removeColumn("AIChats", "userId");
      console.log("Removed column userId from AIChats");
    }
  }  