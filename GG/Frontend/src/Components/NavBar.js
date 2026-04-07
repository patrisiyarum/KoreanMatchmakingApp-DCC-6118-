
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import { getUserChallenges } from '../Services/challengeService';
import { handleGetTeamInvitesApi } from '../Services/teamService';
import { useTranslator } from '../context/TranslatorContext';
import './NavBar.css';

const GAMES_MENU = {
  label: 'Games',
  children: [
    { label: 'Browse games', path: '/GameSelection' },
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

const HAMBURGER_WIDTH = 48;

const PARENT_ROUTES = {
  '/TeamLobby': ['/TeamPage', '/TeamCreate'],
};

function slotToMenuEntries(slot) {
  if (slot.type === 'simple') return [{ kind: 'link', ...slot }];
  if (slot.type === 'games') {
    return GAMES_MENU.children.map((ch) => ({ kind: 'link', ...ch, fromGamesMenu: true }));
  }
  return [];
}

function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTranslator } = useTranslator();

  const [menuOpen, setMenuOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(NAV_SLOTS.length);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [yourTurnChallenges, setYourTurnChallenges] = useState(0);
  const [pendingTeamInvites, setPendingTeamInvites] = useState(0);

  const navbarRef = useRef(null);
  const rightRef = useRef(null);
  const buttonRefs = useRef([]);

  const goTo = (pathname) => {
    setMenuOpen(false);
    setGamesOpen(false);
    navigate({ pathname, search: createSearchParams({ id }).toString() });
  };

  const isGamesPathActive = () => {
    if (GAMES_RELATED_PATHS.has(location.pathname)) return true;
    return false;
  };

  const isSimpleActive = (path) => {
    if (location.pathname === path) return 'nav-link active';
    const children = PARENT_ROUTES[path] || [];
    if (children.includes(location.pathname)) return 'nav-link active';
    return 'nav-link';
  };

  useEffect(() => {
    setGamesOpen(false);
  }, [location.pathname]);

  const calculate = useCallback(() => {
    const navbar = navbarRef.current;
    const right = rightRef.current;
    if (!navbar || !right) return;

    const navbarInner = navbar.getBoundingClientRect().width;
    const rightWidth = right.getBoundingClientRect().width;

    let available = navbarInner - rightWidth;

    let total = 0;
    let count = 0;
    for (let i = 0; i < buttonRefs.current.length; i++) {
      const btn = buttonRefs.current[i];
      if (!btn) continue;
      const w = btn.getBoundingClientRect().width + 2;
      if (total + w <= available) {
        total += w;
        count++;
      } else {
        break;
      }
    }

    if (count < NAV_SLOTS.length) {
      available -= HAMBURGER_WIDTH + 8;
      total = 0;
      count = 0;
      for (let i = 0; i < buttonRefs.current.length; i++) {
        const btn = buttonRefs.current[i];
        if (!btn) continue;
        const w = btn.getBoundingClientRect().width + 2;
        if (total + w <= available) {
          total += w;
          count++;
        } else {
          break;
        }
      }
    }

    setVisibleCount(count);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(calculate);
    const ro = new ResizeObserver(calculate);
    if (navbarRef.current) ro.observe(navbarRef.current);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [calculate]);

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
    if (!menuOpen && !gamesOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.hamburger-wrapper')) setMenuOpen(false);
      if (!e.target.closest('.nav-games-wrap')) setGamesOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen, gamesOpen]);

  const hiddenSlots = NAV_SLOTS.slice(visibleCount);
  const hiddenEntries = hiddenSlots.flatMap(slotToMenuEntries);

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
    <>
      <nav className="navbar" ref={navbarRef}>
        <div className="navbar-links">
          {NAV_SLOTS.map((slot, i) => {
            const visible = i < visibleCount;
            const hideStyle = {
              visibility: visible ? 'visible' : 'hidden',
              pointerEvents: visible ? 'auto' : 'none',
              position: visible ? 'relative' : 'absolute',
              opacity: visible ? 1 : 0,
            };

            if (slot.type === 'simple') {
              return (
                <button
                  key={slot.path}
                  ref={(el) => {
                    buttonRefs.current[i] = el;
                  }}
                  type="button"
                  className={isSimpleActive(slot.path)}
                  onClick={() => goTo(slot.path)}
                  style={hideStyle}
                >
                  {slot.label}
                </button>
              );
            }

            const gamesBtnClass = isGamesPathActive() ? 'nav-link active' : 'nav-link';
            return (
              <div
                key="nav-games-slot"
                ref={(el) => {
                  buttonRefs.current[i] = el;
                }}
                className="nav-games-wrap"
                style={hideStyle}
              >
                <button
                  type="button"
                  className={gamesBtnClass}
                  aria-expanded={gamesOpen}
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGamesOpen((o) => !o);
                  }}
                >
                  {GAMES_MENU.label}
                  {challengeAttention > 0 && renderChallengeBadge(false)}
                  {pendingTeamInvites > 0 && renderTeamBadge(false)}
                  <span className="nav-games-chevron" aria-hidden>
                    ▾
                  </span>
                </button>
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

        <div className="navbar-right" ref={rightRef}>
          {hiddenEntries.length > 0 && (
            <div className="hamburger-wrapper">
              <button
                type="button"
                className={`navbar-hamburger ${menuOpen ? 'hamburger-open' : ''}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <span className="hamburger-bar" />
                <span className="hamburger-bar" />
                <span className="hamburger-bar" />
              </button>

              {menuOpen && (
                <div className="navbar-dropdown">
                  {hiddenEntries.map((entry) => (
                    <button
                      key={`${entry.path}-${entry.fromGamesMenu ? 'g' : 'n'}`}
                      type="button"
                      className={`dropdown-link ${location.pathname === entry.path ? 'dropdown-link-active' : ''}`}
                      onClick={() => goTo(entry.path)}
                    >
                      {entry.fromGamesMenu ? `${GAMES_MENU.label}: ${entry.label}` : entry.label}
                      {entry.path === '/Challenges' && renderChallengeBadge(true)}
                      {entry.path === '/TeamLobby' && renderTeamBadge(true)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" className="nav-translator-btn" onClick={toggleTranslator}>
            Translator
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
