import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import { getUserChallenges } from '../Services/challengeService';
import { handleGetTeamInvitesApi } from '../Services/teamService';
import { useTranslator } from '../context/TranslatorContext';
import './NavBar.css';

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

const AI_NAV_LINKS = [
  { label: 'Chat Assistant', path: '/Assistant' },
  { label: 'Transcripts', path: '/TranscriptView' },
];

const AI_SECTION_PATHS = new Set(AI_NAV_LINKS.map((l) => l.path));

const NAV_SLOTS = [
  { type: 'simple', label: 'Home', path: '/Dashboard' },
  { type: 'games' },
  { type: 'simple', label: 'Friends', path: '/Friends' },
  { type: 'simple', label: 'Calls', path: '/Videocall' },
  { type: 'simple', label: 'Translator', path: '/Translator' },
  { type: 'simple', label: 'Scheduler', path: '/Scheduler' },
  { type: 'ai' },
  { type: 'simple', label: 'Profile', path: '/ViewProfile' },
];

const PARENT_ROUTES = {
  '/TeamLobby': ['/TeamPage', '/TeamCreate'],
};

function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTranslator } = useTranslator();
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiMenuPos, setAiMenuPos] = useState({ top: 0, left: 0 });
  const aiNavWrapRef = useRef(null);
  const aiButtonRef = useRef(null);
  const aiDropdownRef = useRef(null);

  const updateAiMenuPosition = useCallback(() => {
    const el = aiButtonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAiMenuPos({ top: r.bottom + 8, left: r.left });
  }, []);

  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [yourTurnChallenges, setYourTurnChallenges] = useState(0);
  const [pendingTeamInvites, setPendingTeamInvites] = useState(0);

  const hrefFor = useMemo(() => {
    const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
    return (pathname) => {
      const path = `${base}${pathname}`;
      if (id == null || id === '') return path;
      return `${path}?${createSearchParams({ id: String(id) }).toString()}`;
    };
  }, [id]);

  const goTo = (pathname) => {
    navigate({ pathname, search: createSearchParams({ id }).toString() });
  };

  const isGamesPathActive = () => GAMES_RELATED_PATHS.has(location.pathname);

  const isAiSectionActive = () => AI_SECTION_PATHS.has(location.pathname);

  useLayoutEffect(() => {
    if (!aiMenuOpen) return;
    updateAiMenuPosition();
  }, [aiMenuOpen, updateAiMenuPosition]);

  useEffect(() => {
    if (!aiMenuOpen) return;
    const onDocMouseDown = (e) => {
      const t = e.target;
      if (aiNavWrapRef.current?.contains(t)) return;
      if (aiDropdownRef.current?.contains(t)) return;
      setAiMenuOpen(false);
    };
    const onReposition = () => updateAiMenuPosition();
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [aiMenuOpen, updateAiMenuPosition]);

  const simpleBtnClass = (path) => {
    let active = location.pathname === path;
    if (!active) {
      const children = PARENT_ROUTES[path] || [];
      active = children.includes(location.pathname);
    }
    return active ? 'top-nav-btn top-nav-btn--active' : 'top-nav-btn';
  };

  const gamesBtnClass = isGamesPathActive() ? 'top-nav-btn top-nav-btn--active' : 'top-nav-btn';

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

  const challengeAttention = pendingChallenges + yourTurnChallenges;

  const renderChallengeBadge = () => {
    if (challengeAttention <= 0) return null;
    return (
      <span
        className="nav-badge"
        aria-label={`${challengeAttention} challenge${challengeAttention !== 1 ? 's' : ''} need attention`}
      >
        {challengeAttention}
      </span>
    );
  };

  const renderTeamBadge = () => {
    if (pendingTeamInvites <= 0) return null;
    return (
      <span
        className="nav-badge nav-badge-team"
        aria-label={`${pendingTeamInvites} team invite${pendingTeamInvites !== 1 ? 's' : ''}`}
      >
        {pendingTeamInvites}
      </span>
    );
  };

  return (
    <nav className="app-top-nav">
      <div className="app-top-nav-links" role="navigation" aria-label="Main">
        {NAV_SLOTS.map((slot) => {
          if (slot.type === 'simple') {
            return (
              <button
                key={slot.path}
                type="button"
                className={simpleBtnClass(slot.path)}
                onClick={() => goTo(slot.path)}
              >
                {slot.label}
              </button>
            );
          }

          if (slot.type === 'ai') {
            return (
              <div key="nav-ai" className="nav-ai-wrap" ref={aiNavWrapRef}>
                <button
                  ref={aiButtonRef}
                  type="button"
                  className={isAiSectionActive() ? 'top-nav-btn top-nav-btn--active' : 'top-nav-btn'}
                  aria-expanded={aiMenuOpen}
                  aria-haspopup="true"
                  aria-label="AI tools menu"
                  onClick={() => setAiMenuOpen((o) => !o)}
                >
                  AI
                  <span className="nav-ai-chevron" aria-hidden>
                    ▾
                  </span>
                </button>
                {aiMenuOpen
                  ? createPortal(
                      <div
                        ref={aiDropdownRef}
                        className="navbar-dropdown nav-ai-dropdown nav-ai-dropdown-portal"
                        style={{ top: aiMenuPos.top, left: aiMenuPos.left }}
                        role="menu"
                      >
                        {AI_NAV_LINKS.map((item) => (
                          <button
                            key={item.path}
                            type="button"
                            role="menuitem"
                            className={`dropdown-link${location.pathname === item.path ? ' dropdown-link-active' : ''}`}
                            onClick={() => {
                              setAiMenuOpen(false);
                              goTo(item.path);
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )
                  : null}
              </div>
            );
          }

          return (
            <a
              key="nav-games"
              href={hrefFor('/GameSelection')}
              className={gamesBtnClass}
            >
              Games
              {renderChallengeBadge()}
              {renderTeamBadge()}
            </a>
          );
        })}
      </div>

      <div className="app-top-nav-right">
        <button type="button" className="nav-translator-btn" onClick={toggleTranslator}>
          Translator
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
