import db from '../models/index.js';

const BADGE_DEFINITIONS = [
  // -- Games category --
  { name: 'First Steps', description: 'Complete your first game', icon: '👣', category: 'games', tier: 'bronze', criteriaType: 'games_played', criteriaValue: 1 },
  { name: 'Getting Started', description: 'Complete 5 games', icon: '🎮', category: 'games', tier: 'bronze', criteriaType: 'games_played', criteriaValue: 5 },
  { name: 'Game Enthusiast', description: 'Complete 25 games', icon: '🕹️', category: 'games', tier: 'silver', criteriaType: 'games_played', criteriaValue: 25 },
  { name: 'Game Master', description: 'Complete 100 games', icon: '🏆', category: 'games', tier: 'gold', criteriaType: 'games_played', criteriaValue: 100 },
  { name: 'Legendary Player', description: 'Complete 500 games', icon: '👑', category: 'games', tier: 'platinum', criteriaType: 'games_played', criteriaValue: 500 },

  // -- Learning category --
  { name: 'Vocab Starter', description: 'Complete 1 Term Matching game', icon: '📖', category: 'learning', tier: 'bronze', criteriaType: 'term_matching_played', criteriaValue: 1 },
  { name: 'Vocab Builder', description: 'Complete 10 Term Matching games', icon: '📚', category: 'learning', tier: 'silver', criteriaType: 'term_matching_played', criteriaValue: 10 },
  { name: 'Grammar Rookie', description: 'Complete 1 Grammar Quiz', icon: '✏️', category: 'learning', tier: 'bronze', criteriaType: 'grammar_quiz_played', criteriaValue: 1 },
  { name: 'Grammar Guru', description: 'Complete 10 Grammar Quizzes', icon: '🎓', category: 'learning', tier: 'silver', criteriaType: 'grammar_quiz_played', criteriaValue: 10 },
  { name: 'Voice Starter', description: 'Complete 1 Pronunciation Drill', icon: '🎤', category: 'learning', tier: 'bronze', criteriaType: 'pronunciation_played', criteriaValue: 1 },
  { name: 'Pronunciation Pro', description: 'Complete 10 Pronunciation Drills', icon: '🗣️', category: 'learning', tier: 'silver', criteriaType: 'pronunciation_played', criteriaValue: 10 },

  // -- Score milestones --
  { name: 'Perfect Round', description: 'Score 100% on any game', icon: '💯', category: 'games', tier: 'silver', criteriaType: 'perfect_score', criteriaValue: 1 },
  { name: 'Perfectionist', description: 'Score 100% on 10 games', icon: '⭐', category: 'games', tier: 'gold', criteriaType: 'perfect_score', criteriaValue: 10 },

  // -- Level category --
  { name: 'Level 2', description: 'Reach level 2', icon: '🌱', category: 'level', tier: 'bronze', criteriaType: 'level_reached', criteriaValue: 2 },
  { name: 'Level 5', description: 'Reach level 5', icon: '🌿', category: 'level', tier: 'bronze', criteriaType: 'level_reached', criteriaValue: 5 },
  { name: 'Level 10', description: 'Reach level 10', icon: '🌳', category: 'level', tier: 'silver', criteriaType: 'level_reached', criteriaValue: 10 },
  { name: 'Level 25', description: 'Reach level 25', icon: '🔥', category: 'level', tier: 'gold', criteriaType: 'level_reached', criteriaValue: 25 },
  { name: 'Level 50', description: 'Reach level 50', icon: '💎', category: 'level', tier: 'platinum', criteriaType: 'level_reached', criteriaValue: 50 },

  // -- Social category --
  { name: 'Social Butterfly', description: 'Add your first friend', icon: '🦋', category: 'social', tier: 'bronze', criteriaType: 'friends_count', criteriaValue: 1 },
  { name: 'Popular', description: 'Have 10 friends', icon: '🤝', category: 'social', tier: 'silver', criteriaType: 'friends_count', criteriaValue: 10 },

  // -- Quest category --
  { name: 'Quest Beginner', description: 'Complete your first quest', icon: '📋', category: 'learning', tier: 'bronze', criteriaType: 'quests_completed', criteriaValue: 1 },
  { name: 'Quest Hunter', description: 'Complete 10 quests', icon: '🗺️', category: 'learning', tier: 'silver', criteriaType: 'quests_completed', criteriaValue: 10 },
  { name: 'Quest Legend', description: 'Complete 50 quests', icon: '🏅', category: 'learning', tier: 'gold', criteriaType: 'quests_completed', criteriaValue: 50 },
];

export async function syncBadgeDefinitions() {
  for (const def of BADGE_DEFINITIONS) {
    await db.Badge.findOrCreate({
      where: { name: def.name },
      defaults: def,
    });
  }
}

async function getUserStat(userId, criteriaType) {
  try {
    const { Op } = await import('sequelize');

    switch (criteriaType) {
      case 'games_played':
      case 'term_matching_played':
      case 'grammar_quiz_played':
      case 'pronunciation_played':
      case 'perfect_score': {
        const user = await db.UserAccount.findByPk(userId);
        if (!user) return 0;
        const stats = user.gameStats ? (typeof user.gameStats === 'string' ? JSON.parse(user.gameStats) : user.gameStats) : {};
        return stats[criteriaType] || 0;
      }

      case 'level_reached': {
        const user = await db.UserAccount.findByPk(userId);
        return user ? (user.level || 1) : 0;
      }

      case 'friends_count': {
        if (!db.FriendsModel) return 0;
        return await db.FriendsModel.count({ where: { [Op.or]: [{ user1_ID: userId }, { user2_ID: userId }] } });
      }

      case 'quests_completed': {
        if (!db.UserQuestProgress) return 0;
        return await db.UserQuestProgress.count({ where: { userId, completed: true } });
      }

      default:
        return 0;
    }
  } catch (err) {
    console.warn(`getUserStat(${criteriaType}) failed:`, err.message);
    return 0;
  }
}

export async function checkAndAwardBadges(userId) {
  const badges = await db.Badge.findAll({ where: { isActive: true } });
  const existingUserBadges = await db.UserBadge.findAll({ where: { userId } });
  const earnedBadgeIds = new Set(existingUserBadges.map(ub => ub.badgeId));

  const newlyEarned = [];

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const stat = await getUserStat(userId, badge.criteriaType);
    if (stat >= badge.criteriaValue) {
      try {
        await db.UserBadge.create({
          userId,
          badgeId: badge.id,
          earnedAt: new Date(),
        });
        // Avoid duplicate toast entries if this function runs again quickly.
        earnedBadgeIds.add(badge.id);
        newlyEarned.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          tier: badge.tier,
          category: badge.category,
        });
      } catch (err) {
        // Likely a unique constraint race (already earned). Ignore safely.
        console.warn('checkAndAwardBadges create skipped:', err.message);
        earnedBadgeIds.add(badge.id);
      }
    }
  }

  return newlyEarned;
}

export async function incrementGameStat(userId, statKey, amount = 1) {
  const user = await db.UserAccount.findByPk(userId);
  if (!user) return;

  const stats = user.gameStats ? (typeof user.gameStats === 'string' ? JSON.parse(user.gameStats) : user.gameStats) : {};
  stats[statKey] = (stats[statKey] || 0) + amount;
  stats['games_played'] = (stats['games_played'] || 0) + (statKey !== 'games_played' && statKey !== 'perfect_score' ? amount : 0);

  await user.update({ gameStats: JSON.stringify(stats) });
}

export async function getUserBadges(userId) {
  const userBadges = await db.UserBadge.findAll({
    where: { userId },
    include: [{ model: db.Badge, as: 'badge' }],
    order: [['earnedAt', 'DESC']],
  });

  return userBadges.map(ub => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    icon: ub.badge.icon,
    tier: ub.badge.tier,
    category: ub.badge.category,
    earnedAt: ub.earnedAt,
  }));
}

export async function getAllBadgesWithProgress(userId) {
  const badges = await db.Badge.findAll({ where: { isActive: true }, order: [['category'], ['criteriaValue']] });
  const userBadges = await db.UserBadge.findAll({ where: { userId } });
  const earnedSet = new Set(userBadges.map(ub => ub.badgeId));

  const result = [];
  for (const badge of badges) {
    const stat = await getUserStat(userId, badge.criteriaType);
    result.push({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,
      category: badge.category,
      criteriaType: badge.criteriaType,
      criteriaValue: badge.criteriaValue,
      currentProgress: Math.min(stat, badge.criteriaValue),
      earned: earnedSet.has(badge.id),
      earnedAt: userBadges.find(ub => ub.badgeId === badge.id)?.earnedAt || null,
    });
  }

  return result;
}
