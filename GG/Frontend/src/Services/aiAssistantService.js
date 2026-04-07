import axios from '../Utils/axios';

/**
 * Query the AI assistant
 * @param {string} message
 * @param {audioBlob} audioBlob
 * @param {number} userId
 * @returns {Promise} AI response
 */
const handleChatWithAssistant = (message, audioBlob, userId, chatId) => {
if (!message?.trim() && !audioBlob) {
        return Promise.reject({ // Use Promise.reject to simulate an error response
            response: { 
                data: {
                    error: "No message or audio file provided."
                }
            }
        });
    }

    const endpoint = '/api/v1/ai-assistant/chat';

    if (audioBlob) {
        const formData = new FormData();
        formData.append('audioFile', audioBlob, 'voice-message.webm'); 
        
        formData.append('userId', userId);
        if (message) {
             formData.append('message', message);
        }

        
        console.log(formData);
        return axios.post(endpoint, formData, {
            headers: {
            },
        });

    } else {
        return axios.post(endpoint, {
            message: message,
            userId: userId,
            chatId: chatId,
        });
    }
};

/**
 * Save the current conversation to the database
 * @param {number} userId
 * @returns {Promise} saved confirmation message
 */
const handleSaveConversation = (userId) => {
    return axios.post('/api/v1/ai-assistant/save', {
        userId: userId
    });
};

/**
 * Clear the current conversation from memory (without saving)
 * @param {number} userId
 * @returns {Promise} cleared successfully confirmation message
 */
const handleClearConversation = (userId) => {
    return axios.post('/api/v1/ai-assistant/clear', {
        userId: userId
    });
};

/**
 * Get the current conversation from memory
 * @param {number} userId
 * @returns {Promise} Response with the conversation array
 */
const handleGetConversation = (userId) => {
    return axios.get(`/api/v1/ai-assistant/conversation/${userId}`);
};

/**
 * Get the current conversation from memory
 * @param {number} userId
 * @returns {Promise} Response with the conversation array
 */
const handleGetAllAIChats = (userId) => {
    return axios.get(`/api/v1/ai-assistant/history/${userId}`);
};

/**
 * Load a conversation from database into the backend conversation store
 * @param {number} chatId
 * @param {number} userId
 * @returns {Promise} Response with the loaded conversation
 */
const handleLoadConversationFromDB = (chatId, userId) => {
    return axios.post('/api/v1/ai-assistant/load', {
        chatId: chatId,
        userId: userId
    });
};

export {
    handleChatWithAssistant,
    handleSaveConversation,
    handleLoadConversationFromDB,
    handleClearConversation,
    handleGetConversation,
    handleGetAllAIChats
};
