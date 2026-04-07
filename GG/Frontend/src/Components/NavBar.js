
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, createSearchParams, useLocation } from 'react-router-dom';
import { getUserChallenges } from '../Services/challengeService';
import { handleGetTeamInvitesApi } from '../Services/teamService';
import { useTranslator } from '../context/TranslatorContext';
import './NavBar.css';

const NAV_LINKS = [
  { label: 'Home', path: '/Dashboard' },
  { label: 'Games', path: '/GameSelection' },
  { label: 'Friends', path: '/FriendsList' },
  { label: 'Find Friends', path: '/FriendSearch' },
  { label: 'Calls', path: '/Videocall' },
  { label: 'Translator', path: '/Translator' },
  { label: 'User Report', path: '/UserReport' },
  { label: 'Challenges', path: '/Challenges' },
  { label: 'Teams', path: '/TeamLobby' },
  { label: 'Scheduler', path: '/Scheduler' },
  { label: 'AI Chat', path: '/Assistant' },
  { label: 'Transcripts', path: '/TranscriptView' },
  { label: 'Profile', path: '/UpdateProfile' },
];
 
// Width reserved for hamburger button when it appears
const HAMBURGER_WIDTH = 48;
 
function Navbar({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTranslator } = useTranslator();
 
  const [menuOpen, setMenuOpen]         = useState(false);
  const [visibleCount, setVisibleCount] = useState(NAV_LINKS.length);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [yourTurnChallenges, setYourTurnChallenges] = useState(0);
  const [pendingTeamInvites, setPendingTeamInvites] = useState(0);

  const navbarRef  = useRef(null);
  const rightRef   = useRef(null);
  const buttonRefs = useRef([]);
 
  const goTo = (pathname) => {
    setMenuOpen(false);
    navigate({ pathname, search: createSearchParams({ id }).toString() });
  };

    const PARENT_ROUTES = {
    '/TeamLobby': ['/TeamPage', '/TeamCreate'],
  };
 
  const isActive = (path) => {
    if (location.pathname === path) return 'nav-link active';
    const children = PARENT_ROUTES[path] || [];
    if (children.includes(location.pathname)) return 'nav-link active';
    return 'nav-link';
  };
 
  const calculate = useCallback(() => {
    const navbar = navbarRef.current;
    const right  = rightRef.current;
    if (!navbar || !right) return;
 
    // Measure actual space the links container has available
    // by using the navbar's inner width minus the right panel's full width
    const navbarInner = navbar.getBoundingClientRect().width; 
    const rightWidth  = right.getBoundingClientRect().width;  
 
    let available = navbarInner - rightWidth;
 
    // First pass: do all buttons fit without a hamburger?
    let total = 0;
    let count = 0;
    for (let i = 0; i < buttonRefs.current.length; i++) {
      const btn = buttonRefs.current[i];
      if (!btn) continue;
      const w = btn.getBoundingClientRect().width + 2; // +2 for gap between buttons
      if (total + w <= available) {
        total += w;
        count++;
      } else {
        break;
      }
    }
 
    // Second pass: if not all fit, reserve hamburger space and recalculate
    if (count < NAV_LINKS.length) {
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
    // Wait a frame so buttons are rendered and have widths
    const frame = requestAnimationFrame(calculate);
    const ro = new ResizeObserver(calculate);
    if (navbarRef.current) ro.observe(navbarRef.current);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, [calculate]);

  // Fetch pending + your-turn challenges for notification badges
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

  // Fetch pending team invites (only when user is not in a team - we show badge anyway)
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
 
  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.hamburger-wrapper')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);
 
  const hiddenLinks = NAV_LINKS.slice(visibleCount);
 
  return (
    <>
    <nav className="navbar" ref={navbarRef}>
      <div className="navbar-links">
        {NAV_LINKS.map((link, i) => (
          <button
            key={link.path}
            ref={(el) => (buttonRefs.current[i] = el)}
            className={isActive(link.path)}
            onClick={() => goTo(link.path)}
            style={{
              visibility: i < visibleCount ? 'visible' : 'hidden',
              pointerEvents: i < visibleCount ? 'auto' : 'none',
              // Keep hidden buttons in DOM so we can measure their widths
              position: i < visibleCount ? 'relative' : 'absolute',
              opacity: i < visibleCount ? 1 : 0,
            }}
          >
            {link.label}
            {link.path === '/Challenges' && (pendingChallenges > 0 || yourTurnChallenges > 0) && (
              <span className="nav-badge" aria-label={`${pendingChallenges + yourTurnChallenges} challenge${pendingChallenges + yourTurnChallenges !== 1 ? 's' : ''} need attention`}>
                {pendingChallenges + yourTurnChallenges}
              </span>
            )}
            {link.path === '/TeamLobby' && pendingTeamInvites > 0 && (
              <span className="nav-badge nav-badge-team" aria-label={`${pendingTeamInvites} team invite${pendingTeamInvites !== 1 ? 's' : ''}`}>
                {pendingTeamInvites}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="navbar-right" ref={rightRef}>
        {hiddenLinks.length > 0 && (
          <div className="hamburger-wrapper">
            <button
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
                {hiddenLinks.map((link) => (
                  <button
                    key={link.path}
                    className={`dropdown-link ${location.pathname === link.path ? 'dropdown-link-active' : ''}`}
                    onClick={() => goTo(link.path)}
                  >
                    {link.label}
                    {link.path === '/Challenges' && (pendingChallenges > 0 || yourTurnChallenges > 0) && (
                      <span className="nav-badge nav-badge-dropdown">{pendingChallenges + yourTurnChallenges}</span>
                    )}
                    {link.path === '/TeamLobby' && pendingTeamInvites > 0 && (
                      <span className="nav-badge nav-badge-dropdown">{pendingTeamInvites}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
 
        <button className="nav-translator-btn" onClick={toggleTranslator}>
          Translator
        </button>
        
      </div>
    </nav>

    </>
  );
}
 
export default Navbar;