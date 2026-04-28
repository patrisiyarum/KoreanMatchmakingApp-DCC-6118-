import { Link } from 'react-router';
import { ChevronRight, Gamepad2, PhoneCall, Search, UserRound, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function DashboardHome() {
  const { t } = useLanguage();
  const cards = [
    {
      to: '/view-profile',
      title: t('Your profile', '내 프로필'),
      sub: t(
        'Customize your profile, languages, interests, bio, and photo',
        '프로필 맞춤 설정 · 언어 · 관심사 · 소개 · 사진'
      ),
      icon: UserRound,
    },
    {
      to: '/discover',
      title: t('Discover partners', '파트너 찾기'),
      sub: t('Swipe and match', '스와이프로 매칭'),
      icon: Search,
    },
    {
      to: '/partners',
      title: t('My friends', '내 친구'),
      sub: t('Chat and play games', '채팅 · 게임'),
      icon: Users,
    },
    {
      to: '/schedule',
      title: t('Calls & meetings', '통화 · 미팅'),
      sub: t('Availability, scheduling, and call links in one place', '가능 시간 · 예약 · 통화 링크를 한 곳에서 관리'),
      icon: PhoneCall,
    },
    {
      to: '/games',
      title: t('Games', '게임'),
      sub: t('Practice, XP, badges, and challenges', '연습 · XP · 배지 · 도전'),
      icon: Gamepad2,
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
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <Link
              key={`${c.to}-${c.title}-${idx}`}
              to={c.to}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                {Icon ? (
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900">{c.title}</div>
                  <div className="text-sm text-neutral-500">{c.sub}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
