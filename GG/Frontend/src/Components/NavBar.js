import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import { getUserChallenges } from '../Services/challengeService';
import { handleGetTeamInvitesApi } from '../Services/teamService';
import { useTranslator } from '../context/TranslatorContext';
import { useAssistant } from '../context/AssistantContext';
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


const NAV_SLOTS = [
  { type: 'simple', label: 'Home', path: '/Dashboard' },
  { type: 'games' },
  { type: 'simple', label: 'Friends', path: '/Friends' },
  { type: 'simple', label: 'Scheduler', path: '/Scheduler' },
  { type: 'simple', label: 'Calls', path: '/Videocall' },
  { type: 'simple', label: 'Profile', path: '/ViewProfile' },
];

const PARENT_ROUTES = {
  '/TeamLobby': ['/TeamPage', '/TeamCreate'],
};

function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTranslator } = useTranslator();
  const { toggleAssistant } = useAssistant();

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
        <button type="button" className="nav-assistant-btn" onClick={() => toggleAssistant(id)}>
          Ask AI
        </button>
        <button type="button" className="nav-translator-btn" onClick={toggleTranslator}>
          Translator
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
