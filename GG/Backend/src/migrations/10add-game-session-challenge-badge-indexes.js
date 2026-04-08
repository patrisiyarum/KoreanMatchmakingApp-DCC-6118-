/**
 * Performance indexes for challenge stats, game session history, and badge lookups.
 * Safe to re-run: ignores duplicate index name errors.
 */

async function safeAddIndex(queryInterface, table, fields, name) {
  try {
    await queryInterface.addIndex(table, fields, { name });
  } catch (e) {
    const msg = String(e?.message || e || '');
    if (!/exists|duplicate|already/i.test(msg)) throw e;
  }
}

export async function up(queryInterface) {
  await safeAddIndex(queryInterface, 'GameSession', ['userId', 'status'], 'idx_gamesession_user_status');
  await safeAddIndex(queryInterface, 'GameSession', ['challengeId'], 'idx_gamesession_challengeId');
  await safeAddIndex(queryInterface, 'Challenge', ['winnerId'], 'idx_challenge_winnerId');
  await safeAddIndex(queryInterface, 'Challenge', ['challengerId', 'status'], 'idx_challenge_challenger_status');
  await safeAddIndex(queryInterface, 'Challenge', ['challengedId', 'status'], 'idx_challenge_challenged_status');
  await safeAddIndex(queryInterface, 'UserBadge', ['badgeId'], 'idx_userbadge_badgeId');
}

export async function down(queryInterface) {
  const pairs = [
    ['GameSession', 'idx_gamesession_user_status'],
    ['GameSession', 'idx_gamesession_challengeId'],
    ['Challenge', 'idx_challenge_winnerId'],
    ['Challenge', 'idx_challenge_challenger_status'],
    ['Challenge', 'idx_challenge_challenged_status'],
    ['UserBadge', 'idx_userbadge_badgeId'],
  ];
  for (const [table, name] of pairs) {
    try {
      await queryInterface.removeIndex(table, name);
    } catch {
      /* ignore */
    }
  }
}
