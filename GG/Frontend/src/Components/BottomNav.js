import React, { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, createSearchParams } from 'react-router-dom';
import './BottomNav.css';

const TABS = [
  {
    key: 'home',
    labelEn: 'Home',
    labelKo: '홈',
    path: '/Dashboard',
    match: (pathname) => pathname === '/Dashboard',
  },
  {
    key: 'discover',
    labelEn: 'Discover',
    labelKo: '찾기',
    path: '/Friends',
    match: (pathname, friendsSub) => pathname === '/Friends' && friendsSub === 'discover',
    searchExtras: { friendsSub: 'discover' },
  },
  {
    key: 'partners',
    labelEn: 'Partners',
    labelKo: '파트너',
    path: '/Friends',
    match: (pathname, friendsSub) =>
      (pathname === '/Friends' && friendsSub !== 'discover') || pathname === '/Chat',
    searchExtras: {},
  },
  {
    key: 'games',
    labelEn: 'Games',
    labelKo: '게임',
    path: '/GameSelection',
    match: (pathname) =>
      pathname === '/GameSelection' ||
      pathname.startsWith('/TermMatching') ||
      pathname.startsWith('/GrammarQuiz') ||
      pathname.startsWith('/PronunciationDrill') ||
      pathname.startsWith('/Challenges') ||
      pathname.startsWith('/TeamLobby') ||
      pathname.startsWith('/TeamPage') ||
      pathname.startsWith('/TeamCreate'),
  },
];

export default function BottomNav({ userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search] = useSearchParams();
  const id = userId ?? search.get('id');
  const friendsSub = search.get('friendsSub') || '';

  useEffect(() => {
    if (!id) return undefined;
    document.body.classList.add('lm-has-bottom-nav');
    return () => document.body.classList.remove('lm-has-bottom-nav');
  }, [id]);

  if (!id) return null;

  const go = (tab) => {
    const params = { id: String(id) };
    if (tab.searchExtras) {
      Object.assign(params, tab.searchExtras);
    }
    navigate({
      pathname: tab.path,
      search: createSearchParams(params).toString(),
    });
  };

  return (
    <nav className="lm-bottom-nav" aria-label="Primary">
      {TABS.map((tab) => {
        const active = tab.match(location.pathname, friendsSub);
        return (
          <button
            key={tab.key}
            type="button"
            className={`lm-bottom-nav-item${active ? ' lm-bottom-nav-item--active' : ''}`}
            onClick={() => go(tab)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="lm-bottom-nav-icon" aria-hidden>
              {tab.key === 'home' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
                </svg>
              )}
              {tab.key === 'discover' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              )}
              {tab.key === 'partners' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8.5z" />
                </svg>
              )}
              {tab.key === 'games' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="3" />
                  <path d="M6 12h2M16 12h2M12 8v8" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <span className="lm-bottom-nav-label">
              <span className="lm-bottom-nav-label-en">{tab.labelEn}</span>
              <span className="lm-bottom-nav-label-ko" lang="ko">
                {tab.labelKo}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
