import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function DashboardHome() {
  const { t } = useLanguage();
  const cards = [
    {
      to: '/profile',
      title: t('Your profile', '내 프로필'),
      sub: t(
        'Languages, interests, bio, and photo for Discover',
        '디스커버용 언어 · 관심사 · 소개 · 사진'
      ),
    },
    {
      to: '/discover',
      title: t('Discover partners', '파트너 찾기'),
      sub: t('Swipe and match', '스와이프로 매칭'),
    },
    {
      to: '/partners',
      title: t('My partners', '내 파트너'),
      sub: t('Chat and play games', '채팅 · 게임'),
    },
    {
      to: '/schedule',
      title: t('Schedule', '일정'),
      sub: t('Availability & meetings', '가능 시간 · 미팅'),
    },
    {
      to: '/games',
      title: t('Games', '게임'),
      sub: t('Practice & challenges', '연습 · 도전'),
    },
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">
        {t('Welcome back', '다시 오신 것을 환영합니다')}
      </h1>
      <p className="text-sm text-neutral-600 mb-6">
        {t('Pick a tab below or jump in here.', '아래에서 시작하세요.')}
      </p>
      <div className="space-y-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm hover:border-blue-200 transition-colors"
          >
            <div>
              <div className="font-semibold text-neutral-900">{c.title}</div>
              <div className="text-sm text-neutral-500">{c.sub}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
