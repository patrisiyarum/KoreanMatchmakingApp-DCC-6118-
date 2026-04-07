/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('ChatModel');
    if (!table.aiAccessAllowed) {
      await queryInterface.addColumn('ChatModel', 'aiAccessAllowed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        after: 'receiverId'
      });
      await queryInterface.addIndex('ChatModel', ['aiAccessAllowed']);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('ChatModel', ['aiAccessAllowed']).catch(() => {});
    const table = await queryInterface.describeTable('ChatModel');
    if (table.aiAccessAllowed) {
      await queryInterface.removeColumn('ChatModel', 'aiAccessAllowed');
    }
  }
};