import React, { useState, useEffect } from 'react';
import './Videocall.css';
import VideoRoom from './VideoRoom';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import { updateChatPrivacy } from '../Services/privacyService';
import Navbar from './NavBar';
import axios from 'axios';

// Generates a random channel name safe for Agora (alphanumeric + hyphens, no spaces)
const generateRoomCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `kr-${rand}`;
};

function Videocall() {
  const [room, setRoom] = useState('');
  const [roomTouched, setRoomTouched] = useState(false);
  const [mode, setMode] = useState(null);
  const [copied, setCopied] = useState(false);

  const [joined, setJoined] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(true);
  const [transcripts, setTranscripts] = useState([]);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const userId = search.get('id') || '';
  const chatId = search.get('chatId') || '';
  const roomFromQuery = search.get('room');

  useEffect(() => {
    if (roomFromQuery && roomFromQuery.trim()) {
      setRoom(roomFromQuery.trim());
      setMode('join');
    }
  }, [roomFromQuery]);

  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/v1/getTranscripts/${userId}`)
      .then(res => {
        const list = res.data?.messageData || res.data || [];
        setTranscripts(Array.isArray(list) ? list : []);
      })
      .catch(() => setTranscripts([]));
  }, [userId]);

  const roomIsValid = room.trim().length > 0;
  const roomHasError = roomTouched && !roomIsValid;

  const handleGenerate = () => {
    setRoom(generateRoomCode());
    setMode('create');
    setRoomTouched(false);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinInputChange = (e) => {
    setRoom(e.target.value.replace(/\s/g, ''));
    setMode('join');
  };

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
            <>
              <div className="join-card">
                <h2 className="join-title">Ready to join?</h2>

                {/* Create path */}
                <div className="join-section">
                  <h3 className="join-section-title">Start a new meeting</h3>
                  {mode === 'create' ? (
                    <>
                      <div className="join-code-display">
                        <span className="join-code-text">{room}</span>
                        <button className="join-copy-btn" onClick={handleCopy}>
                          {copied ? '\u2713 Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="join-code-hint">Share this code with others so they can join.</p>
                      <button className="btn-cta" onClick={handleJoinClick}>Start Meeting</button>
                    </>
                  ) : (
                    <button className="btn-secondary" onClick={handleGenerate}>
                      Generate a room code
                    </button>
                  )}
                </div>

                <div className="join-divider"><span>or</span></div>

                {/* Join path */}
                <div className="join-section">
                  <h3 className="join-section-title">Join an existing meeting</h3>
                  <div className="join-form">
                    <label htmlFor="room-input" className="join-label">Room code</label>
                    <Form.Control
                      id="room-input"
                      placeholder="e.g., kr-a3f9xz"
                      value={mode === 'join' ? room : ''}
                      onChange={handleJoinInputChange}
                      onBlur={() => setRoomTouched(true)}
                    />
                    {roomHasError && mode === 'join' && (
                      <div className="join-error">Please enter a room code.</div>
                    )}
                  </div>
                  <button className="btn-cta" onClick={handleJoinClick}>Join</button>
                </div>

                <button className="back-to-dashboard" onClick={goHome}>Dashboard</button>
              </div>

              <div className="vc-transcripts-panel">
                <h3 className="vc-transcripts-title">Video Transcripts</h3>
                <div className="vc-transcripts-list">
                  {transcripts.length === 0 ? (
                    <p className="vc-transcripts-empty">
                      No transcripts yet. Record a video call first to generate one.
                    </p>
                  ) : (
                    transcripts.map((t) => {
                      const ts = new Date(t.createdAt || t.created_at);
                      const dateStr = ts.toLocaleDateString();
                      const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const other = Array.isArray(t.userAccounts)
                        ? t.userAccounts.find(u => String(u.id) !== String(userId))
                        : null;
                      const withName = other
                        ? `${other.firstName} ${other.lastName}`
                        : 'Unknown';
                      return (
                        <div key={t.id} className="vc-transcript-item">
                          <div className="vc-transcript-meta">
                            <span className="vc-transcript-with">With {withName}</span>
                            <span className="vc-transcript-date">{dateStr} · {timeStr}</span>
                          </div>
                          <button
                            className="vc-transcript-btn"
                            onClick={() => navigate(`/Assistant?id=${userId}&chatId=${t.sessionId}`)}
                          >
                            Summarize with AI
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
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
              <p>Allow the app&apos;s AI to access this conversation (e.g., for summaries or assistance)?</p>
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
