import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Search, Gamepad2, MessageSquare, Calendar, Languages, Bot, LogOut, UserCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslator } from '../context/TranslatorContext';
import { useAIAssistant } from '../context/AIAssistantContext';
import { useAuth } from '../context/AuthContext';
import { AIAssistant } from './AIAssistant';
import { Translator } from './Translator';

type AppShellProps = {
  guestMode?: boolean;
};

export function AppShell({ guestMode = false }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { setIsTranslatorOpen } = useTranslator();
  const { setIsAssistantOpen } = useAIAssistant();
  const { logout } = useAuth();

  const navItems = [
    { path: '/home', guestPath: '/welcome', icon: Home, label: t('Home', '홈') },
    { path: '/discover', guestPath: '/login', icon: Search, label: t('Discover', '발견') },
    { path: '/partners', guestPath: '/login', icon: MessageSquare, label: t('Partners', '파트너') },
    { path: '/schedule', guestPath: '/login', icon: Calendar, label: t('Schedule', '일정') },
    { path: '/games', guestPath: '/login', icon: Gamepad2, label: t('Games', '게임') },
  ];

  const linkTarget = (path: string, guestPath: string) => (guestMode ? guestPath : path);

  return (
    <div className="size-full flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              LangMatch <span className="text-blue-600">언어교환</span>
            </h1>
            <p className="text-sm text-neutral-600">
              {t('Find your perfect study partner', '완벽한 스터디 파트너 찾기')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTranslatorOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('Translator', '번역기')}
            >
              <Languages className="w-5 h-5 text-neutral-700" />
            </button>
            {!guestMode && (
              <>
                <Link
                  to="/profile"
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  title={t('My profile', '내 프로필')}
                >
                  <UserCircle className="w-5 h-5 text-neutral-700" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsAssistantOpen(true)}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  title={t('AI Assistant', 'AI 도우미')}
                >
                  <Bot className="w-5 h-5 text-neutral-700" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {language === 'en' ? '한국어' : 'English'}
            </button>
            {!guestMode && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/welcome');
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                title={t('Log out', '로그아웃')}
              >
                <LogOut className="w-5 h-5 text-neutral-700" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="border-t border-neutral-200 bg-white">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const to = linkTarget(item.path, item.guestPath);
            const isActive = guestMode
              ? item.path === '/home'
                ? location.pathname === '/welcome'
                : false
              : item.path === '/partners'
                ? location.pathname === '/partners' || location.pathname.startsWith('/chat')
                : location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={`${item.path}-${item.label}`}
                to={to}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AIAssistant />
      <Translator />
    </div>
  );
}

/** Logged-in routes: full header (AI + logout). */
export function AuthenticatedShell() {
  return <AppShell guestMode={false} />;
}

/** Public welcome: same chrome; other tabs go to login; AI button hidden to match onboarding refs. */
export function GuestShell() {
  return <AppShell guestMode />;
}
