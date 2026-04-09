import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from './NavBar';
import FriendsList from './FriendsList';
import FriendSearch from './FriendSearch';
import './FriendsPage.css';

const FriendsPage = () => {
  const [search] = useSearchParams();
  const id = search.get('id');
  const sub = search.get('friendsSub') === 'discover' ? 'discover' : 'list';

  return (
    <div className="friends-page">
      <Navbar id={id} />
      <div className="friends-page-inner friends-page-inner--notabs">
        <div className="friends-page-panel" role="main">
          {sub === 'list' ? <FriendsList embedded /> : <FriendSearch embedded />}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
