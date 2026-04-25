import postcardService from '../Service/postcardService.js';

const MAX_MESSAGE_LENGTH = 200;
const MAX_STICKERS = 5;

// POST /api/v1/postcards
let sendPostcard = async (req, res) => {
  try {
    const { senderId, receiverId, message, backgroundRef, stickerRefs, imageUrls, imagePlacement } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'senderId and receiverId are required' });
    }
    if (Number(senderId) === Number(receiverId)) {
      return res.status(400).json({ message: 'Cannot send a postcard to yourself' });
    }

    // Message length constraint
    if (message && message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
      });
    }

    // Sticker count constraint
    if (Array.isArray(stickerRefs) && stickerRefs.length > MAX_STICKERS) {
      return res.status(400).json({
        message: `A postcard may contain at most ${MAX_STICKERS} stickers`,
      });
    }

    // Image constraints
    const imgs = Array.isArray(imageUrls) ? imageUrls : [];
    if (imagePlacement === 'background' && imgs.length > 1) {
      return res.status(400).json({ message: 'Background placement supports at most 1 image' });
    }
    if (imgs.length > 4) {
      return res.status(400).json({ message: 'Maximum 4 images per postcard' });
    }

    const result = await postcardService.handleSendPostcard(
      Number(senderId),
      Number(receiverId),
      {
        message: message || '',
        backgroundRef: backgroundRef || 'cream',
        stickerRefs: Array.isArray(stickerRefs) ? stickerRefs : [],
        imageUrls: imgs,
        imagePlacement: imagePlacement || 'attachment',
      }
    );

    if (result.forbidden) {
      return res.status(403).json({
        message: 'You can only send postcards to your matched partners',
      });
    }

    if (result.limitReached) {
      return res.status(429).json({
        message: 'You can only send 1 postcard per partner every 12 hours',
        resetsAt: result.resetsAt,
      });
    }

    return res.status(201).json({
      message: result.errMessage,
      postcardData: result.data,
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// GET /api/v1/postcards/received/:userId
let getReceived = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'Invalid userId' });

    const postcards = await postcardService.handleGetReceived(userId);
    return res.status(200).json({ postcards });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// GET /api/v1/postcards/sent/:userId
let getSent = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'Invalid userId' });

    const postcards = await postcardService.handleGetSent(userId);
    return res.status(200).json({ postcards });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// PUT /api/v1/postcards/:postcardId/read
let markRead = async (req, res) => {
  try {
    const postcardId = Number(req.params.postcardId);
    const { userId } = req.body;

    if (!postcardId || !userId) {
      return res.status(400).json({ message: 'postcardId and userId are required' });
    }

    const result = await postcardService.handleMarkRead(postcardId, Number(userId));

    if (result.notFound) return res.status(404).json({ message: 'Postcard not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Forbidden' });

    return res.status(200).json({ message: 'Marked as read', postcardData: result.data });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// GET /api/v1/postcards/limit/:senderId/:receiverId
let getLimitStatus = async (req, res) => {
  try {
    const senderId = Number(req.params.senderId);
    const receiverId = Number(req.params.receiverId);
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'Invalid senderId or receiverId' });
    }

    const limitStatus = await postcardService.handleGetLimitStatus(senderId, receiverId);
    return res.status(200).json({ limitStatus });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// DELETE /api/v1/postcards/:postcardId
let deletePostcard = async (req, res) => {
  try {
    const postcardId = Number(req.params.postcardId);
    const { userId } = req.body;

    if (!postcardId || !userId) {
      return res.status(400).json({ message: 'postcardId and userId are required' });
    }

    const result = await postcardService.handleDeletePostcard(postcardId, Number(userId));

    if (result.notFound) return res.status(404).json({ message: 'Postcard not found' });
    if (result.forbidden) return res.status(403).json({ message: 'Forbidden' });

    return res.status(200).json({ message: 'Postcard deleted' });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// GET /api/v1/postcards/recent-media/:userId
let getRecentMedia = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'Invalid userId' });

    const recentMedia = await postcardService.handleGetRecentMedia(userId);
    return res.status(200).json({ recentMedia });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

const postcardController = {
  sendPostcard,
  getReceived,
  getSent,
  markRead,
  deletePostcard,
  getLimitStatus,
  getRecentMedia,
};

export default postcardController;
