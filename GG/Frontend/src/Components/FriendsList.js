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

const FriendsList = () => {
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

  return (
    <div className="fl-page">
      <Navbar id={id} />
      <div className="fl-center">
        <div className="fl-card">
          <div className="fl-header">
            <h2 className="fl-title">Friends</h2>
          </div>

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
              <p className="fl-empty">No friends yet. Find people to connect with!</p>
            ) : friends.length === 0 ? (
              <p className="fl-empty">No friends added yet.</p>
            ) : (
              <div className="fl-list">
                {friends.map(friend => (
                  <div key={friend.id} className="fl-row">
                    <Avatar
                      src={friend.profileImage}
                      name={friend.firstName}
                    />
                    <div className="fl-info">
                      <span className="fl-name">{friend.firstName} {friend.lastName}</span>
                    </div>
                    <button
                      className="fl-btn-following"
                      onClick={() => onRemoveFriend(friend)}
                    >
                      Following
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="back-to-dashboard" onClick={handleBack}>Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
