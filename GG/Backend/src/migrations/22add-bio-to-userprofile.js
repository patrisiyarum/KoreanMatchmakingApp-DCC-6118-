/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const table = 'UserProfile';
    const desc = await queryInterface.describeTable(table).catch(() => null);
    if (!desc || desc.bio) return;
    await queryInterface.addColumn(table, 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const table = 'UserProfile';
    const desc = await queryInterface.describeTable(table).catch(() => null);
    if (!desc || !desc.bio) return;
    await queryInterface.removeColumn(table, 'bio');
  },
};
