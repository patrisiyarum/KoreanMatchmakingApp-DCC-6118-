import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from './NavBar';
import FriendsList from './FriendsList';
import FriendSearch from './FriendSearch';
import './FriendsPage.css';

const FriendsPage = () => {
  const [search, setSearch] = useSearchParams();
  const id = search.get('id');
  const sub = search.get('friendsSub') === 'discover' ? 'discover' : 'list';

  const setSub = (next) => {
    const p = new URLSearchParams(search);
    if (!id) return;
    p.set('id', id);
    if (next === 'discover') {
      p.set('friendsSub', 'discover');
    } else {
      p.delete('friendsSub');
    }
    setSearch(p, { replace: true });
  };

  return (
    <div className="friends-page">
      <Navbar id={id} />
      <div className="friends-page-inner">
        <div className="friends-page-tabs" role="tablist" aria-label="Friends sections">
          <button
            type="button"
            role="tab"
            aria-selected={sub === 'list'}
            className={`friends-page-tab${sub === 'list' ? ' friends-page-tab-active' : ''}`}
            onClick={() => setSub('list')}
          >
            My friends
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sub === 'discover'}
            className={`friends-page-tab${sub === 'discover' ? ' friends-page-tab-active' : ''}`}
            onClick={() => setSub('discover')}
          >
            Discover
          </button>
        </div>
        <div className="friends-page-panel" role="tabpanel">
          {sub === 'list' ? <FriendsList embedded /> : <FriendSearch embedded />}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
