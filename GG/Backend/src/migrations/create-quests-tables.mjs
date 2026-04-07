

export default {
  async up(queryInterface, Sequelize) {

    // ── Quest definitions ──
    await queryInterface.createTable('Quest', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // 'individual' or 'team'
      type: {
        type: Sequelize.ENUM('individual', 'team'),
        allowNull: false,
        defaultValue: 'individual',
      },
      // Which game this quest belongs to — null means any/all games
      // Values will match game route names e.g. 'term-matching', 'grammar-quiz', 'pronunciation-drill'
      gameType: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      // How many times the action must be completed
      goal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      // XP awarded on completion
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      // 'daily' resets every day, 'weekly' resets every week, 'permanent' never resets
      resetType: {
        type: Sequelize.ENUM('daily', 'weekly', 'permanent'),
        allowNull: false,
        defaultValue: 'permanent',
      },
      // Easy on/off switch — set false to hide without deleting
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ── Individual user progress per quest ──
    await queryInterface.createTable('UserQuestProgress', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'useraccount', key: 'id' },
        onDelete: 'CASCADE',
      },
      questId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Quest', key: 'id' },
        onDelete: 'CASCADE',
      },
      // How far along the user is toward the goal
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Whether the quest has been completed
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // When the quest was completed — null if not yet done
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      // When progress was last reset (for daily/weekly quests)
      lastResetAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Unique constraint — one progress row per user per quest
    await queryInterface.addIndex('UserQuestProgress', ['userId', 'questId'], {
      unique: true,
      name: 'unique_user_quest',
    });

    // ── Team progress per quest ──
    await queryInterface.createTable('TeamQuestProgress', {
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
      questId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Quest', key: 'id' },
        onDelete: 'CASCADE',
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      lastResetAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Unique constraint — one progress row per team per quest
    await queryInterface.addIndex('TeamQuestProgress', ['teamId', 'questId'], {
      unique: true,
      name: 'unique_team_quest',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TeamQuestProgress');
    await queryInterface.dropTable('UserQuestProgress');
    await queryInterface.dropTable('Quest');
  },
};
