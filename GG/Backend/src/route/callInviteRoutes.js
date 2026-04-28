import express from 'express';
import { Op } from 'sequelize';
import db from '../models/index.js';

const router = express.Router();

// Ringing invites older than this become "missed" so the callee never sees a stale ring.
const RING_TIMEOUT_MS = 45 * 1000;

async function expireStaleInvites() {
  const cutoff = new Date(Date.now() - RING_TIMEOUT_MS);
  await db.VideoCallInvite.update(
    { status: 'missed', respondedAt: new Date() },
    { where: { status: 'ringing', createdAt: { [Op.lt]: cutoff } } }
  );
}

// POST /api/v1/call-invite — body { callerId, calleeId, channelId }
router.post('/', async (req, res) => {
  try {
    const callerId = Number(req.body.callerId);
    const calleeId = Number(req.body.calleeId);
    const channelId = String(req.body.channelId || '').trim();
    if (!callerId || !calleeId || !channelId) {
      return res.status(400).json({ error: 'callerId, calleeId, channelId required' });
    }
    if (callerId === calleeId) {
      return res.status(400).json({ error: 'Cannot call yourself' });
    }
    // Cancel any prior ringing invites from caller in same channel.
    await db.VideoCallInvite.update(
      { status: 'cancelled', respondedAt: new Date() },
      { where: { callerId, channelId, status: 'ringing' } }
    );
    const invite = await db.VideoCallInvite.create({ callerId, calleeId, channelId });
    return res.status(201).json({ invite });
  } catch (err) {
    console.error('Error creating call invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/call-invite/incoming/:userId
router.get('/incoming/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await expireStaleInvites();
    const invite = await db.VideoCallInvite.findOne({
      where: { calleeId: userId, status: 'ringing' },
      order: [['createdAt', 'DESC']],
      include: [{ model: db.UserAccount, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'profileImage'] }],
    });
    return res.status(200).json({ invite: invite || null });
  } catch (err) {
    console.error('Error fetching incoming invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/call-invite/:id/accept — body { userId }
router.post('/:id/accept', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.body.userId);
    const invite = await db.VideoCallInvite.findByPk(id);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.calleeId !== userId) return res.status(403).json({ error: 'Not for this user' });
    if (invite.status !== 'ringing') return res.status(400).json({ error: `Invite is ${invite.status}` });
    invite.status = 'accepted';
    invite.respondedAt = new Date();
    await invite.save();
    return res.status(200).json({ invite });
  } catch (err) {
    console.error('Error accepting invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/call-invite/:id/decline — body { userId }
router.post('/:id/decline', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.body.userId);
    const invite = await db.VideoCallInvite.findByPk(id);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.calleeId !== userId) return res.status(403).json({ error: 'Not for this user' });
    if (invite.status !== 'ringing') return res.status(200).json({ invite });
    invite.status = 'declined';
    invite.respondedAt = new Date();
    await invite.save();
    return res.status(200).json({ invite });
  } catch (err) {
    console.error('Error declining invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/call-invite/:id/cancel — body { userId }
router.post('/:id/cancel', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.body.userId);
    const invite = await db.VideoCallInvite.findByPk(id);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.callerId !== userId) return res.status(403).json({ error: 'Not for this user' });
    if (invite.status === 'ringing') {
      invite.status = 'cancelled';
      invite.respondedAt = new Date();
      await invite.save();
    }
    return res.status(200).json({ invite });
  } catch (err) {
    console.error('Error cancelling invite:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
