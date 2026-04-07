

export default {
  async up(queryInterface, Sequelize) {
    // Create Team table
    await queryInterface.createTable('Team', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '🏆',
      },
      inviteCode: {
        type: Sequelize.STRING(8),
        allowNull: false,
        unique: true,
      },
      totalXP: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ownerID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'useraccount', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Create TeamMember join table
    await queryInterface.createTable('TeamMember', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      teamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Team', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'useraccount', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TeamMember');
    await queryInterface.dropTable('Team');
  },
};
