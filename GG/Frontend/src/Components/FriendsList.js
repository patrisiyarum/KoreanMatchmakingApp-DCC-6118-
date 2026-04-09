import React, { useEffect, useState } from 'react';
import './FriendsList.css';
import { useNavigate, createSearchParams, useSearchParams } from "react-router-dom";
import {
  handleGetTrueFriendsList,
  handleRemoveTrueFriend,
  handleGetFriendRequests,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
} from '../Services/userService';
import { getImageUrl } from '../Services/uploadImageService';
import Navbar from './NavBar';

function Avatar({ src, name, size = 44 }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="fl-avatar" style={{ width: size, height: size }}>
      {src ? (
        <img src={getImageUrl(src)} alt={name} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

const FriendsList = ({ embedded = false }) => {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id");

  const loadAll = async () => {
    if (!id) return;
    try {
      const [friendsPayload, requestsPayload] = await Promise.all([
        handleGetTrueFriendsList(id),
        handleGetFriendRequests(id),
      ]);
      setFriends(Array.isArray(friendsPayload?.friendsList) ? friendsPayload.friendsList : []);
      setIncomingRequests(Array.isArray(requestsPayload?.incoming) ? requestsPayload.incoming : []);
      setOutgoingRequests(Array.isArray(requestsPayload?.outgoing) ? requestsPayload.outgoing : []);
    } catch (err) {
      console.error('Failed to fetch friends/requests:', err);
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    }
  };

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRemoveFriend = async (friend) => {
    const currentUserId = Number(id);
    const targetUserId = Number(friend.id);
    setFriends(prev => prev.filter(f => f.id !== targetUserId));
    try {
      await handleRemoveTrueFriend(currentUserId, targetUserId);
    } catch (err) {
      console.error('removeTrueFriend failed:', err);
    }
  };

  const onAcceptRequest = async (requestId) => {
    try {
      await handleAcceptFriendRequest(requestId, Number(id));
      await loadAll();
    } catch (err) {
      console.error('acceptFriendRequest failed:', err);
    }
  };

  const onRejectRequest = async (requestId) => {
    try {
      await handleRejectFriendRequest(requestId, Number(id));
      await loadAll();
    } catch (err) {
      console.error('rejectFriendRequest failed:', err);
    }
  };

  const handleBack = () => {
    navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
  };

  const goDiscover = () => {
    navigate({
      pathname: '/Friends',
      search: createSearchParams({ id, friendsSub: 'discover' }).toString(),
    });
  };

  return (
    <div className={`fl-page${embedded ? ' fl-page-embedded lm-mp-page' : ''}`}>
      {!embedded && <Navbar id={id} />}
      <div className={`fl-center${embedded ? ' lm-mp-center' : ''}`}>
        <div className={`fl-card${embedded ? ' fl-card--embed-mp' : ''}`}>
          {!embedded ? (
          <div className="fl-header">
            <h2 className="fl-title">Friends</h2>
          </div>
          ) : (
            <header className="lm-mp-header">
              <h2 className="lm-mp-title">My Study Partners</h2>
              <p className="lm-mp-sub">
                {friends.length} active match{friends.length !== 1 ? 'es' : ''}
              </p>
            </header>
          )}

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div className="fl-section">
              <h3 className="fl-section-title">Requests</h3>
              <div className="fl-list">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="fl-row">
                    <Avatar
                      src={request.requesterProfileImage}
                      name={request.requesterFirstName}
                    />
                    <div className="fl-info">
                      <span className="fl-name">
                        {request.requesterFirstName} {request.requesterLastName}
                      </span>
                    </div>
                    <div className="fl-actions">
                      <button
                        className="fl-btn-accept"
                        onClick={() => onAcceptRequest(request.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="fl-btn-decline"
                        onClick={() => onRejectRequest(request.id)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <div className="fl-section">
              <h3 className="fl-section-title">Pending</h3>
              <div className="fl-list">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="fl-row">
                    <Avatar
                      src={request.recipientProfileImage}
                      name={request.recipientFirstName}
                    />
                    <div className="fl-info">
                      <span className="fl-name">
                        {request.recipientFirstName} {request.recipientLastName}
                      </span>
                    </div>
                    <span className="fl-pending">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends */}
          <div className="fl-section">
            {friends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
              embedded ? (
                <div className="lm-mp-empty lm-mp-empty--minimal">
                  <button type="button" className="lm-mp-empty-cta" onClick={goDiscover}>
                    Find partners
                  </button>
                </div>
              ) : (
                <p className="fl-empty">No friends yet. Find people to connect with!</p>
              )
            ) : friends.length === 0 ? (
              embedded ? (
                <div className="lm-mp-empty lm-mp-empty--minimal">
                  <button type="button" className="lm-mp-empty-cta" onClick={goDiscover}>
                    Find partners
                  </button>
                </div>
              ) : (
                <p className="fl-empty">No friends added yet.</p>
              )
            ) : (
              <>
                {embedded ? (
                  <p className="lm-mp-partner-hint">
                    Play games together, chat in the app, or call through Zoom from each card below.
                  </p>
                ) : null}
              <div className={`fl-list fl-list--partners${embedded ? ' lm-mp-list' : ''}`}>
                {friends.map((friend) => (
                  <div key={friend.id} className={`lm-partner-card${embedded ? ' lm-mp-card' : ''}`}>
                    <div className={`lm-partner-card-head${embedded ? ' lm-mp-card-head' : ''}`}>
                      <div className="lm-mp-card-top">
                        <Avatar src={friend.profileImage} name={friend.firstName} size={embedded ? 52 : 56} />
                        <div className="lm-mp-card-text">
                          <div className="lm-partner-name lm-mp-name">
                            {friend.firstName} {friend.lastName || ''}
                          </div>
                          {!embedded ? (
                            <div className="lm-partner-meta">Language exchange partner · 언어 교환 파트너</div>
                          ) : null}
                        </div>
                      </div>
                      {embedded ? (
                        <div className="lm-mp-pct" title="Study partner">Partner</div>
                      ) : (
                        <span className="lm-partner-match" title="Study partner">
                          Partner
                        </span>
                      )}
                    </div>
                    <div className={`lm-partner-actions lm-partner-actions--triple${embedded ? ' lm-mp-actions' : ''}`}>
                      <button
                        type="button"
                        className={`lm-partner-btn-call${embedded ? ' lm-mp-btn-call' : ''}`}
                        onClick={() =>
                          navigate({
                            pathname: '/Videocall',
                            search: createSearchParams({
                              id: String(id),
                              partnerName: `${friend.firstName} ${friend.lastName || ''}`.trim(),
                            }).toString(),
                          })
                        }
                      >
                        {embedded ? 'Call' : (
                          <>📹 Call <span className="lm-partner-btn-ko" lang="ko">통화</span></>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`lm-partner-btn-chat${embedded ? ' lm-mp-btn-chat' : ''}`}
                        onClick={() =>
                          navigate({
                            pathname: '/Chat',
                            search: createSearchParams({ senderid: String(id) }).toString(),
                          })
                        }
                      >
                        {embedded ? 'Chat' : (
                          <>💬 Chat <span className="lm-partner-btn-ko" lang="ko">채팅</span></>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`lm-partner-btn-game${embedded ? ' lm-mp-btn-game' : ''}`}
                        onClick={() =>
                          navigate({
                            pathname: '/GameSelection',
                            search: createSearchParams({ id: String(id) }).toString(),
                          })
                        }
                      >
                        {embedded ? 'Games' : (
                          <>🎮 Games <span className="lm-partner-btn-ko" lang="ko">게임</span></>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      className={`fl-btn-unfollow-mockup${embedded ? ' lm-mp-remove' : ''}`}
                      onClick={() => onRemoveFriend(friend)}
                    >
                      Remove from partners
                    </button>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>

          {!embedded ? <button className="back-to-dashboard" onClick={handleBack}>Dashboard</button> : null}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
