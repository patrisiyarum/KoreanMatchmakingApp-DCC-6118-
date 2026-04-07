'use strict';

module.exports = {
  async up(queryInterface) {
    // userId is already covered by FK index; composite helps history + status filters
    await queryInterface.addIndex('GameSession', ['status'], {
      name: 'idx_gamesession_status',
    });
    await queryInterface.addIndex('GameSession', ['userId', 'status'], {
      name: 'idx_gamesession_user_status',
    });
    await queryInterface.addIndex('GameSession', ['challengeId'], {
      name: 'idx_gamesession_challengeId',
    });

    await queryInterface.addIndex('Badge', ['category'], {
      name: 'idx_badge_category',
    });
    await queryInterface.addIndex('Badge', ['isActive'], {
      name: 'idx_badge_isActive',
    });
    await queryInterface.addIndex('Badge', ['category', 'isActive'], {
      name: 'idx_badge_category_active',
    });
    await queryInterface.addIndex('UserBadge', ['badgeId'], {
      name: 'idx_userbadge_badgeId',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('UserBadge', 'idx_userbadge_badgeId');
    await queryInterface.removeIndex('Badge', 'idx_badge_category_active');
    await queryInterface.removeIndex('Badge', 'idx_badge_isActive');
    await queryInterface.removeIndex('Badge', 'idx_badge_category');
    await queryInterface.removeIndex('GameSession', 'idx_gamesession_challengeId');
    await queryInterface.removeIndex('GameSession', 'idx_gamesession_user_status');
    await queryInterface.removeIndex('GameSession', 'idx_gamesession_status');
  },
};
