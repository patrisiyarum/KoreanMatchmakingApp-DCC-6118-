import axios from '../Utils/axios';

/**
 * Update AI privacy for a chat.
 * @param {number|string} chatId
 * @param {number|string} userId
 * @param {boolean} aiAccessAllowed
 */
export const updateChatPrivacy = (chatId, userId, aiAccessAllowed) => {
  return axios.put(`/api/v1/chats/${chatId}/privacy`, {
    userId,
    aiAccessAllowed,
  });
};
