import { Outlet, Link, useLocation } from 'react-router';
import { Home, Users, Gamepad2, MessageSquare, Calendar, Languages, Bot } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslator } from '../context/TranslatorContext';
import { useAIAssistant } from '../context/AIAssistantContext';
import { AIAssistant } from './AIAssistant';
import { Translator } from './Translator';

export function Layout() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { setIsTranslatorOpen } = useTranslator();
  const { setIsAssistantOpen } = useAIAssistant();

  const navItems = [
    { path: '/', icon: Home, label: t('Home', '홈') },
    { path: '/discover', icon: Users, label: t('Discover', '발견') },
    { path: '/partners', icon: MessageSquare, label: t('Partners', '파트너') },
    { path: '/schedule', icon: Calendar, label: t('Schedule', '일정') },
    { path: '/games', icon: Gamepad2, label: t('Games', '게임') },
  ];

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
              onClick={() => setIsTranslatorOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('Translator', '번역기')}
            >
              <Languages className="w-5 h-5 text-neutral-700" />
            </button>
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title={t('AI Assistant', 'AI 도우미')}
            >
              <Bot className="w-5 h-5 text-neutral-700" />
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {language === 'en' ? '한국어' : 'English'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="border-t border-neutral-200 bg-white">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-neutral-600 hover:text-neutral-900'
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
