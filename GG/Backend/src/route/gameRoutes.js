
import express from 'express';
import db from '../models/index.js';

const router = express.Router();

const XP_PER_LEVEL = 500;

// GET /api/games/user-stats/:userId
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const UserAccount = db.UserAccount;
    const user = await UserAccount.findByPk(req.params.userId, {
      attributes: ['id', 'email', 'firstName', 'xp', 'level', 'profileImage'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const xpToNext = user.level * XP_PER_LEVEL;

    return res.json({
      id: user.id,
      username: user.firstName,
      xp: user.xp,
      level: user.level,
      xpToNext,
      profileImage: user.profileImage || null,
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/award-xp
// Body: { userId, xpAmount }
router.post('/award-xp', async (req, res) => {
  try {
    const UserAccount = db.UserAccount;
    const { userId, xpAmount } = req.body;

    if (!userId || !xpAmount || xpAmount <= 0) {
      return res.status(400).json({ error: 'Invalid userId or xpAmount' });
    }

    const user = await UserAccount.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let newXp = user.xp + xpAmount;
    let newLevel = user.level;
    let leveledUp = false;

    while (newXp >= newLevel * XP_PER_LEVEL) {
      newXp -= newLevel * XP_PER_LEVEL;
      newLevel += 1;
      leveledUp = true;
    }

    await user.update({ xp: newXp, level: newLevel });

    return res.json({
      xp: newXp,
      level: newLevel,
      xpToNext: newLevel * XP_PER_LEVEL,
      leveledUp,
    });
  } catch (err) {
    console.error('Error awarding XP:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;