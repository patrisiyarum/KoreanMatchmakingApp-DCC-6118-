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
    router.post('/create-user', APIController.createNewUser);
    router.put('/update-user', APIController.updateUser);
    router.delete('/delete-user/:id', APIController.deleteUser);
    router.get('/user-names', APIController.getUserNames);
    router.get('/user-preferences', APIController.getUserPreferences);
    router.post('/addFriend', APIController.addFriend);
    router.get('/getUserProfile/:userId', APIController.getUserProfile);
    router.post('/update-rating', APIController.updateRating);
    //router.post('/update-proficiency', APIController.updateProficiency);
    router.post('/add-comment', APIController.addComment);
    router.get('/getUserProficiencyAndRating/:userId', APIController.getUserProficiencyAndRating);
    router.post('/addToFriendsList', APIController.addToFriendsList);
    router.get('/getFriendsList', APIController.getFriendsList);

    router.post('/addTrueFriend', APIController.addTrueFriend);
    router.delete('/removeTrueFriend', APIController.removeTrueFriend);
    router.get('/friends/:userId', APIController.getTrueFriendsList);
    router.get('/friendRequests/:userId', APIController.getFriendRequests);
    router.put('/friendRequests/:requestId/accept', APIController.acceptFriendRequest);
    router.put('/friendRequests/:requestId/reject', APIController.rejectFriendRequest);

    router.get("/api/availability/:userId", APIController.getUserAvailability);

    router.post('/createMeeting', APIController.createMeeting);
    router.delete('/deleteMeeting', APIController.deleteMeeting);

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

    router.post('/assistant/parse/:chatId', assistantController.parseConversation);

    // AI routes
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

    return app.use('/api/v1/', router)

}

export default initAPIRoute;
