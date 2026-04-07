import { GoogleGenerativeAI } from "@google/generative-ai";
import { assertParticipant, assertAIAllowed, isAiAccessAllowed } from "../Service/privacyService.js";
import aiAssistantService from "../Service/aiAssistantService.js";
import { callPartnerMatching, callSummarizePracticeSession, callScheduleMeeting, createMcpClient, callPronunciationHelp } from "../mcp/client.js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY || GEMINI_KEY === "your_gemini_api_key_here") {
  console.warn("[AI Assistant] GEMINI_API_KEY is missing or placeholder. Chat Assistant will not work. Add your key to GG/Backend/.env (see .env.example)");
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY || "placeholder");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });


const conversationStore = new Map();

/**
 * Convert a local file buffer (like one from a multipart form) into a GenerativePart object.
 * @param {Buffer} buffer The file buffer (e.g., req.files.audioFile.data).
 * @param {string} mimeType The file's MIME type (e.g., req.files.audioFile.mimetype).
 * @returns {Part} A Part object for the Gemini API.
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

/**
 * Format mcp tool results into user-friendly text
 */
function formatToolResponse(toolName, result) {
  if (result.error) {
    console.log(`ERROR: encountered an error while using ${toolName}: ${result.error}`);
    return "Sorry! I encountered an error and couldn't complete your request. Please try again or contact an administrator.";
  }

  if (toolName === "partnerMatching") {
    if (!result.matches || result.matches.length === 0) {
      return "I couldn't find any compatible practice partners at the moment. Try adjusting your search criteria or check back later!";
    }

    let response = `I found ${result.matches.length} compatible practice partner${result.matches.length > 1 ? "s" : ""} for you:\n\n`;
    
    result.matches.forEach((match, index) => {
      response += `${index + 1}. **${match.firstName} ${match.lastName}**\n`;
      response += `   - Age: ${match.age || "Not specified"}\n`;
      response += `   - Gender: ${match.gender || "Not specified"}\n`;
      if (match.profession) {
        response += `   - Profession: ${match.profession}\n`;
      }
      response += `   - Native Language: ${match.nativeLanguage}\n`;
      response += `   - Learning: ${match.targetLanguage} (${match.targetLanguageProficiency || "Not specified"})\n`;
      if (match.sharedInterests && match.sharedInterests.length > 0) {
        response += `   - Shared Interests: ${match.sharedInterests.join(", ")}\n`;
      }
      if (match.mbti) {
        response += `   - MBTI: ${match.mbti}\n`;
      }
      if (match.zodiac) {
        response += `   - Zodiac: ${match.zodiac}\n`;
      }
      response += `   - Compatibility Score: ${match.compatibilityScore}\n\n`;
    });

    return response;
  }

  if (toolName === "summarizePracticeSession") {
    // TODO: temporary placeholder for now
    return `Practice session summary: ${JSON.stringify(result, null, 2)}`;
  }

  if (toolName === "scheduleMeeting") {
    if (result.error) {
      return `I couldn't schedule the meeting: ${result.error}${result.details ? `. ${result.details}` : ''}`;
    }

    if (result.success) {
      const { meeting, targetUser } = result;
      return `Great! I've successfully scheduled a meeting with ${targetUser.firstName} ${targetUser.lastName}.\n\n` +
             `Meeting Details:\n` +
             `- Day: ${meeting.day_of_week}\n` +
             `- Time: ${meeting.start_time} - ${meeting.end_time}\n\n` +
             `The meeting has been added to your schedule and will appear on your Scheduler page.`;
    }

    return `Meeting scheduling result: ${JSON.stringify(result, null, 2)}`;
  }

  if (toolName == "pronunciationHelp") {
    const { success, numericalRating, qualitativeResponse, savedToDb } = result;
    if (!success) {
      return "I'm sorry, something went wrong.";
    }
    let output = "Output the following to the user, word for word:\n\n";
    if (numericalRating != null) {
      output += `Your pronunciation is rated at a ${numericalRating} out of 10\n\n`;
    }

    output += qualitativeResponse;
    return output;
  }

  return `Result from ${toolName}: ${JSON.stringify(result, null, 2)}`;
}

/**
 * Extract criteria from user message using Gemini
 */
async function extractCriteria(userMessage) {
  const criteriaPrompt = `
    Analyze this user message and extract any specific criteria they mention for finding practice partners.
    Look for mentions of zodiac signs or MBTI types.
    Respond with ONLY valid JSON:
    {"zodiac": "sign" or null, "mbti": "type" or null}
    
    User message: "${userMessage}"
  `;

  try {
    const response = await model.generateContent(criteriaPrompt);
    const text = response.response.text().trim();
    // Remove markdown code blocks
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      zodiac: parsed.zodiac || null,
      mbti: parsed.mbti || null,
    };
  } catch (error) {
    console.error("Error extracting user search criteria:", error);
    return { zodiac: null, mbti: null };
  }
}

/**
 * Check if user wants to use partnerMatching tool
 */
async function shouldUsePartnerMatching(userMessage) {
  const checkPrompt = `
    Does the user want to find, search for, discover, or get recommendations for NEW practice partners (OTHER USERS that are NOT FRIENDS) or language exchange partners they haven't met yet?
    
    Answer "yes" ONLY if they are looking to find NEW people to connect with (browsing, searching, discovering).
    Answer "no" if they are:
    - Scheduling a meeting with a SPECIFIC person they already know (use scheduleMeeting instead)
    - Mentioning a specific name or friend they want to meet with
    - Asking to book, schedule, arrange, or set up a meeting with someone specific
    - Asking for help with language learning activities, translation assistance, tips, or general conversation or questions
    
    Respond with ONLY "yes" or "no".
    
    User message: "${userMessage}"
  `;

  try {
    const response = await model.generateContent(checkPrompt);
    const text = response.response.text().trim().toLowerCase();
    return text.includes("yes");
  } catch (error) {
    console.error("Error checking partner matching intent:", error);
    return false;
  }
}

/**
 * Check if user wants to summarize a practice session
 */
async function shouldSummarizeSession(userMessage) {
  const checkPrompt = `
    Does the user want to summarize, review, or get a summary of a practice session or conversation they had with another user?
    Answer "yes" ONLY if they are explicitly looking to get a summary of a practice session or conversation.
    Answer "no" if they are asking for:
    - Help with language learning activities (reading, writing, grammar, vocabulary)
    - Translation assistance
    - Learning tips or advice
    - General conversation or questions
    - Practice exercises or materials
    
    Respond with ONLY "yes" or "no".
    
    User message: "${userMessage}"
  `;

  try {
    const response = await model.generateContent(checkPrompt);
    const text = response.response.text().trim().toLowerCase();
    return text.includes("yes");
  } catch (error) {
    console.error("Error checking summarize intent:", error);
    return false;
  }
}

async function shouldCheckPronunciation(audioFile) {
  try {
    if (audioFile == null) {
      return false;
    }
    const audioPart = fileToGenerativePart(audioFile.buffer, audioFile.mimetype); 
    const checkPrompt = `
      Does the user want help with pronunciation?

      Answer "yes" if they:
      - Ask directly for pronunciation help
      - Ask for feedback on their speaking
      
      Answer "no" if they:
      - Ask a question but do not request feedback on their speaking (we will simply answer the question instead)

      Respond with ONLY "yes" or "no".
`;
    const parts = [{ text: checkPrompt }].concat(audioPart);
    const contents = [
      {
        role: "user",
        parts: parts
      }
    ];

    // console.log(JSON.stringify(contents));

    const response = await model.generateContent({
      contents: contents
    });
    const text = response.response.text().trim().toLowerCase();
    return text.includes("yes");


  } catch (error) {
    console.error("Error checking pronunciation intent: ", error);
    return false;
  }
}


/**
 * Check if user wants to schedule a meeting
 */
async function shouldScheduleMeeting(userMessage) {
  const checkPrompt = `
    Does the user want to schedule, book, arrange, set up, or plan a meeting, practice session, or call with a SPECIFIC person or friend they mentioned by name?
    
    Answer "yes" if they:
    - Mention scheduling/booking/arranging a meeting with a specific person
    - Mention a name or friend they want to meet with
    - Use words like "schedule", "book", "arrange", "set up", "plan" along with a person's name
    - Want to schedule a practice session with someone they know
    
    Answer "no" if they are:
    - Looking to find NEW partners (use partnerMatching instead)
    - Asking for help with language learning activities, translation, tips, or general questions
    - Not mentioning a specific person to schedule with
    
    Respond with ONLY "yes" or "no".
    
    User message: "${userMessage}"
  `;

  try {
    const response = await model.generateContent(checkPrompt);
    const text = response.response.text().trim().toLowerCase();
    return text.includes("yes");
  } catch (error) {
    console.error("Error checking schedule meeting intent:", error);
    return false;
  }
}

/**
 * Extract target user name from user message
 */
async function extractTargetUserName(userMessage) {
  const extractPrompt = `
    Extract the name of the person that the user wants to schedule a meeting with.
    
    Look for:
    - Full names (e.g., "John Smith")
    - First names only (e.g., "John")
    - Names mentioned after phrases like "with", "meeting with", "schedule with", etc.
    
    Return ONLY the name(s) found, or "null" if no name is found.
    If both first and last name are mentioned, return both (e.g., "John Smith").
    If only first name is mentioned, return just the first name (e.g., "John").
    Do not include any explanation, quotes, or additional text - just the name or "null".
    
    Examples:
    - "schedule a meeting with Bobby Jones" → "Bobby Jones"
    - "I want to meet with John" → "John"
    - "book a session with Sarah" → "Sarah"
    
    User message: "${userMessage}"
  `;

  try {
    const response = await model.generateContent(extractPrompt);
    const text = response.response.text().trim();
    // Remove markdown code blocks, quotes, and extra whitespace
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^["']|["']$/g, '')
      .trim();
    
    if (cleaned.toLowerCase() === "null" || cleaned.length === 0) {
      return null;
    }
    
    return cleaned;
  } catch (error) {
    console.error("Error extracting target user name:", error);
    return null;
  }
}

/**
 * Converts the application's conversation history objects into the
 * structured array format required by the Google Generative AI SDK.
 * @param {Array<Object>} messages - Array of message objects {role: string, content: string}
 * @returns {Array<Object>} Formatted history for the Gemini API.
 */
function formatHistory(messages) {
    return messages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
    }));
}

/**
 * Extract chatId from user message
 */
async function extractChatId(userMessage) {
  const extractPrompt = `
    Extract any numeric chat ID or conversation ID from this message.
    Respond with ONLY the number, or "null" if no ID is found.
    
    User message: "${userMessage}"
  `;

  try {
      const response = await model.generateContent(extractPrompt);
      const text = response.response.text().trim();
      const chatId = parseInt(text);
      return isNaN(chatId) ? null : chatId;
  } catch (error) {
      console.error("Error extracting chatId:", error);
      return null;
  }
}

export async function chatWithAssistant(req, res) {
  try {
    if (!GEMINI_KEY || GEMINI_KEY === "your_gemini_api_key_here") {
      return res.status(503).json({
        error: "Chat Assistant is not configured. Add GEMINI_API_KEY to GG/Backend/.env (see .env.example). Get a key at https://aistudio.google.com/apikey",
      });
    }
    const { message, userId, chatId } = req.body;
    console.log(req.body);
    const audioFile = req.file;
    if ((!message && !audioFile) || !userId) {
      return res.status(400).json({ error: "Missing message/audio or userId" });
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return res.status(400).json({ 
        error: "Invalid userId", 
        details: `userId must be a number, got: ${userId} (type: ${typeof userId})` 
      });
    }

    let userMessage = message || "[Audio Message]"; // Use placeholder if only audio is sent
    
    console.log(`[AI Assistant] User ${numericUserId} sent message: "${userMessage}"`);

    // Initialize conversation store for user if not exists
    let conversation = conversationStore.get(numericUserId);
    if (!conversation) {
      conversation = {
        messages: [],
        state: null,
        pendingData: {},
      };
      conversationStore.set(numericUserId, conversation);
    }
    
    // Store user's text or placeholder message in history
    conversation.messages.push({ role: "user", content: userMessage });

    let reply;
    let toolUsed = null;
    let toolResult = null;
    
    const wantsScheduleMeeting = message != null ? await shouldScheduleMeeting(userMessage) : false;
    const wantsSummarize = message != null ? await shouldSummarizeSession(userMessage) : false;
    const wantsPartnerMatching = message != null ? await shouldUsePartnerMatching(userMessage) : false;
    const wantsPronunciation = await shouldCheckPronunciation(audioFile);

    // Priority order: scheduleMeeting > summarize > partnerMatching
    // This ensures scheduling takes precedence when a specific user is mentioned
    const toolCalled = wantsScheduleMeeting || wantsSummarize || wantsPartnerMatching || wantsPronunciation;
    if (toolCalled) {
        if (wantsScheduleMeeting) {
            const targetUserName = await extractTargetUserName(userMessage);
            if (targetUserName) {
                toolUsed = "scheduleMeeting";
                console.log(`[AI Assistant] Calling scheduleMeeting for user ${numericUserId} with target: ${targetUserName}`);
                toolResult = await callScheduleMeeting(numericUserId, targetUserName);
                console.log(`[AI Assistant] scheduleMeeting result:`, toolResult);
                reply = formatToolResponse("scheduleMeeting", toolResult);
            } else {
                reply = "I'd be happy to schedule a meeting for you! Could you please tell me the name of the user you'd like to schedule a meeting with?";
            }
        } else if (wantsSummarize) {
            console.log(chatId);
            if (chatId) {
                try {

                  const allowed = await isAiAccessAllowed(chatId);

                  if (!allowed) {
                    reply = "Sorry! AI is not allowed in that conversation"; 
                  } else {

                    toolUsed = "summarizePracticeSession";
                    toolResult = await callSummarizePracticeSession(chatId, numericUserId);
                    const modelResponse = await model.generateContent(toolResult.prompt);
                    reply = modelResponse.response.text();
                  }
                } catch (error) {
                    console.error("Error summarizing practice session:", error);
                    reply = "I ran into an issue while trying to summarize that session. Please check the chat ID and permissions.";
                }
            } else {
                reply = "I'd be happy to summarize a practice session! Could you please provide the chat ID from that practice session?";
            }
        } else if (wantsPartnerMatching) {
            toolUsed = "partnerMatching";
            const criteria = await extractCriteria(userMessage);
            console.log(`[AI Assistant] Calling partnerMatching for user ${numericUserId} with criteria:`, criteria);
            toolResult = await callPartnerMatching(numericUserId, criteria);
            console.log(`[AI Assistant] partnerMatching result:`, toolResult);
            reply = formatToolResponse("partnerMatching", toolResult);
        } else if (wantsPronunciation) {
            toolUsed = "pronunciationHelp";
            console.log(`[AI Assistant] Calling pronunciationHelp for user ${numericUserId}`);
            toolResult = await callPronunciationHelp(
              fileToGenerativePart(
                audioFile.buffer,
                audioFile.mimetype
              ), 
              numericUserId);
            reply = formatToolResponse(toolUsed, toolResult);
        }
    } else {
      // Regular conversational response
      const chatHistory = conversation.messages
        .slice(-10) // Last 10 messages for context
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
        
      const systemInstruction = `You are a helpful AI assistant for a language exchange app, where students learning a foreign language are able to practice speaking with students who are native speakers, and both students are able to learn from each other. Help users find practice partners, answer questions about language learning, summarize their practice sessions, and assist with translation.

When giving longer responses, use markdown formatting for clarity: use **bold** for emphasis, and bullet points (- item) for lists. Keep responses concise but friendly.`;

      const historyForModel = formatHistory(
        conversation.messages.slice(0, -1).slice(-10) // up to the last 10 messages before current
      );

      // --- Construct the current user message (input) ---
      let userParts = [];
      
      if (audioFile) {
          const audioPart = fileToGenerativePart(audioFile.buffer, audioFile.mimetype); 
          userParts.push(audioPart);
      }
      
      userParts.push({ text: userMessage }); 

      const contents = [
          { 
              role: "user", 
              parts: [{ text: systemInstruction }] 
          },
          { 
              role: "model", 
              parts: [{ text: "Acknowledged." }]
          },
          ...historyForModel,
        { role: "user", parts: userParts }
      ];

      const aiResponse = await model.generateContent({
          contents: contents
      });

      reply = aiResponse.response.text();
    }
    
    conversation.messages.push({ role: "assistant", content: reply });
    
    return res.json({ reply });
  } catch (err) {
    console.error("chatWithAssistant error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Save conversation to database (called after user confirms)
 */
export async function saveConversation(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const conversation = conversationStore.get(numericUserId);
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return res.status(404).json({ error: "No conversation found to save" });
    }

    // Check if this is a continuation of an existing conversation
    if (conversation.chatId) {
      // Update existing conversation
      await aiAssistantService.handleUpdateAIChat(conversation.chatId, {
        conversation: conversation,
      });
    } else {
      // Create new conversation
      await aiAssistantService.handleSaveAIChat(numericUserId, {
        conversation: conversation,
      });
    }

    // Clear the conversation from memory
    conversationStore.delete(numericUserId);

    return res.json({ message: "Conversation saved successfully" });
  } catch (err) {
    console.error("saveConversation error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function clearConversation(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    conversationStore.delete(numericUserId);

    return res.json({ message: "Conversation cleared" });
  } catch (err) {
    console.error("clearConversation error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getConversation(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
            console.log(result);
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const conversation = conversationStore.get(numericUserId) || [];

    return res.json({ conversation });
  } catch (err) {
    console.error("getConversation error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function loadConversationFromDB(req, res) {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return res.status(400).json({ error: "Missing chatId or userId" });
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === "string" ? parseInt(userId, 10) : userId;
    const numericChatId = typeof chatId === "string" ? parseInt(chatId, 10) : chatId;
    
    if (isNaN(numericUserId) || isNaN(numericChatId)) {
      return res.status(400).json({ error: "Invalid userId or chatId" });
    }

    // Fetch the conversation from database
    const result = await aiAssistantService.handleGetAIChatById(numericChatId);
    const chat = result.data;

    // Verify the conversation belongs to the user
    if (chat.userId !== numericUserId) {
      return res.status(403).json({ error: "Unauthorized access to conversation" });
    }

    // Parse the conversation
    let parsedConversation;
    try {
      parsedConversation = JSON.parse(chat.conversation);
    } catch (err) {
      parsedConversation = chat.conversation; // fallback
    }

    // Extract messages array from parsed conversation
    let messages = [];
    if (Array.isArray(parsedConversation)) {
      messages = parsedConversation;
    } else if (parsedConversation && typeof parsedConversation === "object") {
      if (parsedConversation.conversation) {
        const innerConv = parsedConversation.conversation;
        if (Array.isArray(innerConv)) {
          messages = innerConv;
        } else if (innerConv.messages && Array.isArray(innerConv.messages)) {
          messages = innerConv.messages;
        }
      } else if (parsedConversation.messages && Array.isArray(parsedConversation.messages)) {
        messages = parsedConversation.messages;
      }
    }

    // Load into conversationStore
    const conversation = {
      messages: messages,
      state: null,
      pendingData: {},
      chatId: numericChatId // Track that this is a continuation
    };
    conversationStore.set(numericUserId, conversation);

    return res.json({ 
      message: "Conversation loaded successfully",
      conversation: conversation
    });
  } catch (err) {
    console.error("loadConversationFromDB error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getAllAIChats(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === "string" ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Fetch previous AI conversations
    const result = await aiAssistantService.handleGetAIChats(numericUserId);

    // Parse JSON string conversations into objects
    const parsedChats = result.data.map((chat) => {
      let parsedConversation;
      try {
        parsedConversation = JSON.parse(chat.conversation);
      } catch (err) {
        parsedConversation = chat.conversation; // fallback
      }

      return {
        id: chat.id,
        userId: chat.userId,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        conversation: parsedConversation,
      };
    });

    return res.json({
      message: result.errMessage,
      chats: parsedChats,
    });
  } catch (err) {
    console.error("getAllAIChats error:", err);
    res.status(500).json({ error: err.message });
  }
}
