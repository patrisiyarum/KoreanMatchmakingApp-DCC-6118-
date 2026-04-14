import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { MessageSquare, Gamepad2, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriendsList,
  rejectFriendRequest,
  type FriendRequestIncomingRow,
  type FriendRequestOutgoingRow,
  type FriendRow,
} from '@/api/friendsApi';
import { publicAssetUrl } from '../utils/profileImage';
import { getChatsForUser, getMessages } from '@/api/chatApi';

export function MyPartners() {
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestIncomingRow[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestOutgoingRow[]>([]);
  const [actingRequestId, setActingRequestId] = useState<number | null>(null);
  const [unreadPartnerIds, setUnreadPartnerIds] = useState<Set<string>>(new Set());
  const [chatIdByPartner, setChatIdByPartner] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [friendRows, reqs] = await Promise.all([getFriendsList(userId), getFriendRequests(userId)]);
      setFriends(friendRows);
      setIncoming(reqs.incoming);
      setOutgoing(reqs.outgoing);
    } catch {
      toast.error(t('Could not load partners', '파트너를 불러오지 못했습니다'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        setUnreadPartnerIds(new Set());
        setChatIdByPartner({});
        return;
      }
      try {
        const chats = await getChatsForUser(userId);
        const raw = window.localStorage.getItem(`chatSeenAt:${userId}`);
        const seenMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        const nextUnread = new Set<string>();
        const nextByPartner: Record<string, number> = {};
        await Promise.all(
          chats.map(async (chat) => {
            const partnerId =
              Number(chat.senderId) === Number(userId) ? String(chat.receiverId) : String(chat.senderId);
            nextByPartner[partnerId] = Number(chat.id);
            const rows = await getMessages(Number(chat.id));
            const latest = rows
              .slice()
              .sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              )[0];
            if (!latest) return;
            if (Number(latest.senderId) === Number(userId)) return;
            const seenAt = seenMap[String(chat.id)];
            const isUnread = !seenAt || new Date(latest.createdAt || 0).getTime() > new Date(seenAt).getTime();
            if (isUnread) nextUnread.add(partnerId);
          })
        );
        if (!cancelled) {
          setUnreadPartnerIds(nextUnread);
          setChatIdByPartner(nextByPartner);
        }
      } catch {
        if (!cancelled) {
          setUnreadPartnerIds(new Set());
          setChatIdByPartner({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [friends, userId]);

  const markPartnerChatSeen = (partnerId: string) => {
    if (!userId) return;
    const chatId = chatIdByPartner[String(partnerId)];
    if (!chatId) return;
    try {
      const raw = window.localStorage.getItem(`chatSeenAt:${userId}`);
      const seenMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      seenMap[String(chatId)] = new Date().toISOString();
      window.localStorage.setItem(`chatSeenAt:${userId}`, JSON.stringify(seenMap));
    } catch {
      // Ignore localStorage failures.
    }
    setUnreadPartnerIds((prev) => {
      const next = new Set(prev);
      next.delete(String(partnerId));
      return next;
    });
  };

  const displayName = (first?: string, last?: string, fallback = 'Partner') =>
    `${first || ''} ${last || ''}`.trim() || fallback;

  const handleAccept = async (requestId: number) => {
    if (!userId) return;
    setActingRequestId(requestId);
    try {
      await acceptFriendRequest(requestId, userId);
      toast.success(t('Request accepted', '요청을 수락했습니다'));
      await load();
    } catch {
      toast.error(t('Could not accept request', '요청을 수락하지 못했습니다'));
    } finally {
      setActingRequestId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!userId) return;
    setActingRequestId(requestId);
    try {
      await rejectFriendRequest(requestId, userId);
      toast.success(t('Request declined', '요청을 거절했습니다'));
      await load();
    } catch {
      toast.error(t('Could not decline request', '요청을 거절하지 못했습니다'));
    } finally {
      setActingRequestId(null);
    }
  };

  if (!userId) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <p className="text-neutral-600 text-center">
          <Link to="/login" className="text-violet-600 font-medium hover:underline">
            {t('Sign in', '로그인')}
          </Link>{' '}
          {t('to manage partners.', '하고 파트너를 관리하세요.')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (friends.length === 0 && incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {t('No partners yet', '아직 파트너가 없습니다')}
          </h3>
          <p className="text-neutral-600 mb-6">
            {t('Start swiping to find your study buddy!', '스와이프해서 파트너를 찾아보세요!')}
          </p>
          <Link
            to="/discover"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            {t('Find Partners', '파트너 찾기')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">
            {t('My Study Partners', '내 파트너')}
          </h2>
          <p className="text-neutral-600">
            {friends.length === 1
              ? t('1 active friend', '활성 친구 1명')
              : `${friends.length} ${t('active friends', '활성 친구')}`}
          </p>
        </div>

        {incoming.length > 0 && (
          <div className="bg-white rounded-2xl border border-violet-200 p-5">
            <h3 className="font-semibold text-neutral-900 mb-3">
              {t('Incoming Requests', '받은 요청')}
            </h3>
            <div className="space-y-3">
              {incoming.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {displayName(req.requesterFirstName, req.requesterLastName)}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{req.requesterEmail || ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleReject(req.id)}
                      disabled={actingRequestId === req.id}
                      className="px-3 py-1.5 rounded-lg text-sm bg-neutral-200 text-neutral-800 hover:bg-neutral-300 disabled:opacity-50"
                    >
                      {t('Decline', '거절')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAccept(req.id)}
                      disabled={actingRequestId === req.id}
                      className="px-3 py-1.5 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {actingRequestId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {t('Accept', '수락')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {friends.map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 mb-4">
              {publicAssetUrl(friend.profileImage) ? (
                <img
                  src={publicAssetUrl(friend.profileImage)}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-neutral-100 text-2xl flex items-center justify-center">👤</div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {displayName(friend.firstName, friend.lastName)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {t('Connected', '연결됨')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to={`/chat/${friend.id}`}
                onClick={() => markPartnerChatSeen(String(friend.id))}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors relative"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('Chat', '채팅')}</span>
                {unreadPartnerIds.has(String(friend.id)) ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {t('New', '새로')}
                  </span>
                ) : null}
              </Link>
              <Link
                to="/games"
                className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{t('Game', '게임')}</span>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
