import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Ensures a user is a participant of chatId.
 */
export async function assertParticipant(chatId, userId) {
  const chat = await db.ChatModel.findByPk(chatId);
  if (!chat) {
    const err = new Error('Chat not found');
    err.status = 404;
    throw err;
  }
  if (![chat.senderId, chat.receiverId].includes(Number(userId))) {
    const err = new Error('Forbidden: not a participant of this chat');
    err.status = 403;
    throw err;
  }
  return chat;
}

/**
 * Throws if AI access is disallowed for this chat.
 * Use this ANY time you plan to send video conversation data to an AI.
 */
export async function assertAIAllowed(chatId) {
  const chat = await db.ChatModel.findByPk(chatId, {
    attributes: ['id','aiAccessAllowed']
  });
  if (!chat) {
    const err = new Error('Chat not found');
    err.status = 404;
    throw err;
  }
  if (!chat.aiAccessAllowed) {
    const err = new Error('AI access is disabled for this conversation');
    err.status = 403;
    throw err;
  }
  return true;
}

export async function isAiAccessAllowed(sessionId) {
  try {
    const transcript = await db.Transcript.findOne({
      where: { sessionId },
      attributes: ['aiAccess']
    });

    if (!transcript) {
      throw new Error(`Transcript not found for sessionId: ${sessionId}`);
    }

    return transcript.aiAccess;
  } catch (error) {
    throw new Error(`Failed to check AI access: ${error.message}`);
  }
}
