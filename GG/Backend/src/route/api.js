import express from "express";
import multer from "multer"; // Add this import
import path from "path"; // Add this import
import { fileURLToPath } from 'url'; // Add this for ES modules
import APIController from "../controller/APIController.js";
import interestController from "../controller/interestController.js";
import userInterestController from "../controller/userInterestController.js";
import availabilityController from "../controller/availabilityController.js";
import transcriptController from "../controller/transcriptController.js";
import chatController from "../controller/chatController.js";
import messageController from "../controller/messageController.js";
import dashboardService from "../Service/dashboardService.js";
import * as assistantController from "../controller/assistantController.js";
import * as aiAssistantController from "../controller/aiAssistantController.js";
import recordingController from "../controller/recordingController.js"; // Add this
import { getMeetingsForUser } from "../controller/meetingController.js";
import fs from "fs";
import gameRoutes from './gameRoutes.js';
import gameLogicRoutes from './gameLogicRoutes.js';
import teamRoutes from './teamRoutes.js';
import questRoutes from './questRoutes.js';
import badgeRoutes from './badgeRoutes.js';
import challengeRoutes from './challengeRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import userController from '../controller/userController.js';
import { submitFeedback } from '../controller/feedbackController.js';
import postcardController from '../controller/postcardController.js';
import callInviteRoutes from './callInviteRoutes.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let router = express.Router();

const uploadPath = path.join(__dirname, '../uploads/recordings');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const userId = req.body.userId || 'unknown';
    const uniqueName = `recording-${userId}-${timestamp}.webm`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/webm' || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only webm audio files are allowed.'));
    }
  }
});

const memoryStorage = multer.memoryStorage();

// --- 2. Configure Multer Instance ---
const memoryUpload = multer({ 
  storage: memoryStorage, // <-- Key Change
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio/video files are allowed for recording.'));
    }
  }
});

const initAPIRoute = (app) => { 
    router.get("/meetings/:userId", getMeetingsForUser);
    router.get('/users', APIController.getAllUsers);
    /** Same behavior as POST /Register (web.js); use this path when the host only proxies /api (e.g. Plesk). */
    router.post('/feedback', submitFeedback);
    router.post('/register', userController.handleRegister);
    /** Same as POST /CreateProfile and PUT /UpdateProfile (web.js). */
    router.post('/create-profile', userController.handleProfileCreation);
    router.put('/update-profile', userController.handleProfileUpdate);
    router.post('/create-user', APIController.createNewUser);
    router.put('/update-user', APIController.updateUser);
    router.delete('/delete-user/:id', APIController.deleteUser);
    router.get('/user-names', APIController.getUserNames);
    router.get('/discover-users', APIController.getDiscoverUsers);
    router.get('/user-preferences', APIController.getUserPreferences);
    router.post('/addFriend', APIController.addFriend);
    router.get('/getUserProfile/:userId', APIController.getUserProfile);
    router.get('/profile-customization-options', APIController.getProfileCustomizationOptions);
    router.post('/update-rating', APIController.updateRating);
    //router.post('/update-proficiency', APIController.updateProficiency);
    router.post('/add-comment', APIController.addComment);
    router.get('/getUserProficiencyAndRating/:userId', APIController.getUserProficiencyAndRating);
    router.post('/addToFriendsList', APIController.addToFriendsList);
    router.get('/getFriendsList', APIController.getFriendsList);

    router.post('/addTrueFriend', APIController.addTrueFriend);
    router.delete('/removeTrueFriend', APIController.removeTrueFriend);
    router.get('/friends/:userId', APIController.getTrueFriendsList);
    router.get('/friends-leaderboard/:userId', APIController.getFriendsLeaderboard);
    router.get('/friendRequests/:userId', APIController.getFriendRequests);
    router.put('/friendRequests/:requestId/accept', APIController.acceptFriendRequest);
    router.put('/friendRequests/:requestId/reject', APIController.rejectFriendRequest);

    router.post('/createMeeting', APIController.createMeeting);
    router.post('/zoom/create-meeting', APIController.createZoomMeetingLink);
    router.post('/agora/token', APIController.createAgoraRtcToken);
    router.delete('/deleteMeeting', APIController.deleteMeeting);
    router.put('/moveMeeting', APIController.moveMeeting);

    router.get('/interests', interestController.listInterests);
    router.post('/interests', interestController.createInterest);

    router.get('/users/:userId/interests', userInterestController.getUserInterests);
    router.post('/users/:userId/interests', userInterestController.addUserInterest);
    router.delete('/users/:userId/interests/:interestId', userInterestController.removeUserInterest);
    router.put('/users/:userId/interests', userInterestController.replaceUserInterests);

    router.get('/users/:userId/availability', availabilityController.getAvailability);
    router.post('/users/:userId/availability', availabilityController.addAvailability);
    router.delete('/users/:userId/availability/:id', availabilityController.removeAvailability);
    router.put('/users/:userId/availability', availabilityController.replaceAvailability);
    
    router.post('/generateTranscript', transcriptController.generateTranscript);
    router.get('/getTranscripts/:userId', transcriptController.getTranscripts);
  
    router.put('/chats/:chatId/privacy', chatController.updatePrivacy);
    router.put('/createChat/:senderId/:receiverId', chatController.createChat);

    /**
     * Chat & messages under /api/v1 (same handlers as legacy /Chats, /Chat, /Message on web.js).
     * Use these when the host only proxies /api/v1 to Node (e.g. Plesk).
     */
    router.get('/chats/:userId', chatController.findChats);
    router.get('/conversation/:senderId/:receiverId', chatController.findChat);
    router.post('/messages', messageController.addMessage);
    router.get('/messages/:chatId', messageController.findMessages);

    // Postcards
    router.post('/postcards', postcardController.sendPostcard);
    router.get('/postcards/received/:userId', postcardController.getReceived);
    router.get('/postcards/sent/:userId', postcardController.getSent);
    router.put('/postcards/:postcardId/read', postcardController.markRead);
    router.delete('/postcards/:postcardId', postcardController.deletePostcard);
    router.get('/postcards/limit/:senderId/:receiverId', postcardController.getLimitStatus);
    router.get('/postcards/recent-media/:userId', postcardController.getRecentMedia);

    /** Dashboard summary — mirrors POST /Dashboard body `{ id }` from web.js */
    router.get('/dashboard/:userId', async (req, res) => {
      try {
        const id = Number(req.params.userId);
        if (!Number.isFinite(id) || id <= 0) {
          return res.status(400).json({ errorCode: 1, message: 'Invalid user id' });
        }
        const userData = await dashboardService.handleUserDashBoard(id);
        return res.status(200).json({
          errorCode: userData.errCode,
          message: userData.errMessage,
          user: userData.user ? userData.user : {},
        });
      } catch (e) {
        return res.status(500).json({
          errorCode: 1,
          message: e?.message || 'Server error',
        });
      }
    });

    /** Quick map of API surfaces for deployment checks (home / ops). */
    router.get('/meta', (_req, res) => {
      res.json({
        app: 'language-matchmaker',
        apiVersion: 1,
        endpoints: {
          health: '/api/health',
          dbHealth: '/api/db-health',
          discoverUsers: 'GET /api/v1/discover-users?requesterId=',
          dashboard: 'GET /api/v1/dashboard/:userId',
          chats: 'GET /api/v1/chats/:userId',
          conversation: 'GET /api/v1/conversation/:senderId/:receiverId',
          messages: 'GET /api/v1/messages/:chatId',
          postMessage: 'POST /api/v1/messages (body: chatId, senderId, text)',
          createChat: 'PUT /api/v1/createChat/:senderId/:receiverId',
          games: '/api/games',
          teams: '/api/teams',
          aiAssistant: 'POST /api/v1/ai-assistant/chat',
        },
      });
    });

    router.post('/assistant/parse/:chatId', assistantController.parseConversation);
    router.post('/ai-assistant/parse/:chatId', assistantController.parseConversation);

    // AI routes (chat, history, parse — unified under /ai-assistant)
    router.post('/ai-assistant/chat', memoryUpload.single('audioFile'), aiAssistantController.chatWithAssistant);
    router.post('/ai-assistant/save', aiAssistantController.saveConversation);
    router.post('/ai-assistant/load', aiAssistantController.loadConversationFromDB);
    router.post('/ai-assistant/clear', aiAssistantController.clearConversation);
    router.get('/ai-assistant/conversation/:userId', aiAssistantController.getConversation);
    router.get('/ai-assistant/history/:userId', aiAssistantController.getAllAIChats);

    // Recording route - ADD THIS
    router.post('/upload-recording', upload.single('audio'), recordingController.uploadRecording);

    app.use('/api/games', gameRoutes);
    app.use('/api/games', gameLogicRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/quests', questRoutes);
    app.use('/api/badges', badgeRoutes);
    app.use('/api/challenges', challengeRoutes);
    app.use('/api/upload', uploadRoutes);

    app.use('/api/v1/call-invite', callInviteRoutes);
    return app.use('/api/v1/', router)

}

export default initAPIRoute;
