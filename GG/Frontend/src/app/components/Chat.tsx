import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { mockMessages, potentialPartners, initialMatches } from '../data/mockData';
import { Message } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getFriendsList, type FriendRow } from '@/api/friendsApi';
import { publicAssetUrl } from '../utils/profileImage';

type ChatPartner = {
  id: string;
  name: string;
  avatar: string;
  profileImage?: string | null;
};

export function Chat() {
  const { partnerId } = useParams();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(mockMessages[partnerId || ''] || []);
  }, [partnerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPartner() {
      if (!partnerId) {
        setPartner(null);
        setLoadingPartner(false);
        return;
      }
      setLoadingPartner(true);

      const fromMock = [...potentialPartners, ...initialMatches.map((m) => m.user)].find(
        (u) => String(u.id) === String(partnerId)
      );
      if (fromMock) {
        if (!cancelled) {
          setPartner({
            id: String(fromMock.id),
            name: fromMock.name,
            avatar: fromMock.avatar,
            profileImage: fromMock.profileImage ?? null,
          });
          setLoadingPartner(false);
        }
        return;
      }

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

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: userId || 'user-1',
      text: newMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    setTimeout(() => {
      const autoReply: Message = {
        id: `msg-${Date.now() + 1}`,
        senderId: partnerId || '',
        text: "That's great! Let's practice more! 더 연습해요! 😊",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1500);
  };

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
          <Link to="/partners" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-white">
      <div className="border-b border-neutral-200 px-4 py-3 flex items-center gap-3 bg-white">
        <Link to="/partners" className="text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        {publicAssetUrl(partner.profileImage) ? (
          <img
            src={publicAssetUrl(partner.profileImage)}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-neutral-200"
          />
        ) : (
          <div className="text-3xl">{partner.avatar}</div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">{partner.name}</h3>
          <p className="text-xs text-emerald-600 font-medium">{t('Online', '온라인')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('Type a message...', '메시지를 입력하세요...')}
            className="w-full pl-4 pr-14 py-3.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
            aria-label={t('Send', '보내기')}
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
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
