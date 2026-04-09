import axios from 'axios';
import { getApiBase } from './apiBase';

export type AssistantChatResponse = { reply: string };

export type AssistantErrorBody = {
  error?: string;
  code?: string;
  details?: string;
};

const base = () => getApiBase();

/** Text chat — same contract as main `aiAssistantService.handleChatWithAssistant` (JSON body). */
export async function postAssistantChatJson(params: {
  message: string;
  userId: string | number;
  chatId?: number | null;
}): Promise<AssistantChatResponse> {
  const { data } = await axios.post<AssistantChatResponse>(
    `${base()}/api/v1/ai-assistant/chat`,
    {
      message: params.message,
      userId: params.userId,
      ...(params.chatId != null && !Number.isNaN(params.chatId) ? { chatId: params.chatId } : {}),
    },
    { withCredentials: true }
  );
  return data;
}

/** Voice message — multipart like main full Assistant page. */
export async function postAssistantChatAudio(formData: FormData): Promise<AssistantChatResponse> {
  const { data } = await axios.post<AssistantChatResponse>(
    `${base()}/api/v1/ai-assistant/chat`,
    formData,
    { withCredentials: true }
  );
  return data;
}

export async function getAssistantConversation(userId: string | number): Promise<unknown> {
  const { data } = await axios.get<{ conversation: unknown }>(
    `${base()}/api/v1/ai-assistant/conversation/${userId}`,
    { withCredentials: true }
  );
  return data?.conversation;
}

export async function clearAssistantConversation(userId: string | number): Promise<void> {
  await axios.post(
    `${base()}/api/v1/ai-assistant/clear`,
    { userId },
    { withCredentials: true }
  );
}

export async function saveAssistantConversation(userId: string | number): Promise<void> {
  await axios.post(
    `${base()}/api/v1/ai-assistant/save`,
    { userId },
    { withCredentials: true }
  );
}
