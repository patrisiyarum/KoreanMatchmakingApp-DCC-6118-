import db from "../models/index.js";
import { Op } from "sequelize";

/**
 * Save a new AI conversation for a user.
 */
let handleSaveAIChat = (userId, conversation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const newChat = await db.AIChatModel.create({
        userId,
        conversation: JSON.stringify(conversation),
      });

      const message = {
        errMessage: "AI chat successfully saved!",
        data: newChat,
      };
      resolve(message);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Retrieve all AI conversations for a user.
 */
let handleGetAIChats = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const chats = await db.AIChatModel.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });

      const message = {
        errMessage: "AI chats retrieved successfully!",
        data: chats,
      };
      resolve(message);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Retrieve a single AI conversation by ID.
 */
let handleGetAIChatById = (chatId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const chat = await db.AIChatModel.findByPk(chatId);

      if (!chat) {
        return reject({ status: 404, message: "AI chat not found" });
      }

      const message = {
        errMessage: "AI chat retrieved successfully!",
        data: chat,
      };
      resolve(message);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Update an existing AI conversation.
 */
let handleUpdateAIChat = (chatId, conversation) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.AIChatModel.update(
        {
          conversation: JSON.stringify(conversation),
        },
        {
          where: { id: chatId },
        }
      );

      // Fetch the updated record
      const updatedChat = await db.AIChatModel.findByPk(chatId);

      const message = {
        errMessage: "AI chat successfully updated!",
        data: updatedChat,
      };
      resolve(message);
    } catch (e) {
      reject(e);
    }
  });
};

const aiAssistantService = {
  handleSaveAIChat,
  handleGetAIChats,
  handleGetAIChatById,
  handleUpdateAIChat,
};

export default aiAssistantService;
