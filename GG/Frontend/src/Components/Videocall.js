import React, { useState, useEffect } from 'react';
import './Videocall.css';
import VideoRoom from './VideoRoom';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import { updateChatPrivacy } from '../Services/privacyService';
import Navbar from './NavBar';

function Videocall() {
  const [room, setRoom] = useState('matchmaking');
  const [roomTouched, setRoomTouched] = useState(false);

  const [joined, setJoined] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(true);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const userId = search.get('id') || '';
  const chatId = search.get('chatId') || '';
  const roomFromQuery = search.get('room');

  useEffect(() => {
    if (roomFromQuery && roomFromQuery.trim()) {
      setRoom(roomFromQuery.trim());
    }
  }, [roomFromQuery]);

  const roomIsValid = room.trim().length > 0;
  const roomHasError = roomTouched && !roomIsValid;

  const handleJoinClick = () => {
    setRoomTouched(true);
    if (!roomIsValid) return;
    setShowPrivacyModal(true);
  };

  const goHome = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id: userId }).toString(),
    });
  };

  const confirmAndJoin = async () => {
    try {
      if (chatId) {
        await updateChatPrivacy(chatId, userId, aiAllowed);
      }
    } catch (err) {
      console.error('Failed to update chat privacy before join:', err);
    } finally {
      setShowPrivacyModal(false);
      setJoined(true);
    }
  };

  return (
    <div className="vc-page">
      {!joined && <Navbar id={userId} />}
      <div className="vc-center">
        <div className="video-call-container">
          {!joined ? (
            <div className="join-card">
              <h2 className="join-title">Ready to join?</h2>
              <p className="join-subtitle">
                Enter a meeting code or create your own. You’ll confirm AI access before joining.
              </p>

              <div className="join-form">
                <label htmlFor="room-input" className="join-label">Meeting code</label>
                <Form.Control
                  id="room-input"
                  placeholder="e.g., spanish-101 or A3F9XZ"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  onBlur={() => setRoomTouched(true)}
                />
                {roomHasError && (
                  <div className="join-error">Please enter a room name or code.</div>
                )}
              </div>

              <div className="join-actions">
                <button className="btn-cta" onClick={handleJoinClick}>Join</button>
                <button className="back-to-dashboard" onClick={goHome}>Dashboard</button>
              </div>
            </div>
          ) : (
            <VideoRoom
              room={room}
              initialAiAllowed={aiAllowed}
              chatId={chatId}
              currentUserId={userId}
            />
          )}

          {/* Pre-join AI privacy modal */}
          <Modal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>AI access for this video call</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Allow the app’s AI to access this conversation (e.g., for summaries or assistance)?</p>
              <Form.Check
                type="switch"
                id="ai-access-switch"
                label={aiAllowed ? 'Allowed' : 'Denied'}
                checked={aiAllowed}
                onChange={(e) => setAiAllowed(e.target.checked)}
              />
              <small>Your choice applies only to this conversation. You can change it during the call.</small>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn-cta" onClick={confirmAndJoin} disabled={!roomIsValid}>
                Join
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Videocall;
