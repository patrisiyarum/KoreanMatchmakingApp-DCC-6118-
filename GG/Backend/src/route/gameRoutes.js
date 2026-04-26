import express from 'express';
import db from '../models/index.js';
import { XP_PER_LEVEL } from '../Service/gameConfig.js';
import { checkAndAwardBadges } from '../Service/milestoneService.js';
 
const router = express.Router();
 
// GET /api/games/user-stats/:userId
router.get('/user-stats/:userId', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const UserAccount = db.UserAccount;
    const user = await UserAccount.findByPk(req.params.userId, {
      attributes: ['id', 'email', 'firstName', 'xp', 'level', 'profileImage', 'gameStats'],
    });
 
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    const xpToNext = user.level * XP_PER_LEVEL;
 
    let gameActivity = null;
    if (user.gameStats) {
      try {
        const stats = typeof user.gameStats === 'string' ? JSON.parse(user.gameStats) : user.gameStats;
        const term = stats.term_matching_played || 0;
        const grammar = stats.grammar_quiz_played || 0;
        const pron = stats.pronunciation_played || 0;
        gameActivity = {
          gamesPlayed: stats.games_played ?? term + grammar + pron,
          termMatching: term,
          grammarQuiz: grammar,
          pronunciation: pron,
          perfectRounds: stats.perfect_score || 0,
        };
      } catch {
        gameActivity = null;
      }
    }
 
    return res.json({
      id: user.id,
      username: user.firstName,
      xp: user.xp,
      level: user.level,
      xpToNext,
      profileImage: user.profileImage || null,
      gameActivity,
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
 
// POST /api/games/submit
// Body: { userId, gameType, score, totalQuestions }
// gameType: 'term-matching' | 'grammar-quiz' | 'pronunciation-drill'
router.post('/submit', async (req, res) => {
  try {
    const { userId, gameType, score, totalQuestions } = req.body;
 
    if (!userId || !gameType || score == null || !totalQuestions) {
      return res.status(400).json({ errorCode: 1, message: 'Missing required fields.' });
    }
 
    const UserAccount = db.UserAccount;
    const user = await UserAccount.findByPk(userId);
    if (!user) {
      return res.status(404).json({ errorCode: 1, message: 'User not found.' });
    }
 
    // ── 1. Calculate XP ───────────────────────────────────────────────────
    const isPerfect = score === totalQuestions;
    const xpAwarded = 10 + (score * 10) + (isPerfect ? 15 : 0);
 
    // ── 2. Apply XP and handle level-ups ──────────────────────────────────
    let newXp = (user.xp || 0) + xpAwarded;
    let newLevel = user.level || 1;
    let leveledUp = false;
 
    while (newXp >= newLevel * XP_PER_LEVEL) {
      newXp -= newLevel * XP_PER_LEVEL;
      newLevel += 1;
      leveledUp = true;
    }
 
    // ── 3. Update gameStats JSON column ───────────────────────────────────
    let stats = {};
    if (user.gameStats) {
      try {
        stats = typeof user.gameStats === 'string'
          ? JSON.parse(user.gameStats)
          : { ...user.gameStats };
      } catch {
        stats = {};
      }
    }
 
    stats.games_played = (stats.games_played || 0) + 1;
    if (isPerfect) stats.perfect_score = (stats.perfect_score || 0) + 1;
 
    if (gameType === 'term-matching') {
      stats.term_matching_played = (stats.term_matching_played || 0) + 1;
    } else if (gameType === 'grammar-quiz') {
      stats.grammar_quiz_played = (stats.grammar_quiz_played || 0) + 1;
    } else if (gameType === 'pronunciation-drill') {
      stats.pronunciation_played = (stats.pronunciation_played || 0) + 1;
    }
 
    // ── 4. Persist XP, level, and stats in one update ─────────────────────
    await user.update({
      xp: newXp,
      level: newLevel,
      gameStats: JSON.stringify(stats),
    });
 
    // ── 5. Check for newly earned badges (non-fatal) ──────────────────────
    let newBadges = [];
    try {
      newBadges = await checkAndAwardBadges(userId);
    } catch (badgeErr) {
      console.error('Badge check failed (non-fatal):', badgeErr);
    }
 
    return res.json({
      errorCode: 0,
      xpAwarded,
      totalXp: newXp,
      level: newLevel,
      xpToNext: newLevel * XP_PER_LEVEL,
      leveledUp,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting game result:', err);
    return res.status(500).json({ errorCode: 1, message: 'Internal server error.' });
  }
});
 
export default router;