import express from 'express';
import {
  syncBadgeDefinitions,
  checkAndAwardBadges,
  getUserBadges,
  getAllBadgesWithProgress,
} from '../Service/milestoneService.js';

const router = express.Router();

router.post('/sync', async (_req, res) => {
  try {
    await syncBadgeDefinitions();
    return res.status(200).json({ message: 'Badge definitions synced.' });
  } catch (err) {
    console.error('Error syncing badges:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const badges = await getUserBadges(req.params.userId);
    return res.status(200).json({ badges });
  } catch (err) {
    console.error('Error fetching user badges:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId/all', async (req, res) => {
  try {
    const badges = await getAllBadgesWithProgress(req.params.userId);
    return res.status(200).json({ badges });
  } catch (err) {
    console.error('Error fetching badge progress:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/user/:userId/check', async (req, res) => {
  try {
    const newBadges = await checkAndAwardBadges(req.params.userId);
    return res.status(200).json({ newBadges });
  } catch (err) {
    console.error('Error checking badges:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
