import db from '../models/index.js';
import { Op } from 'sequelize';

const SEND_LIMIT = 1;
const WINDOW_MS = 8 * 60 * 60 * 1000; // 8-hour rolling window per sender→receiver pair
const LIMIT_ENABLED = true;

// ---------------------------------------------------------------------------
// Send a postcard
// Returns { data, errMessage } on success
// Returns { limitReached: true, resetsAt } if daily cap is hit
// Returns { forbidden: true } if sender/receiver are not matched partners
// ---------------------------------------------------------------------------
let handleSendPostcard = async (senderId, receiverId, { message, backgroundRef, stickerRefs, imageUrls, imagePlacement }) => {
  // 1. Verify friendship using a raw query — FriendsModel's DB table has no `id`
  //    column so Sequelize ORM queries (findOne) fail with "Unknown column 'id'".
  const [friendRows] = await db.sequelize.query(
    `SELECT 1 FROM FriendsModel
     WHERE ((user1_ID = :a AND user2_ID = :b) OR (user1_ID = :b AND user2_ID = :a))
       AND status = 'accepted'
     LIMIT 1`,
    { replacements: { a: senderId, b: receiverId } }
  );
  if (!friendRows || friendRows.length === 0) {
    return { forbidden: true };
  }

  // 2. Enforce send limit (currently disabled — set LIMIT_ENABLED = true to re-enable)
  if (LIMIT_ENABLED) {
    const windowStart = new Date(Date.now() - WINDOW_MS);
    const sentCount = await db.PostcardModel.count({
      where: {
        senderId,
        receiverId,
        sentAt: { [Op.gte]: windowStart },
      },
    });

    if (sentCount >= SEND_LIMIT) {
      const last = await db.PostcardModel.findOne({
        where: { senderId, receiverId, sentAt: { [Op.gte]: windowStart } },
        order: [['sentAt', 'DESC']],
      });
      const resetsAt = last
        ? new Date(new Date(last.sentAt).getTime() + WINDOW_MS)
        : null;
      return { limitReached: true, resetsAt };
    }
  }

  // 3. Create the postcard
  const now = new Date();
  const postcard = await db.PostcardModel.create({
    senderId,
    receiverId,
    message: message || null,
    backgroundRef: backgroundRef || 'cream',
    stickerRefs: Array.isArray(stickerRefs) ? stickerRefs : [],
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    imagePlacement: imagePlacement === 'background' ? 'background' : 'attachment',
    sentAt: now,
    readAt: null,
  });

  // 4. Upsert recent media for sender (background + each sticker)
  const mediaUpserts = [];
  if (backgroundRef) {
    mediaUpserts.push(
      db.PostcardRecentMediaModel.upsert({
        userId: senderId,
        assetType: 'background',
        assetRef: backgroundRef,
        lastUsedAt: now,
      })
    );
  }
  for (const ref of stickerRefs || []) {
    mediaUpserts.push(
      db.PostcardRecentMediaModel.upsert({
        userId: senderId,
        assetType: 'sticker',
        assetRef: ref,
        lastUsedAt: now,
      })
    );
  }
  await Promise.all(mediaUpserts);

  return { data: postcard, errMessage: 'Postcard sent!' };
};

// ---------------------------------------------------------------------------
// Fetch received postcards for a user, newest first
// ---------------------------------------------------------------------------
let handleGetReceived = async (userId) => {
  const postcards = await db.PostcardModel.findAll({
    where: { receiverId: userId },
    order: [['sentAt', 'DESC']],
  });
  return postcards;
};

// ---------------------------------------------------------------------------
// Fetch sent postcards for a user, newest first
// ---------------------------------------------------------------------------
let handleGetSent = async (userId) => {
  const postcards = await db.PostcardModel.findAll({
    where: { senderId: userId },
    order: [['sentAt', 'DESC']],
  });
  return postcards;
};

// ---------------------------------------------------------------------------
// Mark a postcard as read; only the intended receiver may do this
// ---------------------------------------------------------------------------
let handleMarkRead = async (postcardId, userId) => {
  const postcard = await db.PostcardModel.findByPk(postcardId);
  if (!postcard) return { notFound: true };
  if (String(postcard.receiverId) !== String(userId)) return { forbidden: true };
  if (!postcard.readAt) {
    postcard.readAt = new Date();
    await postcard.save();
  }
  return { data: postcard };
};

// ---------------------------------------------------------------------------
// Delete a postcard — only the receiver may delete from their inbox
// ---------------------------------------------------------------------------
let handleDeletePostcard = async (postcardId, userId) => {
  const postcard = await db.PostcardModel.findByPk(postcardId);
  if (!postcard) return { notFound: true };
  if (String(postcard.receiverId) !== String(userId)) return { forbidden: true };
  await postcard.destroy();
  return { deleted: true };
};

// ---------------------------------------------------------------------------
// Return how many postcards sender has sent to receiver in the last 24 h
// and when the window resets (null if under the limit)
// ---------------------------------------------------------------------------
let handleGetLimitStatus = async (senderId, receiverId) => {
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const sentInWindow = await db.PostcardModel.count({
    where: {
      senderId,
      receiverId,
      sentAt: { [Op.gte]: windowStart },
    },
  });

  let resetsAt = null;
  if (sentInWindow > 0) {
    const last = await db.PostcardModel.findOne({
      where: {
        senderId,
        receiverId,
        sentAt: { [Op.gte]: windowStart },
      },
      order: [['sentAt', 'DESC']],
    });
    if (last) resetsAt = new Date(new Date(last.sentAt).getTime() + WINDOW_MS);
  }

  return {
    sentToday: sentInWindow,
    limit: SEND_LIMIT,
    remaining: Math.max(0, SEND_LIMIT - sentInWindow),
    resetsAt,
  };
};

// ---------------------------------------------------------------------------
// Fetch recently used stickers/backgrounds for a user (most recent first)
// ---------------------------------------------------------------------------
let handleGetRecentMedia = async (userId) => {
  const rows = await db.PostcardRecentMediaModel.findAll({
    where: { userId },
    order: [['lastUsedAt', 'DESC']],
    limit: 20,
  });
  return rows;
};

const postcardService = {
  handleSendPostcard,
  handleGetReceived,
  handleGetSent,
  handleMarkRead,
  handleDeletePostcard,
  handleGetLimitStatus,
  handleGetRecentMedia,
};

export default postcardService;
