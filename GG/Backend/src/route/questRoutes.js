// questRoutes.js
// Place in: GG/Backend/src/route/questRoutes.js
// Register in route/api.js:
//   import questRoutes from './questRoutes.js';
//   app.use('/api/quests', questRoutes);

import express from 'express';
import db from '../models/index.js';

const router = express.Router();

const TEAM_BATTLE_QUEST_TEMPLATES = [
  {
    title: 'Vocabulary Sprint',
    description: 'Complete 8 vocabulary rounds before the other team.',
    type: 'team',
    gameType: 'term-matching',
    goal: 8,
    xpReward: 120,
    resetType: 'weekly',
  },
  {
    title: 'Grammar Clash',
    description: 'Finish 6 grammar rounds and beat the other team score.',
    type: 'team',
    gameType: 'grammar-quiz',
    goal: 6,
    xpReward: 120,
    resetType: 'weekly',
  },
  {
    title: 'Pronunciation Relay',
    description: 'Complete 6 pronunciation drills as a team.',
    type: 'team',
    gameType: 'pronunciation-drill',
    goal: 6,
    xpReward: 120,
    resetType: 'weekly',
  },
];

async function ensureTeamBattleQuests() {
  for (const template of TEAM_BATTLE_QUEST_TEMPLATES) {
    await db.Quest.findOrCreate({
      where: { title: template.title, type: 'team' },
      defaults: { ...template, isActive: true },
    });
  }
}

// ── Helper: check and handle daily/weekly resets ──
const shouldReset = (progress, resetType) => {
  if (resetType === 'permanent' || !progress.lastResetAt) return false;
  const now = new Date();
  const last = new Date(progress.lastResetAt);
  if (resetType === 'daily') {
    return now.toDateString() !== last.toDateString();
  }
  if (resetType === 'weekly') {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return (now - last) >= msPerWeek;
  }
  return false;
};

// ─────────────────────────────────────────────
// QUEST CRUD (admin-style — add/edit/remove quests)
// ─────────────────────────────────────────────

// GET /api/quests
// Returns all active quests, optionally filtered by type or gameType
// Query params: ?type=individual|team  &gameType=term-matching  &includeInactive=true
router.get('/', async (req, res) => {
  try {
    const { type, gameType, includeInactive } = req.query;
    const where = {};
    if (!includeInactive) where.isActive = true;
    if (type)     where.type     = type;
    if (gameType) where.gameType = gameType;

    const quests = await db.Quest.findAll({ where });
    return res.status(200).json({ quests });
  } catch (err) {
    console.error('Error fetching quests:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quests
// Create a new quest
// Body: { title, description, type, gameType, goal, xpReward, resetType }
router.post('/', async (req, res) => {
  try {
    const { title, description, type, gameType, goal, xpReward, resetType } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }
    const quest = await db.Quest.create({
      title,
      description,
      type:      type      || 'individual',
      gameType:  gameType  || null,
      goal:      goal      || 1,
      xpReward:  xpReward  || 50,
      resetType: resetType || 'permanent',
      isActive:  true,
    });
    return res.status(201).json({ quest });
  } catch (err) {
    console.error('Error creating quest:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/quests/:id
// Update a quest's details
router.put('/:id', async (req, res) => {
  try {
    const quest = await db.Quest.findByPk(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    await quest.update(req.body);
    return res.status(200).json({ quest });
  } catch (err) {
    console.error('Error updating quest:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quests/:id
// Soft delete — sets isActive to false instead of removing the row
// This preserves existing progress records
router.delete('/:id', async (req, res) => {
  try {
    const quest = await db.Quest.findByPk(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    await quest.update({ isActive: false });
    return res.status(200).json({ message: 'Quest deactivated.' });
  } catch (err) {
    console.error('Error deactivating quest:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// INDIVIDUAL QUEST PROGRESS
// ─────────────────────────────────────────────

// GET /api/quests/user/:userId
// Returns all active quests with this user's progress attached
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const quests = await db.Quest.findAll({
      where: { isActive: true, type: 'individual' },
    });

    const results = await Promise.all(quests.map(async (quest) => {
      let progress = await db.UserQuestProgress.findOne({
        where: { userId, questId: quest.id },
      });

      // Create progress row if it doesn't exist yet
      if (!progress) {
        progress = await db.UserQuestProgress.create({
          userId,
          questId: quest.id,
          progress: 0,
          completed: false,
          lastResetAt: new Date(),
        });
      }

      // Handle resets for daily/weekly quests
      if (shouldReset(progress, quest.resetType)) {
        await progress.update({
          progress: 0,
          completed: false,
          lastResetAt: new Date(),
        });
      }

      return {
        ...quest.toJSON(),
        userProgress: progress.progress,
        completed: progress.completed,
        completedAt: progress.completedAt,
      };
    }));

    return res.status(200).json({ quests: results });
  } catch (err) {
    console.error('Error fetching user quests:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quests/user/increment
// Called by a game when a relevant action is completed
// Body: { userId, gameType }
// Finds all matching active quests and increments progress
router.post('/user/increment', async (req, res) => {
  try {
    const { userId, gameType } = req.body;
    if (!userId || !gameType) {
      return res.status(400).json({ error: 'userId and gameType are required' });
    }

    // Find all individual quests matching this game type (or null = any game)
    const { Op } = (await import('sequelize'));
    const quests = await db.Quest.findAll({
      where: {
        isActive: true,
        type: 'individual',
        gameType: { [Op.or]: [gameType, null] },
      },
    });

    const updated = [];
    for (const quest of quests) {
      let [progress] = await db.UserQuestProgress.findOrCreate({
        where: { userId, questId: quest.id },
        defaults: { progress: 0, completed: false, lastResetAt: new Date() },
      });

      // Skip if already completed (for permanent quests)
      if (progress.completed && quest.resetType === 'permanent') continue;

      // Handle reset if needed
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

      // Award XP if just completed
      if (nowComplete && !progress.completed) {
        const user = await db.UserAccount.findByPk(userId);
        if (user) {
          let newXp    = user.xp + quest.xpReward;
          let newLevel = user.level;
          while (newXp >= newLevel * 500) { newXp -= newLevel * 500; newLevel++; }
          await user.update({ xp: newXp, level: newLevel });
        }
      }

      updated.push({ questId: quest.id, progress: newProgress, completed: nowComplete });
    }

    return res.status(200).json({ updated });
  } catch (err) {
    console.error('Error incrementing user quest progress:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// TEAM QUEST PROGRESS
// ─────────────────────────────────────────────

// GET /api/quests/team/:teamId
// Returns all active team quests with this team's progress
router.get('/team/:teamId', async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Verify team exists before creating progress records (avoids FK constraint error)
    const team = await db.Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const quests = await db.Quest.findAll({
      where: { isActive: true, type: 'team' },
    });

    const results = await Promise.all(quests.map(async (quest) => {
      let progress = await db.TeamQuestProgress.findOne({
        where: { teamId, questId: quest.id },
      });

      if (!progress) {
        progress = await db.TeamQuestProgress.create({
          teamId,
          questId: quest.id,
          progress: 0,
          completed: false,
          lastResetAt: new Date(),
        });
      }

      if (shouldReset(progress, quest.resetType)) {
        await progress.update({ progress: 0, completed: false, lastResetAt: new Date() });
      }

      return {
        ...quest.toJSON(),
        teamProgress: progress.progress,
        completed: progress.completed,
        completedAt: progress.completedAt,
      };
    }));

    return res.status(200).json({ quests: results });
  } catch (err) {
    console.error('Error fetching team quests:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quests/team-vs/:teamId/:opponentTeamId
// Returns a head-to-head quest board for two teams.
router.get('/team-vs/:teamId/:opponentTeamId', async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const opponentTeamId = Number(req.params.opponentTeamId);
    if (!teamId || Number.isNaN(teamId) || !opponentTeamId || Number.isNaN(opponentTeamId)) {
      return res.status(400).json({ error: 'Invalid team IDs' });
    }
    if (teamId === opponentTeamId) {
      return res.status(400).json({ error: 'Team IDs must be different' });
    }

    const [team, opponentTeam] = await Promise.all([
      db.Team.findByPk(teamId, { attributes: ['id', 'name', 'totalXP'] }),
      db.Team.findByPk(opponentTeamId, { attributes: ['id', 'name', 'totalXP'] }),
    ]);
    if (!team || !opponentTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await ensureTeamBattleQuests();
    const quests = await db.Quest.findAll({
      where: { isActive: true, type: 'team' },
      order: [['id', 'ASC']],
    });

    const board = await Promise.all(
      quests.map(async (quest) => {
        const [myProgress] = await db.TeamQuestProgress.findOrCreate({
          where: { teamId, questId: quest.id },
          defaults: { progress: 0, completed: false, lastResetAt: new Date() },
        });
        const [opponentProgress] = await db.TeamQuestProgress.findOrCreate({
          where: { teamId: opponentTeamId, questId: quest.id },
          defaults: { progress: 0, completed: false, lastResetAt: new Date() },
        });

        if (shouldReset(myProgress, quest.resetType)) {
          await myProgress.update({ progress: 0, completed: false, completedAt: null, lastResetAt: new Date() });
        }
        if (shouldReset(opponentProgress, quest.resetType)) {
          await opponentProgress.update({ progress: 0, completed: false, completedAt: null, lastResetAt: new Date() });
        }

        const myPct = Math.min(100, Math.round(((myProgress.progress || 0) / Math.max(1, quest.goal || 1)) * 100));
        const opponentPct = Math.min(100, Math.round(((opponentProgress.progress || 0) / Math.max(1, quest.goal || 1)) * 100));

        let leader = 'tied';
        if (myProgress.completed && opponentProgress.completed) {
          leader = new Date(myProgress.completedAt) <= new Date(opponentProgress.completedAt) ? 'team' : 'opponent';
        } else if (myProgress.completed) {
          leader = 'team';
        } else if (opponentProgress.completed) {
          leader = 'opponent';
        } else if (myProgress.progress > opponentProgress.progress) {
          leader = 'team';
        } else if (opponentProgress.progress > myProgress.progress) {
          leader = 'opponent';
        }

        return {
          questId: quest.id,
          title: quest.title,
          description: quest.description,
          gameType: quest.gameType,
          goal: quest.goal,
          xpReward: quest.xpReward,
          team: {
            progress: myProgress.progress,
            completed: myProgress.completed,
            completedAt: myProgress.completedAt,
            percent: myPct,
          },
          opponent: {
            progress: opponentProgress.progress,
            completed: opponentProgress.completed,
            completedAt: opponentProgress.completedAt,
            percent: opponentPct,
          },
          leader,
        };
      })
    );

    return res.status(200).json({
      team,
      opponentTeam,
      scoring: {
        finishPriority: 'First completion wins tie-breakers',
        scorePriority: 'Higher progress wins when unfinished',
      },
      quests: board,
    });
  } catch (err) {
    console.error('Error fetching team-vs quests:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quests/team/increment
// Called by a game when a team member completes a relevant action
// Body: { userId, gameType }
// Finds the user's team and increments matching team quest progress
router.post('/team/increment', async (req, res) => {
  try {
    const { userId, gameType } = req.body;
    if (!userId || !gameType) {
      return res.status(400).json({ error: 'userId and gameType are required' });
    }

    // Find user's team
    const membership = await db.TeamMember.findOne({ where: { userId } });
    if (!membership) return res.status(200).json({ updated: [] }); // not in a team, skip silently

    const teamId = membership.teamId;
    const { Op } = (await import('sequelize'));
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

      // Award XP to the whole team (add to totalXP) when completed
      if (nowComplete && !progress.completed) {
        await db.Team.increment('totalXP', {
          by: quest.xpReward,
          where: { id: teamId },
        });
      }

      updated.push({ questId: quest.id, progress: newProgress, completed: nowComplete });
    }

    return res.status(200).json({ updated });
  } catch (err) {
    console.error('Error incrementing team quest progress:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
