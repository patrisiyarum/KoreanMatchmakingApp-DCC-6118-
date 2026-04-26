import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Video, Send, Loader2, Sparkles } from 'lucide-react';
import { Message } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getFriendsList, type FriendRow } from '@/api/friendsApi';
import { createChat, getChatsForUser, getMessages, sendMessage } from '@/api/chatApi';
import { createCallInvite } from '@/api/callInviteApi';
import { UserAvatar } from './UserAvatar';
import { ConversationPrompts } from './ConversationPrompts';

type ChatPartner = {
  id: string;
  name: string;
  avatar: string;
  profileImage?: string | null;
};

export function Chat() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const directCallId = useMemo(() => {
    const me = Number(userId || 0);
    const them = Number(partnerId || 0);
    if (!me || !them) return null;
    const low = Math.min(me, them);
    const high = Math.max(me, them);
    return `direct-${low}-${high}`;
  }, [partnerId, userId]);

  const goBack = () => {
    navigate(-1);
  };

  const markChatSeen = (targetChatId: number, seenAt: Date) => {
    if (!userId) return;
    try {
      const key = `chatSeenAt:${userId}`;
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      parsed[String(targetChatId)] = seenAt.toISOString();
      window.localStorage.setItem(key, JSON.stringify(parsed));
    } catch {
      // Ignore localStorage failures.
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadPartner() {
      if (!partnerId) {
        setPartner(null);
        setLoadingPartner(false);
        return;
      }
      setLoadingPartner(true);

      if (!userId) {
        if (!cancelled) {
          setPartner(null);
          setLoadingPartner(false);
        }
        return;
      }

      try {
        const friends = await getFriendsList(userId);
        if (cancelled) return;
        const row = friends.find((f) => String(f.id) === String(partnerId));
        if (!row) {
          setPartner(null);
          setLoadingPartner(false);
          return;
        }
        setPartner(friendRowToPartner(row));
      } catch {
        if (!cancelled) setPartner(null);
      } finally {
        if (!cancelled) setLoadingPartner(false);
      }
    }

    void loadPartner();
    return () => {
      cancelled = true;
    };
  }, [partnerId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!userId || !partnerId) {
        if (!cancelled) {
          setChatId(null);
          setMessages([]);
          setLoadingMessages(false);
        }
        return;
      }

      setLoadingMessages(true);
      try {
        const chats = await getChatsForUser(userId);
        let existingChat = chats.find((c) => {
          const sender = String(c.senderId);
          const receiver = String(c.receiverId);
          return (
            (sender === String(userId) && receiver === String(partnerId)) ||
            (sender === String(partnerId) && receiver === String(userId))
          );
        });

        if (!existingChat) {
          const created = await createChat(userId, String(partnerId));
          if (created) existingChat = created;
        }

        if (!existingChat) {
          if (!cancelled) {
            setChatId(null);
            setMessages([]);
            setLoadingMessages(false);
          }
          return;
        }

        const activeChatId = Number(existingChat.id);
        const rows = await getMessages(activeChatId);
        if (cancelled) return;

        setChatId(activeChatId);
        const mappedRows = rows
          .map((row) => ({
            id: String(row.id),
            senderId: String(row.senderId),
            text: String(row.text ?? ''),
            timestamp: row.createdAt ? new Date(row.createdAt) : new Date(),
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(mappedRows);
        markChatSeen(activeChatId, mappedRows[mappedRows.length - 1]?.timestamp ?? new Date());
      } catch {
        if (!cancelled) {
          setChatId(null);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    void loadConversation();
    return () => {
      cancelled = true;
    };
  }, [userId, partnerId]);

  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const rows = await getMessages(chatId);
        if (cancelled) return;

        const mapped = rows
          .map((row) => ({
            id: String(row.id),
            senderId: String(row.senderId),
            text: String(row.text ?? ''),
            timestamp: row.createdAt ? new Date(row.createdAt) : new Date(),
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setMessages((prev) => {
          const tempMessages = prev.filter((msg) => msg.id.startsWith('temp-'));
          return [...mapped, ...tempMessages];
        });
        markChatSeen(chatId, mapped[mapped.length - 1]?.timestamp ?? new Date());
      } catch {
        // Silent retry on next polling tick.
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [chatId]);

  const sendText = async (raw: string, opts: { fromInput?: boolean } = {}) => {
    const text = raw.trim();
    if (!text || !userId || !chatId || sendingMessage) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: String(userId),
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    if (opts.fromInput) setNewMessage('');
    setPromptsOpen(false);
    setSendingMessage(true);

    try {
      const saved = await sendMessage(chatId, userId, text);
      if (!saved) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
                id: String(saved.id),
                senderId: String(saved.senderId),
                text: String(saved.text ?? text),
                timestamp: saved.createdAt ? new Date(saved.createdAt) : optimisticMessage.timestamp,
              }
            : msg
        )
      );
      markChatSeen(chatId, saved.createdAt ? new Date(saved.createdAt) : new Date());
    } catch {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      if (opts.fromInput) setNewMessage(text);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSend = () => sendText(newMessage, { fromInput: true });

  const handleInsertPrompt = (text: string) => {
    setNewMessage(text);
    setPromptsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const isEmptyConversation = !loadingMessages && messages.length === 0 && Boolean(chatId);

  if (loadingPartner) {
    return (
      <div className="size-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Partner not found</p>
          <button type="button" onClick={goBack} className="text-blue-600 hover:underline mt-2 inline-block">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-white">
      <div className="border-b border-neutral-200 px-4 py-3 flex items-center gap-3 bg-white">
        <button type="button" onClick={goBack} className="text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <UserAvatar
          seed={partner.id}
          name={partner.name}
          profileImage={partner.profileImage}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">{partner.name}</h3>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!directCallId || !userId || !partnerId) {
              navigate('/schedule');
              return;
            }
            // Fire-and-forget: ring the partner. Caller continues to the call regardless.
            void createCallInvite(userId, String(partnerId), directCallId);
            navigate(`/call/${directCallId}`);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
          aria-label={t('Start video call', '영상 통화 시작')}
          title={t('Start video call', '영상 통화 시작')}
        >
          <Video className="w-4 h-4" />
        </button>
      </div>

      {isEmptyConversation ? (
        <ConversationPrompts
          variant="empty-state"
          open
          onClose={() => {}}
          onSend={(text) => void sendText(text)}
          onInsert={handleInsertPrompt}
          partnerName={partner.name}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : null}
          {messages.map((message, index) => {
            const isOwn = message.senderId === (userId || 'user-1');

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                <p className={`text-[11px] mt-1 px-1 ${isOwn ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {!isEmptyConversation && (
        <ConversationPrompts
          variant="panel"
          open={promptsOpen}
          onClose={() => setPromptsOpen(false)}
          onSend={(text) => void sendText(text)}
          onInsert={handleInsertPrompt}
          partnerName={partner.name}
        />
      )}

      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPromptsOpen((open) => !open)}
            aria-label={
              promptsOpen
                ? t('Hide conversation prompts', '대화 프롬프트 숨기기')
                : t('Show conversation prompts', '대화 프롬프트 보기')
            }
            aria-pressed={promptsOpen}
            title={t('Conversation prompts', '대화 프롬프트')}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              promptsOpen
                ? 'bg-violet-100 text-violet-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-[18px] h-[18px]" />
          </button>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              placeholder={t('Type a message...', '메시지를 입력하세요...')}
              className="w-full pl-4 pr-14 py-3.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={loadingMessages || sendingMessage || !chatId}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!newMessage.trim() || loadingMessages || sendingMessage || !chatId}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              aria-label={t('Send', '보내기')}
            >
              <Send className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendRowToPartner(row: FriendRow): ChatPartner {
  const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Partner';
  return {
    id: String(row.id),
    name: fullName,
    avatar: '👤',
    profileImage: row.profileImage ?? null,
  };
}
