import express from 'express';
import db from '../models/index.js';
import {
  getTermMatchingRound,
  gradeTermMatching,
  getGrammarQuizRound,
  gradeGrammarQuiz,
  getPronunciationDrillRound,
} from '../Service/gameContentService.js';
import { incrementGameStat, checkAndAwardBadges } from '../Service/milestoneService.js';

const router = express.Router();
const XP_PER_LEVEL = 500;
const CHALLENGE_ACTIVE_STATUSES = ['accepted', 'in_progress'];

const activeSessions = new Map();

function storeSession(userId, gameType, data) {
  activeSessions.set(`${userId}:${gameType}`, { ...data, startedAt: Date.now() });
}

function getSession(userId, gameType) {
  return activeSessions.get(`${userId}:${gameType}`) || null;
}

function clearSession(userId, gameType) {
  activeSessions.delete(`${userId}:${gameType}`);
}

async function awardXp(userId, xpAmount) {
  const user = await db.UserAccount.findByPk(userId);
  if (!user) return null;

  let newXp = user.xp + xpAmount;
  let newLevel = user.level;
  let leveledUp = false;

  while (newXp >= newLevel * XP_PER_LEVEL) {
    newXp -= newLevel * XP_PER_LEVEL;
    newLevel++;
    leveledUp = true;
  }

  await user.update({ xp: newXp, level: newLevel });
  return { xp: newXp, level: newLevel, xpToNext: newLevel * XP_PER_LEVEL, leveledUp };
}

async function incrementQuests(userId, gameType) {
  try {
    if (!db.Quest || !db.UserQuestProgress) return [];
    const { Op } = await import('sequelize');
    const quests = await db.Quest.findAll({
      where: {
        isActive: true,
        type: 'individual',
        gameType: { [Op.or]: [gameType, null] },
      },
    });

    const updated = [];
    for (const quest of quests) {
      const [progress] = await db.UserQuestProgress.findOrCreate({
        where: { userId, questId: quest.id },
        defaults: { progress: 0, completed: false, lastResetAt: new Date() },
      });

      if (progress.completed && quest.resetType === 'permanent') continue;

      const newProgress = progress.progress + 1;
      const nowComplete = newProgress >= quest.goal;

      await progress.update({
        progress: newProgress,
        completed: nowComplete,
        completedAt: nowComplete && !progress.completed ? new Date() : progress.completedAt,
      });

      if (nowComplete && !progress.completed) {
        await awardXp(userId, quest.xpReward);
      }

      updated.push({ questId: quest.id, progress: newProgress, completed: nowComplete });
    }

    return updated;
  } catch (err) {
    console.warn('incrementQuests failed (non-fatal):', err.message);
    return [];
  }
}

async function incrementTeamQuests(userId, gameType) {
  try {
    if (!db.Quest || !db.TeamQuestProgress || !db.TeamMember) return [];
    const membership = await db.TeamMember.findOne({ where: { userId } });
    if (!membership) return [];

    const teamId = membership.teamId;
    const { Op } = await import('sequelize');
    const quests = await db.Quest.findAll({
      where: {
        isActive: true,
        type: 'team',
        gameType: { [Op.or]: [gameType, null] },
      },
    });

    const updated = [];
    for (const quest of quests) {
      let [progress] = await db.TeamQuestProgress.findOrCreate({
        where: { teamId, questId: quest.id },
        defaults: { progress: 0, completed: false, lastResetAt: new Date() },
      });

      if (progress.completed && quest.resetType === 'permanent') continue;

      const shouldReset = (p, resetType) => {
        if (resetType === 'permanent' || !p.lastResetAt) return false;
        const now = new Date();
        const last = new Date(p.lastResetAt);
        if (resetType === 'daily') return now.toDateString() !== last.toDateString();
        if (resetType === 'weekly') return (now - last) >= 7 * 24 * 60 * 60 * 1000;
        return false;
      };
      if (shouldReset(progress, quest.resetType)) {
        await progress.update({ progress: 0, completed: false, lastResetAt: new Date() });
      }

      const newProgress = progress.progress + 1;
      const nowComplete = newProgress >= quest.goal;

      await progress.update({
        progress: newProgress,
        completed: nowComplete,
        completedAt: nowComplete && !progress.completed ? new Date() : progress.completedAt,
      });

      if (nowComplete && !progress.completed) {
        await db.Team.increment('totalXP', { by: quest.xpReward, where: { id: teamId } });
      }

      updated.push({ questId: quest.id, progress: newProgress, completed: nowComplete });
    }

    return updated;
  } catch (err) {
    console.warn('incrementTeamQuests failed (non-fatal):', err.message);
    return [];
  }
}

async function resolveChallengeForSession(userId, gameType, explicitChallengeId = null) {
  if (!db.Challenge) return null;
  const { Op } = db.Sequelize;

  // If the client provided a challengeId, validate ownership/game/status.
  if (explicitChallengeId) {
    const challenge = await db.Challenge.findByPk(explicitChallengeId);
    if (!challenge) return null;

    const belongsToUser = Number(challenge.challengerId) === Number(userId)
      || Number(challenge.challengedId) === Number(userId);
    const validGame = challenge.gameType === gameType;
    const validStatus = CHALLENGE_ACTIVE_STATUSES.includes(challenge.status);

    if (!belongsToUser || !validGame || !validStatus) return null;
    return challenge.id;
  }

  // Backward-compatible fallback:
  // if no challengeId is sent, bind to the user's latest active challenge
  // for this game where the user still has no recorded score.
  const challenge = await db.Challenge.findOne({
    where: {
      gameType,
      status: { [Op.in]: CHALLENGE_ACTIVE_STATUSES },
      [Op.or]: [
        { challengerId: userId, challengerScore: null },
        { challengedId: userId, challengedScore: null },
      ],
    },
    order: [['updatedAt', 'DESC']],
  });

  if (!challenge) return null;
  return challenge.id;
}

async function updateChallengeFromGameResult(userId, challengeId, score) {
  if (!db.Challenge || !challengeId || score === undefined || score === null) return;

  await db.sequelize.transaction(async (transaction) => {
    const challenge = await db.Challenge.findByPk(challengeId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!challenge) return;

    if (['completed', 'declined', 'expired'].includes(challenge.status)) return;

    const updates = {};
    if (Number(challenge.challengerId) === Number(userId) && challenge.challengerScore === null) {
      updates.challengerScore = score;
    }
    if (Number(challenge.challengedId) === Number(userId) && challenge.challengedScore === null) {
      updates.challengedScore = score;
    }

    // If no score was applied, user is not part of challenge or has already submitted.
    if (Object.keys(updates).length === 0) return;

    if (challenge.status === 'accepted') {
      updates.status = 'in_progress';
    }

    const nextChallengerScore = updates.challengerScore ?? challenge.challengerScore;
    const nextChallengedScore = updates.challengedScore ?? challenge.challengedScore;

    if (nextChallengerScore !== null && nextChallengedScore !== null) {
      let winnerId = null;
      if (nextChallengerScore > nextChallengedScore) winnerId = challenge.challengerId;
      else if (nextChallengedScore > nextChallengerScore) winnerId = challenge.challengedId;

      updates.status = 'completed';
      updates.winnerId = winnerId;
      updates.completedAt = new Date();
    }

    await challenge.update(updates, { transaction });
  });
}

async function saveGameSession(userId, gameType, difficulty, result, challengeId = null) {
  try {
    const resolvedChallengeId = await resolveChallengeForSession(userId, gameType, challengeId);

    if (db.GameSession) {
      await db.GameSession.create({
        userId,
        gameType,
        difficulty,
        score: result.score,
        correct: result.correct || null,
        total: result.total || null,
        xpEarned: result.xpEarned || 0,
        status: 'completed',
        challengeId: resolvedChallengeId,
        completedAt: new Date(),
      });
    }

    await updateChallengeFromGameResult(userId, resolvedChallengeId, result.score);
  } catch (err) {
    console.error('Failed to persist game session (non-fatal):', err.message);
  }
}

// GET /api/games/sessions/:userId — game history
router.get('/sessions/:userId', async (req, res) => {
  try {
    if (!db.GameSession) return res.status(200).json({ sessions: [] });

    const sessions = await db.GameSession.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('Error fetching game sessions:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Term Matching ───

router.post('/term-matching/start', async (req, res) => {
  try {
    const { userId, difficulty = 'Beginner', count = 6, challengeId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const resolvedChallengeId = await resolveChallengeForSession(userId, 'term-matching', challengeId);
    const round = getTermMatchingRound(difficulty, count);
    storeSession(userId, 'term-matching', { pairs: round.pairs, difficulty, challengeId: resolvedChallengeId });

    return res.status(200).json({
      pairs: round.pairs.map(p => ({ id: p.id, korean: p.korean, english: p.english })),
      englishOptions: round.shuffledEnglish,
      challengeId: resolvedChallengeId,
    });
  } catch (err) {
    console.error('Error starting term matching:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/term-matching/submit', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) return res.status(400).json({ error: 'userId and answers are required' });

    const session = getSession(userId, 'term-matching');
    if (!session) return res.status(400).json({ error: 'No active term matching session. Call /start first.' });

    const result = gradeTermMatching(session.pairs, answers);
    clearSession(userId, 'term-matching');

    const xpEarned = Math.round(result.score * 0.5);

    await incrementGameStat(userId, 'term_matching_played');
    if (result.score === 100) await incrementGameStat(userId, 'perfect_score');

    const xpResult = await awardXp(userId, xpEarned);
    const [questUpdates, teamQuestUpdates] = await Promise.all([
      incrementQuests(userId, 'term-matching'),
      incrementTeamQuests(userId, 'term-matching'),
    ]);
    const newBadges = await checkAndAwardBadges(userId);

    await saveGameSession(userId, 'term-matching', session.difficulty, { ...result, xpEarned }, session.challengeId);

    return res.status(200).json({
      ...result,
      correctPairs: session.pairs,
      xpEarned,
      xp: xpResult,
      questUpdates,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting term matching:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Grammar Quiz ───

router.post('/grammar-quiz/start', async (req, res) => {
  try {
    const { userId, difficulty = 'Beginner', count = 5, challengeId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const resolvedChallengeId = await resolveChallengeForSession(userId, 'grammar-quiz', challengeId);
    const questions = getGrammarQuizRound(difficulty, count);
    storeSession(userId, 'grammar-quiz', { questions, difficulty, challengeId: resolvedChallengeId });

    return res.status(200).json({ questions, challengeId: resolvedChallengeId });
  } catch (err) {
    console.error('Error starting grammar quiz:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/grammar-quiz/submit', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    if (!userId || !answers) return res.status(400).json({ error: 'userId and answers are required' });

    const session = getSession(userId, 'grammar-quiz');
    if (!session) return res.status(400).json({ error: 'No active grammar quiz session. Call /start first.' });

    const result = gradeGrammarQuiz(session.difficulty, session.questions, answers);
    clearSession(userId, 'grammar-quiz');

    const xpEarned = Math.round(result.score * 0.5);

    await incrementGameStat(userId, 'grammar_quiz_played');
    if (result.score === 100) await incrementGameStat(userId, 'perfect_score');

    const xpResult = await awardXp(userId, xpEarned);
    const [questUpdates, teamQuestUpdates] = await Promise.all([
      incrementQuests(userId, 'grammar-quiz'),
      incrementTeamQuests(userId, 'grammar-quiz'),
    ]);
    const newBadges = await checkAndAwardBadges(userId);

    await saveGameSession(userId, 'grammar-quiz', session.difficulty, { ...result, xpEarned }, session.challengeId);

    return res.status(200).json({
      ...result,
      xpEarned,
      xp: xpResult,
      questUpdates,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting grammar quiz:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Pronunciation Drill ───

router.post('/pronunciation-drill/start', async (req, res) => {
  try {
    const { userId, difficulty = 'Beginner', count = 5, challengeId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const resolvedChallengeId = await resolveChallengeForSession(userId, 'pronunciation-drill', challengeId);
    const phrases = getPronunciationDrillRound(difficulty, count);
    storeSession(userId, 'pronunciation-drill', { phrases, difficulty, challengeId: resolvedChallengeId });

    return res.status(200).json({ phrases, challengeId: resolvedChallengeId });
  } catch (err) {
    console.error('Error starting pronunciation drill:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pronunciation-drill/submit', async (req, res) => {
  try {
    const { userId, completedCount } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const session = getSession(userId, 'pronunciation-drill');
    if (!session) return res.status(400).json({ error: 'No active pronunciation drill session. Call /start first.' });

    const total = session.phrases.length;
    const completed = Math.min(completedCount || total, total);
    const score = Math.round((completed / total) * 100);
    clearSession(userId, 'pronunciation-drill');

    const xpEarned = Math.round(score * 0.4);

    await incrementGameStat(userId, 'pronunciation_played');
    if (score === 100) await incrementGameStat(userId, 'perfect_score');

    const xpResult = await awardXp(userId, xpEarned);
    const [questUpdates, teamQuestUpdates] = await Promise.all([
      incrementQuests(userId, 'pronunciation-drill'),
      incrementTeamQuests(userId, 'pronunciation-drill'),
    ]);
    const newBadges = await checkAndAwardBadges(userId);

    await saveGameSession(userId, 'pronunciation-drill', session.difficulty, { score, correct: completed, total, xpEarned }, session.challengeId);

    return res.status(200).json({
      completed,
      total,
      score,
      xpEarned,
      xp: xpResult,
      questUpdates,
      newBadges,
    });
  } catch (err) {
    console.error('Error submitting pronunciation drill:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
