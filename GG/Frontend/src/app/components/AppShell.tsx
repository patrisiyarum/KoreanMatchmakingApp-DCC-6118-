import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Home,
  Search,
  Gamepad2,
  MessageSquare,
  Calendar,
  Languages,
  Bot,
  LogOut,
  UserCircle,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslator } from '../context/TranslatorContext';
import { useAIAssistant } from '../context/AIAssistantContext';
import { useAuth } from '../context/AuthContext';
import { AIAssistant } from './AIAssistant';
import { Translator } from './Translator';
import { getFriendRequests } from '@/api/friendsApi';
import { getChatsForUser, getMessages } from '@/api/chatApi';
import { getMeetingsForUserApi } from '@/api/meetingsApi';
import { getPendingTeamInvites } from '@/api/teamsApi';
import { getChallengesForUser } from '@/api/challengesApi';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { setIsTranslatorOpen } = useTranslator();
  const { setIsAssistantOpen } = useAIAssistant();
  const { logout, userId } = useAuth();
  const [partnersNotifCount, setPartnersNotifCount] = useState(0);
  const [scheduleNotifCount, setScheduleNotifCount] = useState(0);
  const [gamesNotifCount, setGamesNotifCount] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

  const getSeenMap = useCallback((): Record<string, string> => {
    if (!userId) return {};
    try {
      const raw = window.localStorage.getItem(`chatSeenAt:${userId}`);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }, [userId]);

  const getScheduleSeenAt = useCallback((): string | null => {
    if (!userId) return null;
    try {
      return window.localStorage.getItem(`scheduleSeenAt:${userId}`);
    } catch {
      return null;
    }
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setPartnersNotifCount(0);
      setScheduleNotifCount(0);
      setGamesNotifCount(0);
      return;
    }
    try {
      const [reqs, chats, meetings, teamInvites, challengeRows] = await Promise.all([
        getFriendRequests(userId),
        getChatsForUser(userId),
        getMeetingsForUserApi(userId),
        getPendingTeamInvites(userId),
        getChallengesForUser(userId),
      ]);

      const seenMap = getSeenMap();
      const unreadByChat = await Promise.all(
        chats.map(async (chat) => {
          const rows = await getMessages(Number(chat.id));
          const latest = rows
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )[0];
          if (!latest) return 0;
          if (Number(latest.senderId) === Number(userId)) return 0;
          const seenAt = seenMap[String(chat.id)];
          if (!seenAt) return 1;
          return new Date(latest.createdAt || 0).getTime() > new Date(seenAt).getTime() ? 1 : 0;
        })
      );

      const unreadChats = unreadByChat.reduce((sum, value) => sum + value, 0);
      const pendingIncomingRequests = reqs.incoming.filter((r) => r.status === 'pending').length;
      const scheduleSeenAt = getScheduleSeenAt();
      const unseenMeetings = meetings.filter((meeting) => {
        if (!scheduleSeenAt) return true;
        const createdAt = meeting.createdAt ? new Date(meeting.createdAt).getTime() : 0;
        return createdAt > new Date(scheduleSeenAt).getTime();
      }).length;
      const challengeTurnsCount = challengeRows.filter((c) => {
        const isChallenger = Number(c.challengerId) === Number(userId);
        if (c.status === 'pending') return !isChallenger;
        if (c.status === 'accepted' || c.status === 'in_progress') {
          return isChallenger ? c.challengerScore == null : c.challengedScore == null;
        }
        return false;
      }).length;
      const gameInvitesCount = teamInvites.length + challengeTurnsCount;

      setPartnersNotifCount(unreadChats + pendingIncomingRequests);
      setScheduleNotifCount(unseenMeetings);
      setGamesNotifCount(gameInvitesCount);
    } catch {
      // Keep nav usable even when notification fetch fails.
    }
  }, [getScheduleSeenAt, getSeenMap, userId]);

  useEffect(() => {
    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return;
    if (location.pathname !== '/schedule') return;
    try {
      window.localStorage.setItem(`scheduleSeenAt:${userId}`, new Date().toISOString());
    } catch {
      // Ignore localStorage failures.
    }
    setScheduleNotifCount(0);
  }, [location.pathname, userId]);

  useEffect(() => {
    if (!userId) return;
    if (!(location.pathname === '/partners' || location.pathname.startsWith('/chat'))) return;
    let cancelled = false;
    (async () => {
      try {
        const chats = await getChatsForUser(userId);
        const raw = window.localStorage.getItem(`chatSeenAt:${userId}`);
        const seenMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        await Promise.all(
          chats.map(async (chat) => {
            const rows = await getMessages(Number(chat.id));
            const latest = rows
              .slice()
              .sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              )[0];
            if (latest) {
              seenMap[String(chat.id)] = latest.createdAt || new Date().toISOString();
            }
          })
        );
        if (!cancelled) {
          window.localStorage.setItem(`chatSeenAt:${userId}`, JSON.stringify(seenMap));
          void loadNotifications();
        }
      } catch {
        // Silent fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, userId]);

  const navItems = [
    { path: '/home', icon: Home, label: t('Home', '홈'), notifCount: 0 },
    { path: '/discover', icon: Search, label: t('Discover', '발견'), notifCount: 0 },
    { path: '/partners', icon: MessageSquare, label: t('Partners', '파트너'), notifCount: partnersNotifCount },
    { path: '/schedule', icon: Calendar, label: t('Schedule', '일정'), notifCount: scheduleNotifCount },
    { path: '/games', icon: Gamepad2, label: t('Games', '게임'), notifCount: gamesNotifCount },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-neutral-50">
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 truncate">
              LangMatch <span className="text-blue-600">언어교환</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 truncate">
              {t('Find your perfect study partner', '완벽한 스터디 파트너 찾기')}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsTranslatorOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('Translator', '번역기')}
            >
              <Languages className="w-5 h-5 text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (location.pathname === '/view-profile') {
                  navigate('/home');
                } else {
                  navigate('/view-profile');
                }
              }}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('My profile', '내 프로필')}
            >
              <UserCircle className="w-5 h-5 text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={() => setIsAssistantOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('AI Assistant', 'AI 도우미')}
            >
              <Bot className="w-5 h-5 text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {language === 'en' ? '한국어' : 'English'}
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('Log out', '로그아웃')}
            >
              <LogOut className="w-5 h-5 text-neutral-700" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        <Outlet />
      </main>

      {location.pathname !== '/home' ? (
        <Link
          to="/home"
          className="fixed right-4 bottom-24 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700 sm:right-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('Back to Home', '홈으로 돌아가기')}</span>
        </Link>
      ) : null}

      <nav className="shrink-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-1 sm:px-2 py-2 sm:py-3">
          {navItems.map((item) => {
            const isActive =
              item.path === '/partners'
                ? location.pathname === '/partners' || location.pathname.startsWith('/chat')
                : item.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/create-profile'
                  : location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-1.5 sm:px-2 py-1.5 rounded-lg transition-colors min-w-0 ${
                  isActive ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.notifCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[1.1rem] text-center font-semibold">
                      {item.notifCount > 9 ? '9+' : item.notifCount}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] sm:text-xs truncate max-w-[4.5rem] sm:max-w-none text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AIAssistant />
      <Translator />
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-200 p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-neutral-900">{t('Log out?', '로그아웃?')}</h3>
            <p className="text-sm text-neutral-600">{t('Are you sure you want to log out?', '정말 로그아웃하시겠습니까?')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {t('Cancel', '취소')}
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {t('Log Out', '로그아웃')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuthenticatedShell() {
  return <AppShell />;
}
