import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import {
  postAssistantChatJson,
  postAssistantChatAudio,
  getAssistantConversation,
  clearAssistantConversation,
  type AssistantErrorBody,
} from '@/api/aiAssistantApi';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function normalizeServerConversation(raw: unknown): AIMessage[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return [];
  if (typeof raw !== 'object') return [];
  const conv = raw as { messages?: Array<{ role: string; content: string }> };
  if (!Array.isArray(conv.messages)) return [];
  return conv.messages.map((m, i) => ({
    id: `srv-${i}-${m.role}-${(m.content || '').slice(0, 8)}`,
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content ?? '',
    timestamp: new Date(),
  }));
}

function errorToAssistantText(err: unknown): string {
  const ax = err as {
    response?: { status?: number; data?: AssistantErrorBody | string };
    message?: string;
  };
  const status = ax.response?.status;
  const d = ax.response?.data;
  const msg =
    typeof d === 'string'
      ? d
      : d?.error || ax.message || 'Something went wrong. Please try again.';
  if (status === 503) {
    return typeof d === 'object' && d?.error ? `Sorry! ${d.error}` : `Sorry! ${msg}`;
  }
  return msg;
}

interface AIAssistantContextType {
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  messages: AIMessage[];
  isSending: boolean;
  sendMessage: (content: string, options?: { chatId?: number }) => Promise<void>;
  /** Voice note (WebM), same flow as main full Assistant page. */
  sendAudioBlob: (blob: Blob, options?: { chatId?: number }) => Promise<void>;
  /** Reload messages from the backend in-memory session (call when opening the modal). */
  syncFromServer: () => Promise<void>;
  /** Clear UI and backend session (same idea as main “Back to prompts”). */
  resetToPrompts: () => Promise<void>;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const syncFromServer = useCallback(async () => {
    if (!userId) return;
    try {
      const raw = await getAssistantConversation(userId);
      const next = normalizeServerConversation(raw);
      setMessages(next);
    } catch {
      /* keep current messages */
    }
  }, [userId]);

  const resetToPrompts = useCallback(async () => {
    setMessages([]);
    if (userId) {
      try {
        await clearAssistantConversation(userId);
      } catch {
        /* non-fatal */
      }
    }
  }, [userId]);

  const sendMessage = useCallback(
    async (content: string, options?: { chatId?: number }) => {
      if (!userId) {
        toast.error('Sign in to use the AI assistant.', { duration: 4000 });
        return;
      }
      const trimmed = content.trim();
      if (!trimmed || sendingRef.current) return;

      sendingRef.current = true;
      setIsSending(true);
      const userMessage: AIMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const { reply } = await postAssistantChatJson({
          message: trimmed,
          userId,
          chatId: options?.chatId,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply || "I couldn't generate a reply. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: errorToAssistantText(err),
            timestamp: new Date(),
          },
        ]);
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [userId]
  );

  const sendAudioBlob = useCallback(
    async (blob: Blob, options?: { chatId?: number }) => {
      if (!userId) {
        toast.error('Sign in to use the AI assistant.', { duration: 4000 });
        return;
      }
      if (!blob.size || sendingRef.current) return;

      sendingRef.current = true;
      setIsSending(true);
      const userMessage: AIMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: '[Audio message]',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const fd = new FormData();
      fd.append('audioFile', blob, 'voice-message.webm');
      fd.append('userId', String(userId));
      if (options?.chatId != null && !Number.isNaN(options.chatId)) {
        fd.append('chatId', String(options.chatId));
      }

      try {
        const { reply } = await postAssistantChatAudio(fd);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply || "I couldn't process that audio. Try again or type your question.",
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: errorToAssistantText(err),
            timestamp: new Date(),
          },
        ]);
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [userId]
  );

  return (
    <AIAssistantContext.Provider
      value={{
        isAssistantOpen,
        setIsAssistantOpen,
        messages,
        isSending,
        sendMessage,
        sendAudioBlob,
        syncFromServer,
        resetToPrompts,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}
