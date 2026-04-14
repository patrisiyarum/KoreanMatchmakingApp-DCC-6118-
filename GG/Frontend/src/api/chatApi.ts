import { http } from './http';

type ChatRow = {
  id: number;
  senderId: number;
  receiverId: number;
};

type MessageRow = {
  id: number;
  chatId: number;
  senderId: number;
  text: string;
  createdAt?: string;
};

export async function getChatsForUser(userId: string): Promise<ChatRow[]> {
  const res = await http.get<{ chatsData?: ChatRow[] }>(`/api/v1/chats/${userId}`);
  return Array.isArray(res?.chatsData) ? res.chatsData : [];
}

export async function createChat(senderId: string, receiverId: string): Promise<ChatRow | null> {
  const res = await http.put<{ messageData?: ChatRow }>(`/api/v1/createChat/${senderId}/${receiverId}`);
  return res?.messageData ?? null;
}

export async function getMessages(chatId: number): Promise<MessageRow[]> {
  const res = await http.get<{ chatsData?: MessageRow[] }>(`/api/v1/messages/${chatId}`);
  return Array.isArray(res?.chatsData) ? res.chatsData : [];
}

export async function sendMessage(chatId: number, senderId: string, text: string): Promise<MessageRow | null> {
  const res = await http.post<{ messageData?: MessageRow }>('/api/v1/messages', {
    chatId,
    senderId: Number(senderId),
    text,
  });
  return res?.messageData ?? null;
}
