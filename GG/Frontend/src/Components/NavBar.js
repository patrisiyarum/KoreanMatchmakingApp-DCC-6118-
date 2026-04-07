
import React, { useState, useEffect } from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import { getUserChallenges } from '../Services/challengeService';
import { handleGetTeamInvitesApi } from '../Services/teamService';
import { useTranslator } from '../context/TranslatorContext';
import './NavBar.css';

const GAMES_MENU = {
  label: 'Games',
  children: [
    { label: 'Challenges', path: '/Challenges' },
    { label: 'Teams', path: '/TeamLobby' },
  ],
};

const GAMES_RELATED_PATHS = new Set([
  '/GameSelection',
  '/Challenges',
  '/TeamLobby',
  '/TeamCreate',
  '/TeamPage',
  '/TermMatching',
  '/GrammarQuiz',
  '/PronunciationDrill',
]);

const NAV_SLOTS = [
  { type: 'simple', label: 'Home', path: '/Dashboard' },
  { type: 'games' },
  { type: 'simple', label: 'Friends', path: '/Friends' },
  { type: 'simple', label: 'Calls', path: '/Videocall' },
  { type: 'simple', label: 'Translator', path: '/Translator' },
  { type: 'simple', label: 'Scheduler', path: '/Scheduler' },
  { type: 'simple', label: 'AI Chat', path: '/Assistant' },
  { type: 'simple', label: 'Transcripts', path: '/TranscriptView' },
  { type: 'simple', label: 'Profile', path: '/UpdateProfile' },
];

const PARENT_ROUTES = {
  '/TeamLobby': ['/TeamPage', '/TeamCreate'],
};

function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTranslator } = useTranslator();

  const [gamesOpen, setGamesOpen] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [yourTurnChallenges, setYourTurnChallenges] = useState(0);
  const [pendingTeamInvites, setPendingTeamInvites] = useState(0);

  const goTo = (pathname) => {
    setGamesOpen(false);
    navigate({ pathname, search: createSearchParams({ id }).toString() });
  };

  const isGamesPathActive = () => GAMES_RELATED_PATHS.has(location.pathname);

  const isSimpleActive = (path) => {
    if (location.pathname === path) return 'nav-link active';
    const children = PARENT_ROUTES[path] || [];
    if (children.includes(location.pathname)) return 'nav-link active';
    return 'nav-link';
  };

  useEffect(() => {
    setGamesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!id) return;
    const fetchChallenges = async () => {
      try {
        const res = await getUserChallenges(id);
        const list = res?.challenges || res?.data?.challenges || [];
        if (!Array.isArray(list)) {
          setPendingChallenges(0);
          setYourTurnChallenges(0);
          return;
        }
        const pending = list.filter((c) => c.status === 'pending' && Number(c.challengedId) === Number(id)).length;
        const yourTurn = list.filter((c) => {
          if (!['accepted', 'in_progress'].includes(c.status)) return false;
          if (Number(c.challengerId) === Number(id)) return c.challengerScore === null;
          if (Number(c.challengedId) === Number(id)) return c.challengedScore === null;
          return false;
        }).length;
        setPendingChallenges(pending);
        setYourTurnChallenges(yourTurn);
      } catch {
        setPendingChallenges(0);
        setYourTurnChallenges(0);
      }
    };
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchTeamInvites = async () => {
      try {
        const res = await handleGetTeamInvitesApi(id);
        const list = res?.invites || [];
        setPendingTeamInvites(Array.isArray(list) ? list.length : 0);
      } catch {
        setPendingTeamInvites(0);
      }
    };
    fetchTeamInvites();
    const interval = setInterval(fetchTeamInvites, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!gamesOpen) return;

    let onDocMouseDown;
    const rafId = requestAnimationFrame(() => {
      onDocMouseDown = (e) => {
        if (!e.target.closest('.nav-games-wrap')) {
          setGamesOpen(false);
        }
      };
      document.addEventListener('mousedown', onDocMouseDown);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (onDocMouseDown) document.removeEventListener('mousedown', onDocMouseDown);
    };
  }, [gamesOpen]);

  const challengeAttention = pendingChallenges + yourTurnChallenges;

  const renderChallengeBadge = (dropdownVariant) => {
    if (challengeAttention <= 0) return null;
    const cls = dropdownVariant ? 'nav-badge nav-badge-dropdown' : 'nav-badge';
    return (
      <span
        className={cls}
        aria-label={`${challengeAttention} challenge${challengeAttention !== 1 ? 's' : ''} need attention`}
      >
        {challengeAttention}
      </span>
    );
  };

  const renderTeamBadge = (dropdownVariant) => {
    if (pendingTeamInvites <= 0) return null;
    const cls = dropdownVariant
      ? 'nav-badge nav-badge-dropdown nav-badge-team'
      : 'nav-badge nav-badge-team';
    return (
      <span
        className={cls}
        aria-label={`${pendingTeamInvites} team invite${pendingTeamInvites !== 1 ? 's' : ''}`}
      >
        {pendingTeamInvites}
      </span>
    );
  };

  return (
    <nav className="navbar">
      <div className="navbar-links" role="navigation" aria-label="Main">
        {NAV_SLOTS.map((slot) => {
          if (slot.type === 'simple') {
            return (
              <button
                key={slot.path}
                type="button"
                className={isSimpleActive(slot.path)}
                onClick={() => goTo(slot.path)}
              >
                {slot.label}
              </button>
            );
          }

          const gamesBtnClass = isGamesPathActive() ? 'nav-link active' : 'nav-link';
          return (
            <div key="nav-games-slot" className="nav-games-wrap">
              <div className="nav-games-split">
                <button type="button" className={gamesBtnClass} onClick={() => goTo('/GameSelection')}>
                  {GAMES_MENU.label}
                  {challengeAttention > 0 && renderChallengeBadge(false)}
                  {pendingTeamInvites > 0 && renderTeamBadge(false)}
                </button>
                <button
                  type="button"
                  className={`${gamesBtnClass} nav-games-caret-btn`}
                  aria-expanded={gamesOpen}
                  aria-haspopup="true"
                  aria-label="Open challenges and teams menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGamesOpen((o) => !o);
                  }}
                >
                  <span className="nav-games-chevron-only" aria-hidden>
                    ▾
                  </span>
                </button>
              </div>
              {gamesOpen && (
                <div className="nav-games-dropdown" role="menu">
                  {GAMES_MENU.children.map((ch) => (
                    <button
                      key={ch.path}
                      type="button"
                      role="menuitem"
                      className={`nav-games-dropdown-link${location.pathname === ch.path ? ' nav-games-dropdown-link-active' : ''}`}
                      onClick={() => goTo(ch.path)}
                    >
                      {ch.label}
                      {ch.path === '/Challenges' && renderChallengeBadge(true)}
                      {ch.path === '/TeamLobby' && renderTeamBadge(true)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="navbar-right">
        <button type="button" className="nav-translator-btn" onClick={toggleTranslator}>
          Translator
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
