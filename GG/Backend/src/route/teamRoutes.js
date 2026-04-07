// Register in route/api.js with:
//   import teamRoutes from './teamRoutes.js';
//   app.use('/api/teams', teamRoutes);
 
import express from 'express';
import db from '../models/index.js';
 
const router = express.Router();
 
// Generate a random 6-character invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
 
// ── POST /api/teams/create
// Body: { userId, teamName, logo }
// Creates a new team and makes the user the owner
router.post('/create', async (req, res) => {
  try {
    const { userId, teamName, logo } = req.body;
    if (!userId || !teamName) {
      return res.status(400).json({ error: 'userId and teamName are required' });
    }
 
    // Check user isn't already in a team
    const existing = await db.TeamMember.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'You are already in a team. Leave your current team first.' });
    }
 
    // Check team name isn't taken
    const nameTaken = await db.Team.findOne({ where: { name: teamName } });
    if (nameTaken) {
      return res.status(400).json({ error: 'That team name is already taken.' });
    }
 
    const inviteCode = generateInviteCode();
    const team = await db.Team.create({
      name: teamName,
      logo: logo || '🏆',
      inviteCode,
      totalXP: 0,
      ownerID: userId,
    });
 
    await db.TeamMember.create({ teamId: team.id, userId, role: 'owner' });
 
    return res.status(201).json({ team, inviteCode });
  } catch (err) {
    console.error('Error creating team:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── POST /api/teams/join
// Body: { userId, inviteCode }
router.post('/join', async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;
    if (!userId || !inviteCode) {
      return res.status(400).json({ error: 'userId and inviteCode are required' });
    }
 
    const existing = await db.TeamMember.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'You are already in a team. Leave your current team first.' });
    }
 
    const team = await db.Team.findOne({ where: { inviteCode: inviteCode.toUpperCase() } });
    if (!team) {
      return res.status(404).json({ error: 'Invalid invite code.' });
    }
 
    await db.TeamMember.create({ teamId: team.id, userId, role: 'member' });
 
    return res.status(200).json({ team });
  } catch (err) {
    console.error('Error joining team:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── GET /api/teams/my-team/:userId
// Returns the team the user belongs to, with all members
router.get('/my-team/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
 
    const membership = await db.TeamMember.findOne({ where: { userId } });
    if (!membership) {
      return res.status(200).json({ team: null });
    }
 
    const team = await db.Team.findByPk(membership.teamId, {
      include: [{
        model: db.TeamMember,
        as: 'members',
        include: [{
          model: db.UserAccount,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'xp', 'level'],
        }],
      }],
    });
 
    return res.status(200).json({ team, myRole: membership.role });
  } catch (err) {
    console.error('Error fetching team:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── PUT /api/teams/update
// Body: { userId, teamName, logo }
// Owner only — edit team name and logo
router.put('/update', async (req, res) => {
  try {
    const { userId, teamName, logo } = req.body;
 
    const membership = await db.TeamMember.findOne({ where: { userId, role: 'owner' } });
    if (!membership) {
      return res.status(403).json({ error: 'Only the team owner can edit team details.' });
    }
 
    // Check new name isn't taken by another team
    if (teamName) {
      const nameTaken = await db.Team.findOne({
        where: { name: teamName },
      });
      if (nameTaken && nameTaken.id !== membership.teamId) {
        return res.status(400).json({ error: 'That team name is already taken.' });
      }
    }
 
    const updateFields = {};
    if (teamName) updateFields.name = teamName;
    if (logo)     updateFields.logo = logo;
 
    await db.Team.update(updateFields, { where: { id: membership.teamId } });
    const updated = await db.Team.findByPk(membership.teamId);
 
    return res.status(200).json({ team: updated });
  } catch (err) {
    console.error('Error updating team:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── DELETE /api/teams/kick
// Body: { ownerId, targetUserId }
// Owner only — kick a member
router.delete('/kick', async (req, res) => {
  try {
    const { ownerId, targetUserId } = req.body;
 
    const ownerMembership = await db.TeamMember.findOne({ where: { userId: ownerId, role: 'owner' } });
    if (!ownerMembership) {
      return res.status(403).json({ error: 'Only the team owner can kick members.' });
    }
    if (String(ownerId) === String(targetUserId)) {
      return res.status(400).json({ error: 'You cannot kick yourself. Use disband or leave instead.' });
    }
 
    await db.TeamMember.destroy({
      where: { userId: targetUserId, teamId: ownerMembership.teamId },
    });
 
    return res.status(200).json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Error kicking member:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── DELETE /api/teams/leave
// Body: { userId }
// Any member leaves the team
router.delete('/leave', async (req, res) => {
  try {
    const { userId } = req.body;
 
    const membership = await db.TeamMember.findOne({ where: { userId } });
    if (!membership) {
      return res.status(404).json({ error: 'You are not in a team.' });
    }
    if (membership.role === 'owner') {
      return res.status(400).json({ error: 'Owners cannot leave. Use disband to delete the team.' });
    }
 
    await membership.destroy();
    return res.status(200).json({ message: 'You have left the team.' });
  } catch (err) {
    console.error('Error leaving team:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── DELETE /api/teams/disband
// Body: { ownerId }
// Owner only — deletes the entire team
router.delete('/disband', async (req, res) => {
  try {
    const { ownerId } = req.body;
 
    const membership = await db.TeamMember.findOne({ where: { userId: ownerId, role: 'owner' } });
    if (!membership) {
      return res.status(403).json({ error: 'Only the team owner can disband the team.' });
    }
 
    await db.TeamMember.destroy({ where: { teamId: membership.teamId } });
    await db.Team.destroy({ where: { id: membership.teamId } });
 
    return res.status(200).json({ message: 'Team disbanded.' });
  } catch (err) {
    console.error('Error disbanding team:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── GET /api/teams/search?name=xxx
// Search for teams by name (for join by search)
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name query param required' });
 
    const { Op } = (await import('sequelize')).default ?? await import('sequelize');
    const teams = await db.Team.findAll({
      where: { name: { [Op.like]: `%${name}%` } },
      attributes: ['id', 'name', 'logo', 'totalXP', 'inviteCode'],
      limit: 10,
    });
    return res.status(200).json({ teams });
  } catch (err) {
    console.error('Error searching teams:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
// ── POST /api/teams/invite
// Body: { ownerId }
// Owner fetches invite code (legacy)
router.post('/invite', async (req, res) => {
  try {
    const { ownerId } = req.body;
    const membership = await db.TeamMember.findOne({ where: { userId: ownerId, role: 'owner' } });
    if (!membership) return res.status(403).json({ error: 'Only the team owner can send invites.' });
 
    const team = await db.Team.findByPk(membership.teamId, { attributes: ['name', 'inviteCode', 'logo'] });
    return res.status(200).json({ inviteCode: team.inviteCode, teamName: team.name });
  } catch (err) {
    console.error('Error fetching invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/teams/send-invite
// Body: { inviterId, inviteeId }
// Owner sends a direct invite to a friend — they will see a notification
router.post('/send-invite', async (req, res) => {
  try {
    const { inviterId, inviteeId } = req.body;
    if (!inviterId || !inviteeId) {
      return res.status(400).json({ error: 'inviterId and inviteeId are required' });
    }

    const membership = await db.TeamMember.findOne({ where: { userId: inviterId, role: 'owner' } });
    if (!membership) {
      return res.status(403).json({ error: 'Only the team owner can send invites.' });
    }

    const inviteeInTeam = await db.TeamMember.findOne({ where: { userId: inviteeId } });
    if (inviteeInTeam) {
      return res.status(400).json({ error: 'This friend is already in a team.' });
    }

    const [invite] = await db.TeamInvite.findOrCreate({
      where: { teamId: membership.teamId, inviteeId },
      defaults: { inviterId, inviteeId, status: 'pending' },
    });

    if (invite.status !== 'pending') {
      await invite.update({ status: 'pending' });
    }

    const team = await db.Team.findByPk(membership.teamId, { attributes: ['id', 'name', 'logo'] });
    return res.status(201).json({ invite, team });
  } catch (err) {
    console.error('Error sending team invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/teams/invites/:userId
// Get pending team invites for a user
router.get('/invites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const invites = await db.TeamInvite.findAll({
      where: { inviteeId: userId, status: 'pending' },
      include: [
        { model: db.Team, attributes: ['id', 'name', 'logo', 'totalXP'] },
        { model: db.UserAccount, as: 'inviter', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ invites });
  } catch (err) {
    console.error('Error fetching team invites:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/teams/invites/:inviteId/accept
// Body: { userId }
// Accept invite and join the team
router.post('/invites/:inviteId/accept', async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const invite = await db.TeamInvite.findByPk(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found.' });
    if (Number(invite.inviteeId) !== Number(userId)) {
      return res.status(403).json({ error: 'This invite is not for you.' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'This invite has already been responded to.' });
    }

    const existing = await db.TeamMember.findOne({ where: { userId } });
    if (existing) {
      await invite.update({ status: 'declined' });
      return res.status(400).json({ error: 'You are already in a team. Leave your current team first.' });
    }

    await db.TeamMember.create({ teamId: invite.teamId, userId, role: 'member' });
    await invite.update({ status: 'accepted' });

    const team = await db.Team.findByPk(invite.teamId, {
      include: [{
        model: db.TeamMember,
        as: 'members',
        include: [{ model: db.UserAccount, as: 'user', attributes: ['id', 'firstName', 'lastName', 'xp', 'level'] }],
      }],
    });
    return res.status(200).json({ team });
  } catch (err) {
    console.error('Error accepting team invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/teams/invites/:inviteId/decline
// Body: { userId }
router.post('/invites/:inviteId/decline', async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const invite = await db.TeamInvite.findByPk(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found.' });
    if (Number(invite.inviteeId) !== Number(userId)) {
      return res.status(403).json({ error: 'This invite is not for you.' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'This invite has already been responded to.' });
    }

    await invite.update({ status: 'declined' });
    return res.status(200).json({ message: 'Invite declined.' });
  } catch (err) {
    console.error('Error declining team invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
