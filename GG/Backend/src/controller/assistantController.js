import messageService from '../Service/messageService.js';
import { assertParticipant, assertAIAllowed } from '../Service/privacyService.js';

// POST /api/assistant/parse/:chatId  { userId }
export async function parseConversation(req, res) {
  try {
    const chatId = Number(req.params.chatId);
    const userId = Number(req.body.userId);

    await assertParticipant(chatId, userId);
    await assertAIAllowed(chatId);

    // Fetch messages and (in your real code) send to an LLM.
    const msgs = await messageService.handleFindMessages(chatId);
    // ... call AI here ...
    return res.status(200).json({ message: 'OK', data: { /* aiResult */ } });
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.message || 'Internal error' });
  }
}