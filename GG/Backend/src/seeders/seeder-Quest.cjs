'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const quests = [
      // Individual quests
      {
        title: 'First Term Match',
        description: 'Complete your first term matching game',
        type: 'individual',
        gameType: 'term-matching',
        goal: 1,
        xpReward: 25,
        resetType: 'permanent',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Grammar Master',
        description: 'Complete 3 grammar quiz games',
        type: 'individual',
        gameType: 'grammar-quiz',
        goal: 3,
        xpReward: 75,
        resetType: 'permanent',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Pronunciation Practice',
        description: 'Complete 2 pronunciation drills',
        type: 'individual',
        gameType: 'pronunciation-drill',
        goal: 2,
        xpReward: 50,
        resetType: 'permanent',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Daily Player',
        description: 'Play any game today',
        type: 'individual',
        gameType: null,
        goal: 1,
        xpReward: 15,
        resetType: 'daily',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Team quests
      {
        title: 'Team Term Match',
        description: 'Complete 5 term matching games as a team',
        type: 'team',
        gameType: 'term-matching',
        goal: 5,
        xpReward: 100,
        resetType: 'permanent',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Team Grammar',
        description: 'Complete 3 grammar quizzes as a team',
        type: 'team',
        gameType: 'grammar-quiz',
        goal: 3,
        xpReward: 90,
        resetType: 'permanent',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Team Pronunciation',
        description: 'Complete 2 pronunciation drills as a team',
        type: 'team',
        gameType: 'pronunciation-drill',
        goal: 2,
        xpReward: 60,
        resetType: 'permanent',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await queryInterface.bulkInsert('Quest', quests, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Quest', null, {});
  },
};
