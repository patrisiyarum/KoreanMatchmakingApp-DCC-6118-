// TeamCreate.js
// Place in: GG/Frontend/src/Components/Team/TeamCreate.js
 
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import Navbar from './NavBar';
import { handleTeamCreateApi, handleSendTeamInviteApi } from '../Services/teamService';
import { handleGetTrueFriendsList } from '../Services/userService';
import ImageUpload from './ImageUpload';
import { handleUploadTeamImageApi, getImageUrl } from '../Services/uploadImageService';
import './Team.css';
 
const LOGO_OPTIONS = [
  '🏆','🔥','⚡','🌸','🐉','🦊','🌙','🎯',
  '🦁','🐺','🎮','🌊','🍀','🌟','🎸','🦋',
];
 
function TeamCreate() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
 
  // Step 1 — name + emoji
  const [teamName, setTeamName] = useState('');
  const [logo, setLogo]         = useState('🏆');
  const [errMsg, setErrMsg]     = useState('');
  const [loading, setLoading]   = useState(false);
 
  // Step 2 — image upload + optional invite after team is created
  const [step, setStep]             = useState(1);
  const [teamImage, setTeamImage]   = useState(null);
  const [friends, setFriends]       = useState([]);
  const [inviteFriendId, setInviteFriendId] = useState('');
  const [inviteSent, setInviteSent]  = useState(false);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const payload = await handleGetTrueFriendsList(id);
        setFriends(Array.isArray(payload?.friendsList) ? payload.friendsList : []);
      } catch {
        setFriends([]);
      }
    };
    if (id && step === 2) loadFriends();
  }, [id, step]);
 
  const handleCreate = async () => {
    setErrMsg('');
    if (!teamName.trim()) { setErrMsg('Please enter a team name.'); return; }
    setLoading(true);
    try {
      await handleTeamCreateApi(id, teamName.trim(), logo);
      // Move to image upload step instead of navigating away immediately
      setStep(2);
    } catch (err) {
      setErrMsg(err?.response?.data?.error || 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleFinish = () => {
    navigate({ pathname: '/TeamPage', search: createSearchParams({ id }).toString() });
  };
 
  const handleBack = () => {
    navigate({ pathname: '/TeamLobby', search: createSearchParams({ id }).toString() });
  };
 
  return (
    <div className="team-page-bg">
      <Navbar id={id} />
      <div className="team-center">
        <div className="team-card">
 
          {/* ── Step 1: Name + Emoji Logo ── */}
          {step === 1 && (
            <>
              <div className="team-card-logo">{logo}</div>
              <h1 className="team-card-title">Create a Team</h1>
 
              <div className="team-section">
                <label className="team-label">Team Name</label>
                <input
                  className="team-input"
                  type="text"
                  placeholder="Enter your team name..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={30}
                />
              </div>
 
              <div className="team-section">
                <label className="team-label">Choose a Logo Emoji</label>
                <div className="logo-grid">
                  {LOGO_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`logo-option ${logo === emoji ? 'logo-selected' : ''}`}
                      onClick={() => setLogo(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
 
              {errMsg && <p className="team-error">{errMsg}</p>}
 
              <div className="team-btn-row">
                <button className="team-btn-secondary" onClick={handleBack}>Back</button>
                <button className="team-btn-primary" onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creating...' : 'Next →'}
                </button>
              </div>
            </>
          )}
 
          {/* ── Step 2: Optional Image Upload ── */}
          {step === 2 && (
            <>
              <div className="team-card-logo">
                {teamImage ? (
                  <img
                    src={teamImage}
                    alt="Team"
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 14 }}
                  />
                ) : logo}
              </div>
              <h1 className="team-card-title">{teamName}</h1>
              <p className="team-card-subtitle">Team created! Add an image logo (optional).</p>
 
              <div className="team-section">
                <ImageUpload
                  currentImage={teamImage}
                  onUpload={async (file) => {
                    const result = await handleUploadTeamImageApi(id, file);
                    setTeamImage(getImageUrl(result.teamImage));
                    return result;
                  }}
                  onRemove={async () => {
                    setTeamImage(null);
                  }}
                  placeholder={logo}
                  shape="square"
                  size={90}
                  label="Team Image (optional)"
                />
              </div>

              {friends.length > 0 && (
                <div className="team-share-section" style={{ marginTop: 8 }}>
                  <p className="team-share-title">Invite a friend to your new team</p>
                  <p className="team-share-desc">They'll get a notification and can accept to join.</p>
                  <div className="team-share-friends">
                    <select
                      className="team-input"
                      value={inviteFriendId}
                      onChange={(e) => setInviteFriendId(e.target.value)}
                      style={{ minWidth: 180 }}
                    >
                      <option value="">Select a friend...</option>
                      {friends.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.firstName} {f.lastName || ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="team-share-btn"
                      disabled={!inviteFriendId || inviteSent}
                      onClick={async () => {
                        if (!inviteFriendId) return;
                        try {
                          await handleSendTeamInviteApi(id, inviteFriendId);
                          setInviteSent(true);
                          setInviteFriendId('');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      {inviteSent ? '✓ Invite sent!' : 'Send invite'}
                    </button>
                  </div>
                </div>
              )}
 
              <div className="team-btn-row">
                <button className="team-btn-secondary" onClick={handleFinish}>
                  Skip
                </button>
                <button className="team-btn-primary" onClick={handleFinish}>
                  Done →
                </button>
              </div>
            </>
          )}
 
        </div>
      </div>
    </div>
  );
}
 
export default TeamCreate;