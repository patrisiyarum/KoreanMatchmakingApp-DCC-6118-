import React from 'react';
import { useNavigate, createSearchParams, useLocation, useSearchParams } from 'react-router-dom';
import './GameNavbar.css';

const NAV_ITEMS = [
  { key: 'games', label: 'Games', path: '/GameSelection' },
  { key: 'challenges', label: '1v1 Challenges', path: '/Challenges' },
  { key: 'teams', label: 'Teams', path: '/TeamLobby' },
];

function GameNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search] = useSearchParams();
  const id = search.get('id');

  const activeSection = React.useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/Challenges')) return 'challenges';
    if (path.startsWith('/TeamLobby') || path.startsWith('/TeamPage') || path.startsWith('/TeamCreate')) return 'teams';
    return 'games';
  }, [location.pathname]);

  const searchString = id ? createSearchParams({ id }).toString() : '';

  return (
    <div className="gs-hub-row lm-games-hub" style={{ justifyContent: 'center', marginTop: '12px' }}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`gs-hub-btn ${activeSection === item.key ? 'gs-hub-btn-active' : 'gs-hub-btn-secondary'}`}
          onClick={() => navigate({ pathname: item.path, search: searchString })}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default GameNavbar;
