// uploadRoutes.js
// Place in: GG/Backend/src/route/uploadRoutes.js
// Register in route/api.js:
//   import uploadRoutes from './uploadRoutes.js';
//   app.use('/api/upload', uploadRoutes);
//
// Also add this to server.js to serve uploaded files:
//   import { fileURLToPath } from 'url';
//   import path from 'path';
//   const __filename = fileURLToPath(import.meta.url);
//   const __dirname = path.dirname(__filename);
//   app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../models/index.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Uploads folder — one level up from src/route/
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config — stores files with unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Helper — delete old image file if it exists
const deleteOldImage = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(UPLOADS_DIR, path.basename(imagePath));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// ── POST /api/upload/profile
// Multipart form: field name = 'image', also needs userId in body
router.post('/profile', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { userId } = req.body;
    if (!userId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'userId is required.' });
    }

    const user = await db.UserAccount.findByPk(userId);
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete previous profile image if one exists
    deleteOldImage(user.profileImage);

    // Save relative path — frontend will prepend the base URL
    const imagePath = `/uploads/${req.file.filename}`;
    await user.update({ profileImage: imagePath });

    return res.status(200).json({ profileImage: imagePath });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error uploading profile image:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── DELETE /api/upload/profile
// Body: { userId }
// Removes profile image and resets to null
router.delete('/profile', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await db.UserAccount.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    deleteOldImage(user.profileImage);
    await user.update({ profileImage: null });

    return res.status(200).json({ message: 'Profile image removed.' });
  } catch (err) {
    console.error('Error removing profile image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/upload/team
// Multipart form: field name = 'image', also needs userId in body
// Only the team owner can upload
router.post('/team', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { userId } = req.body;
    if (!userId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'userId is required.' });
    }

    // Verify user is a team owner
    const membership = await db.TeamMember.findOne({
      where: { userId, role: 'owner' },
    });
    if (!membership) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Only the team owner can upload a team image.' });
    }

    const team = await db.Team.findByPk(membership.teamId);
    if (!team) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Delete previous team image if one exists
    deleteOldImage(team.teamImage);

    const imagePath = `/uploads/${req.file.filename}`;
    await team.update({ teamImage: imagePath });

    return res.status(200).json({ teamImage: imagePath });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error uploading team image:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── DELETE /api/upload/team
// Body: { userId }
// Owner only — removes team image
router.delete('/team', async (req, res) => {
  try {
    const { userId } = req.body;
    const membership = await db.TeamMember.findOne({ where: { userId, role: 'owner' } });
    if (!membership) return res.status(403).json({ error: 'Only the team owner can remove the team image.' });

    const team = await db.Team.findByPk(membership.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    deleteOldImage(team.teamImage);
    await team.update({ teamImage: null });

    return res.status(200).json({ message: 'Team image removed.' });
  } catch (err) {
    console.error('Error removing team image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
