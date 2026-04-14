'use strict';

/** Migration 10 may already have created some of these indexes (partial overlap). */
async function indexExists(queryInterface, tableName, indexName) {
  const indexes = await queryInterface.showIndex(tableName);
  const want = String(indexName).toLowerCase();
  return indexes.some((ix) => String(ix.name).toLowerCase() === want);
}

async function addIndexIfMissing(queryInterface, table, fields, options) {
  const name = options.name;
  if (!(await indexExists(queryInterface, table, name))) {
    await queryInterface.addIndex(table, fields, options);
  }
}

async function removeIndexIfExists(queryInterface, table, indexName) {
  if (await indexExists(queryInterface, table, indexName)) {
    await queryInterface.removeIndex(table, indexName);
  }
}

module.exports = {
  async up(queryInterface) {
    // userId is already covered by FK index; composite helps history + status filters
    await addIndexIfMissing(queryInterface, 'GameSession', ['status'], {
      name: 'idx_gamesession_status',
    });
    await addIndexIfMissing(queryInterface, 'GameSession', ['userId', 'status'], {
      name: 'idx_gamesession_user_status',
    });
    await addIndexIfMissing(queryInterface, 'GameSession', ['challengeId'], {
      name: 'idx_gamesession_challengeId',
    });

    await addIndexIfMissing(queryInterface, 'Badge', ['category'], {
      name: 'idx_badge_category',
    });
    await addIndexIfMissing(queryInterface, 'Badge', ['isActive'], {
      name: 'idx_badge_isActive',
    });
    await addIndexIfMissing(queryInterface, 'Badge', ['category', 'isActive'], {
      name: 'idx_badge_category_active',
    });
    await addIndexIfMissing(queryInterface, 'UserBadge', ['badgeId'], {
      name: 'idx_userbadge_badgeId',
    });
  },

  async down(queryInterface) {
    await removeIndexIfExists(queryInterface, 'UserBadge', 'idx_userbadge_badgeId');
    await removeIndexIfExists(queryInterface, 'Badge', 'idx_badge_category_active');
    await removeIndexIfExists(queryInterface, 'Badge', 'idx_badge_isActive');
    await removeIndexIfExists(queryInterface, 'Badge', 'idx_badge_category');
    await removeIndexIfExists(queryInterface, 'GameSession', 'idx_gamesession_challengeId');
    await removeIndexIfExists(queryInterface, 'GameSession', 'idx_gamesession_user_status');
    await removeIndexIfExists(queryInterface, 'GameSession', 'idx_gamesession_status');
  },
};
