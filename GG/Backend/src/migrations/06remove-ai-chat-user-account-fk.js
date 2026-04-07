export async function up(queryInterface, Sequelize) {
  const [constraints] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME 
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_NAME = 'AIChats' 
     AND TABLE_SCHEMA = DATABASE()
     AND REFERENCED_TABLE_NAME IS NOT NULL
     AND COLUMN_NAME = 'user_id'`
  );

  for (const constraint of constraints) {
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE AIChats DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`
      );
      console.log(`Removed foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
    } catch (error) {
      console.error(`Error removing constraint ${constraint.CONSTRAINT_NAME}:`, error);
      // Continue even if one fails
    }
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addConstraint("AIChats", {
    fields: ["user_id"],
    type: "foreign key",
    name: "AIChats_user_id_UserAccount_fk",
    references: {
      table: "UserAccount",
      field: "id",
    },
    onDelete: "CASCADE",
  });
}

