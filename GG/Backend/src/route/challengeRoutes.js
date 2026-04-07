import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const CHALLENGE_XP_BONUS = 25;
const XP_PER_LEVEL = 500;

async function awardXp(userId, xpAmount) {
  const user = await db.UserAccount.findByPk(userId);
  if (!user) return;
  let newXp = (user.xp || 0) + xpAmount;
  let newLevel = user.level || 1;
  while (newXp >= newLevel * XP_PER_LEVEL) {
    newXp -= newLevel * XP_PER_LEVEL;
    newLevel++;
  }
  await user.update({ xp: newXp, level: newLevel });
}

async function areUsersFriends(userIdA, userIdB) {
  const { QueryTypes } = db.Sequelize;
  const rows = await db.sequelize.query(
    `
      SELECT 1
      FROM FriendsModel
      WHERE ((user1_ID = :userIdA AND user2_ID = :userIdB)
         OR (user1_ID = :userIdB AND user2_ID = :userIdA))
        AND status = 'accepted'
      LIMIT 1
    `,
    {
      replacements: { userIdA, userIdB },
      type: QueryTypes.SELECT,
    }
  );
  return rows.length > 0;
}

async function getFriendOptions(userId) {
  const { QueryTypes } = db.Sequelize;
  return db.sequelize.query(
    `
      SELECT DISTINCT u.id, u.firstName, u.lastName, u.email
      FROM FriendsModel f
      JOIN useraccount u ON (u.id = f.user2_ID AND f.user1_ID = :userId)
                       OR (u.id = f.user1_ID AND f.user2_ID = :userId)
      WHERE f.status = 'accepted'
      ORDER BY u.firstName ASC, u.lastName ASC, u.id ASC
    `,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
}

// GET /api/challenges/friends/:userId  — friend list formatted for opponent selector
router.get('/friends/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const friends = await getFriendOptions(userId);
    const options = friends.map((f) => ({
      id: f.id,
      label: `${f.firstName || ''} ${f.lastName || ''}`.trim() || `User #${f.id}`,
      email: f.email || null,
    }));

    return res.status(200).json({ friends: options });
  } catch (err) {
    console.error('Error fetching challenge friend options:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/challenges  — send a challenge to another user
router.post('/', async (req, res) => {
  try {
    const { challengerId, challengedId, gameType, difficulty } = req.body;
    if (!challengerId || !challengedId || !gameType) {
      return res.status(400).json({ error: 'challengerId, challengedId, and gameType are required' });
    }
    if (Number(challengerId) === Number(challengedId)) {
      return res.status(400).json({ error: 'Cannot challenge yourself' });
    }

    const [challenger, challenged] = await Promise.all([
      db.UserAccount.findByPk(challengerId),
      db.UserAccount.findByPk(challengedId),
    ]);
    if (!challenger || !challenged) {
      return res.status(404).json({ error: 'One or both users were not found' });
    }

    const isFriend = await areUsersFriends(Number(challengerId), Number(challengedId));
    if (!isFriend) {
      return res.status(403).json({ error: 'You can only challenge users in your friends list' });
    }

    const challenge = await db.Challenge.create({
      challengerId,
      challengedId,
      gameType,
      difficulty: difficulty || 'Beginner',
      status: 'pending',
    });

    return res.status(201).json({ challenge });
  } catch (err) {
    console.error('Error creating challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/user/:userId  — get all challenges for a user (sent & received)
router.get('/user/:userId', async (req, res) => {
  try {
    const { Op } = await import('sequelize');
    const { userId } = req.params;
    const { status } = req.query;

    const now = new Date();
    const expireThreshold = new Date(now - 24 * 60 * 60 * 1000);   // 24 hours ago
    const cleanupThreshold = new Date(now - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Auto-expire pending challenges older than 24 hours (no response)
    await db.Challenge.update(
      { status: 'expired' },
      {
        where: {
          status: 'pending',
          createdAt: { [Op.lt]: expireThreshold },
        },
      }
    );

    // Auto-expire accepted/in_progress challenges where opponent hasn't played in 24 hours
    await db.Challenge.update(
      { status: 'expired' },
      {
        where: {
          status: { [Op.in]: ['accepted', 'in_progress'] },
          updatedAt: { [Op.lt]: expireThreshold },
        },
      }
    );

    const where = {
      [Op.or]: [{ challengerId: userId }, { challengedId: userId }],
      // Hide completed challenges older than 7 days
      [Op.not]: {
        [Op.and]: [
          { status: 'completed' },
          { completedAt: { [Op.lt]: cleanupThreshold } },
        ],
      },
    };
    if (status) where.status = status;

    const challenges = await db.Challenge.findAll({
      where,
      include: [
        { model: db.UserAccount, as: 'challenger', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.UserAccount, as: 'challenged', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ challenges });
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/:id  — get a specific challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await db.Challenge.findByPk(req.params.id, {
      include: [
        { model: db.UserAccount, as: 'challenger', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.UserAccount, as: 'challenged', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error fetching challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/challenges/:id/accept  — accept a challenge
router.put('/:id/accept', async (req, res) => {
  try {
    const { userId } = req.body || {};
    const challenge = await db.Challenge.findByPk(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge is already ${challenge.status}` });
    }

    if (userId && Number(userId) !== Number(challenge.challengedId)) {
      return res.status(403).json({ error: 'Only the challenged user can accept this challenge' });
    }

    await challenge.update({ status: 'accepted' });
    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error accepting challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/challenges/:id/decline  — decline a challenge
router.put('/:id/decline', async (req, res) => {
  try {
    const { userId } = req.body || {};
    const challenge = await db.Challenge.findByPk(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge is already ${challenge.status}` });
    }

    if (userId && Number(userId) !== Number(challenge.challengedId)) {
      return res.status(403).json({ error: 'Only the challenged user can decline this challenge' });
    }

    await challenge.update({ status: 'declined' });
    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error declining challenge:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/challenges/:id/submit-score  — submit a player's score for a challenge
router.post('/:id/submit-score', async (req, res) => {
  try {
    const { userId, score } = req.body;
    if (!userId || score === undefined) {
      return res.status(400).json({ error: 'userId and score are required' });
    }

    const challenge = await db.Challenge.findByPk(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (!['accepted', 'in_progress'].includes(challenge.status)) {
      return res.status(400).json({ error: `Challenge is ${challenge.status}, cannot submit score` });
    }

    const updates = { status: 'in_progress' };
    if (Number(userId) === challenge.challengerId) {
      updates.challengerScore = score;
    } else if (Number(userId) === challenge.challengedId) {
      updates.challengedScore = score;
    } else {
      return res.status(403).json({ error: 'User is not part of this challenge' });
    }

    await challenge.update(updates);
    await challenge.reload();

    if (challenge.challengerScore !== null && challenge.challengedScore !== null) {
      let winnerId = null;
      if (challenge.challengerScore > challenge.challengedScore) winnerId = challenge.challengerId;
      else if (challenge.challengedScore > challenge.challengerScore) winnerId = challenge.challengedId;

      await challenge.update({
        status: 'completed',
        winnerId,
        completedAt: new Date(),
      });
      await challenge.reload();
      // Award bonus XP to winner
      if (winnerId) {
        await awardXp(winnerId, CHALLENGE_XP_BONUS);
      }
    }

    return res.status(200).json({ challenge });
  } catch (err) {
    console.error('Error submitting challenge score:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/user/:userId/stats  — get challenge stats for a user
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const totalChallenges = await db.Challenge.count({
      where: {
        [db.Sequelize.Op.or]: [{ challengerId: userId }, { challengedId: userId }],
        status: 'completed',
      },
    });

    const wins = await db.Challenge.count({
      where: { winnerId: userId },
    });

    const draws = await db.Challenge.count({
      where: {
        [db.Sequelize.Op.or]: [{ challengerId: userId }, { challengedId: userId }],
        status: 'completed',
        winnerId: null,
      },
    });

    return res.status(200).json({
      totalChallenges,
      wins,
      losses: totalChallenges - wins - draws,
      draws,
      winRate: totalChallenges > 0 ? Math.round((wins / totalChallenges) * 100) : 0,
    });
  } catch (err) {
    console.error('Error fetching challenge stats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
