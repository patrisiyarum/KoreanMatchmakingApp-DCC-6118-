import React, { useState, useEffect } from 'react';
import './Videocall.css';
import VideoRoom from './VideoRoom';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import { updateChatPrivacy } from '../Services/privacyService';
import Navbar from './NavBar';
import axios from 'axios';
import { normalizeZoomUrl, zoomMeetingLabel } from '../Utils/zoomUtils';

function Videocall() {
  const [zoomUrl, setZoomUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  const [joined, setJoined] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(true);
  const [transcripts, setTranscripts] = useState([]);
  const [showTranscriptsModal, setShowTranscriptsModal] = useState(false);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const userId = search.get('id') || '';
  const chatId = search.get('chatId') || '';
  const zoomFromQuery = search.get('zoom');

  useEffect(() => {
    if (zoomFromQuery && zoomFromQuery.trim()) {
      try {
        const decoded = decodeURIComponent(zoomFromQuery.trim());
        if (normalizeZoomUrl(decoded)) {
          setZoomUrl(decoded);
        }
      } catch {
        /* ignore */
      }
    }
  }, [zoomFromQuery]);

  useEffect(() => {
    if (zoomFromQuery && zoomFromQuery.trim()) return;
    const stored = sessionStorage.getItem('zoomMeetingUrl');
    if (stored && normalizeZoomUrl(stored)) {
      setZoomUrl(stored);
    }
  }, [zoomFromQuery]);

  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/v1/getTranscripts/${userId}`)
      .then(res => {
        const list = res.data?.messageData || res.data || [];
        setTranscripts(Array.isArray(list) ? list : []);
      })
      .catch(() => setTranscripts([]));
  }, [userId]);

  const normalizedZoom = normalizeZoomUrl(zoomUrl);
  const urlIsValid = Boolean(normalizedZoom);
  const urlHasError = urlTouched && !urlIsValid;

  const handleUrlChange = (e) => {
    setZoomUrl(e.target.value);
  };

  const handleCopy = () => {
    if (!normalizedZoom) return;
    navigator.clipboard.writeText(normalizedZoom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinClick = () => {
    setUrlTouched(true);
    if (!urlIsValid) return;
    sessionStorage.setItem('zoomMeetingUrl', normalizedZoom);
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
        <div className={`video-call-container${joined ? ' video-call-container--in-call' : ''}`}>
          {!joined ? (
            <>
              <div className="vc-lobby">
                <div className="join-card vc-join-card-centered">
                  <h2 className="join-title">Video call (Zoom)</h2>
                  <p className="join-subtitle">
                    Create a meeting in the Zoom app or at{' '}
                    <a href="https://zoom.us/start" target="_blank" rel="noopener noreferrer">
                      zoom.us/start
                    </a>
                    , then paste the <strong>invite link</strong> below. Share the same link with your partner.
                  </p>

                  <div className="join-section">
                    <h3 className="join-section-title">Zoom invite link</h3>
                    <div className="join-form">
                      <label htmlFor="zoom-url-input" className="join-label">
                        Link or meeting ID
                      </label>
                      <Form.Control
                        id="zoom-url-input"
                        as="textarea"
                        rows={3}
                        placeholder="https://zoom.us/j/… or meeting ID (digits only)"
                        value={zoomUrl}
                        onChange={handleUrlChange}
                        onBlur={() => setUrlTouched(true)}
                      />
                      {urlHasError && (
                        <div className="join-error">
                          Enter a valid Zoom link (https://zoom.us/…) or a numeric meeting ID.
                        </div>
                      )}
                    </div>
                    {urlIsValid && (
                      <div className="join-code-display join-code-display--zoom">
                        <button type="button" className="join-copy-btn" onClick={handleCopy}>
                          {copied ? '\u2713 Copied' : 'Copy link'}
                        </button>
                      </div>
                    )}
                    <button type="button" className="btn-cta" onClick={handleJoinClick}>
                      Continue
                    </button>
                  </div>

                  <button type="button" className="back-to-dashboard vc-lobby-back" onClick={goHome}>
                    Back to dashboard
                  </button>
                </div>

                <button
                  type="button"
                  className="vc-transcripts-trigger"
                  onClick={() => setShowTranscriptsModal(true)}
                >
                  Video transcripts
                  {transcripts.length > 0 && (
                    <span className="vc-transcripts-badge">{transcripts.length}</span>
                  )}
                </button>
              </div>

              <Modal show={showTranscriptsModal} onHide={() => setShowTranscriptsModal(false)} centered size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Video transcripts</Modal.Title>
                </Modal.Header>
                <Modal.Body className="vc-transcripts-modal-body">
                  {transcripts.length === 0 ? (
                    <p className="vc-transcripts-empty">
                      No transcripts yet. Finish a recorded call to see sessions here.
                    </p>
                  ) : (
                    <div className="vc-transcripts-list">
                      {transcripts.map((t) => {
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
                              type="button"
                              className="vc-transcript-btn"
                              onClick={() => {
                                setShowTranscriptsModal(false);
                                navigate(`/Assistant?id=${userId}&chatId=${t.sessionId}`);
                              }}
                            >
                              Summarize with AI
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Modal.Body>
              </Modal>
            </>
          ) : (
            <VideoRoom
              zoomUrl={normalizedZoom}
              meetingLabel={zoomMeetingLabel(normalizedZoom)}
              initialAiAllowed={aiAllowed}
              chatId={chatId}
              currentUserId={userId}
            />
          )}

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
              <button className="btn-cta" onClick={confirmAndJoin} disabled={!urlIsValid}>
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
