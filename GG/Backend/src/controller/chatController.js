import ChatModel from '../models/ChatModel.js';
import chatService from '../Service/chatService.js';

let createChat = async (req, res) => {
  let senderId = req.params.senderId;
  let receiverId = req.params.receiverId;
  console.log(senderId);
  console.log(receiverId);
  let message = await chatService.handleChatModel(senderId, receiverId);
  console.log(message);
  return res.status(200).json({
    message: message.errMessage,
    messageData: message.data ? message.data : {}
  });
};

let findChats = async (req, res) => {
  let userId = req.params.userId;
  let messageData = await chatService.handleFindChats(userId);
  return res.status(200).json({
    message: messageData.errMessage,
    chatsData: messageData.data ? messageData.data : {}
  });
};

let findChat = async (req, res) => {
  let senderId = req.params.senderId;
  let receiverId = req.params.receiverId;
  let messageData = await chatService.handleFindChat(senderId, receiverId);
  return res.status(200).json({
    message: messageData.errMessage,
    chatsData: messageData.data ? messageData.data : {}
  });
};


let updatePrivacy = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const { userId, aiAccessAllowed } = req.body;

    if (Number.isNaN(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }
    if (userId == null || typeof aiAccessAllowed === 'undefined') {
      return res.status(400).json({ message: 'userId and aiAccessAllowed are required' });
    }

    const chat = await ChatModel.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only participants can change the setting
    const isParticipant = [String(chat.senderId), String(chat.receiverId)].includes(String(userId));
    if (!isParticipant) {
      return res.status(403).json({ message: 'Forbidden: not a participant of this chat' });
    }

    chat.aiAccessAllowed = !!aiAccessAllowed;
    await chat.save();

    return res.status(200).json({
      message: 'Privacy preferences updated',
      data: { chatId: chat.id, aiAccessAllowed: chat.aiAccessAllowed }
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

// toggle to fetch one chat by id
let getChatById = async (req, res) => {
  try {
    const chat = await ChatModel.findByPk(Number(req.params.chatId));
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    return res.status(200).json({ message: 'OK', data: chat });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Internal error' });
  }
};

const chatController = {
  createChat,
  findChats,
  findChat,
  updatePrivacy,
  getChatById
};

export default chatController;
