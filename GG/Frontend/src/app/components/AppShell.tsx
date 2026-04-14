import { Outlet, Link, useLocation, useNavigate } from 'react-router';
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

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { setIsTranslatorOpen } = useTranslator();
  const { setIsAssistantOpen } = useAIAssistant();
  const { logout } = useAuth();

  const navItems = [
    { path: '/home', icon: Home, label: t('Home', '홈') },
    { path: '/discover', icon: Search, label: t('Discover', '발견') },
    { path: '/partners', icon: MessageSquare, label: t('Partners', '파트너') },
    { path: '/schedule', icon: Calendar, label: t('Schedule', '일정') },
    { path: '/games', icon: Gamepad2, label: t('Games', '게임') },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-neutral-50">
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {location.pathname !== '/home' ? (
              <Link
                to="/home"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('Back to Home', '홈으로 돌아가기')}</span>
              </Link>
            ) : null}
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
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {language === 'en' ? '한국어' : 'English'}
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
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
                <Icon className="w-5 h-5 shrink-0" />
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
    </div>
  );
}

export function AuthenticatedShell() {
  return <AppShell />;
}
