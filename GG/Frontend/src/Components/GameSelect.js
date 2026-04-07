
import { useState, useEffect } from 'react';
import React from 'react';
import { createSearchParams, useSearchParams, useNavigate } from 'react-router-dom';
import './GameSelect.css';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import Navbar from './NavBar';
import { handleGetUserQuestsApi, handleGetTeamQuestsApi } from '../Services/questService';
import { handleGetMyTeamApi } from '../Services/teamService';
import { handleGetAllBadgesWithProgressApi } from '../Services/badgeService';
import { getUserChallenges } from '../Services/challengeService';
import { getImageUrl } from '../Services/uploadImageService';

const XP_PER_LEVEL = 500; // Must match the value in gameRoutes.js


function GameSelect() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(XP_PER_LEVEL);
  const [username, setUsername] = useState('');
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);
  const [quests, setQuests] = useState([]);
  const [badges, setBadges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 const getStats = async () => {
    try {
      const data = await handleGetUserStatsApi(id);
      setLevel(data.level);
      setXp(data.xp);
      setXpToNext(data.xpToNext);
      setUsername(data.username);
      if (data.profileImage) {
        setProfileImage(data.profileImage);
        setProfileImgError(false);
      }
    } catch (err) {
      console.log(err);
      setError('Could not load user data. Please try again.');
    }
  };
 
  const getQuests = async () => {
    try {
      const [userData, teamData] = await Promise.all([
        handleGetUserQuestsApi(id),
        handleGetMyTeamApi(id).catch(() => ({ team: null })),
      ]);
      const individualQuests = (userData.quests || []).map((q) => ({
        ...q,
        progress: q.userProgress ?? 0,
        isTeamQuest: false,
      }));
      let teamQuests = [];
      if (teamData?.team?.id) {
        try {
          const teamQuestData = await handleGetTeamQuestsApi(teamData.team.id);
          teamQuests = (teamQuestData.quests || []).map((q) => ({
            ...q,
            progress: q.teamProgress ?? 0,
            isTeamQuest: true,
          }));
        } catch {}
      }
      setQuests([...individualQuests, ...teamQuests]);
    } catch (err) {
      console.log('Could not load quests:', err);
    }
  };

  const getBadges = async () => {
    try {
      const data = await handleGetAllBadgesWithProgressApi(id);
      setBadges(data.badges || []);
    } catch (err) {
      console.log('Could not load badges:', err);
    }
  };

  const getActiveChallenges = async () => {
    try {
      const res = await getUserChallenges(id);
      const all = res?.challenges || res?.data?.challenges || [];
      const active = Array.isArray(all)
        ? all.filter((c) => ['accepted', 'in_progress'].includes(c.status))
        : [];
      setActiveChallenges(active);
    } catch (err) {
      console.log('Could not load challenges:', err);
      setActiveChallenges([]);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getStats(), getQuests(), getBadges(), getActiveChallenges()]).finally(() => setLoading(false));
  }, [id]);
 
  const getXpPercent = () => Math.min(100, Math.round((xp / xpToNext) * 100));
  const getInitial   = () => username ? username.charAt(0).toUpperCase() : '?';
 
  const gameRoutes = {
    'term-matching': '/TermMatching',
    'grammar-quiz': '/GrammarQuiz',
    'pronunciation-drill': '/PronunciationDrill',
  };

  const goToTermMatching = () => {
    navigate({ pathname: '/TermMatching', search: createSearchParams({ id }).toString() });
  };
  const goToGrammarQuiz = () => {
    navigate({ pathname: '/GrammarQuiz', search: createSearchParams({ id }).toString() });
  };
  const goToPronunciationDrill = () => {
    navigate({ pathname: '/PronunciationDrill', search: createSearchParams({ id }).toString() });
  };

  const playChallenge = (challenge) => {
    const path = gameRoutes[challenge.gameType] || '/GameSelection';
    const params = { id, challengeId: challenge.id, difficulty: challenge.difficulty || 'Beginner' };
    navigate({ pathname: path, search: createSearchParams(params).toString() });
  };

  const getOpponentName = (c) => {
    if (Number(c.challengerId) === Number(id)) {
      return c.challenged ? `${c.challenged.firstName || ''} ${c.challenged.lastName || ''}`.trim() : `User #${c.challengedId}`;
    }
    return c.challenger ? `${c.challenger.firstName || ''} ${c.challenger.lastName || ''}`.trim() : `User #${c.challengerId}`;
  };

  const gameLabel = (gt) => {
    const labels = { 'term-matching': 'Term Matching', 'grammar-quiz': 'Grammar Quiz', 'pronunciation-drill': 'Pronunciation Drill' };
    return labels[gt] || gt;
  };
 
  if (loading) return <div className="loading-state">Loading...</div>;
  if (error)   return <div className="error-state">{error}</div>;
 
  return (
    <div className="game-selection-page">
      <Navbar id={id} />
      <div className="gs-content">
      <button className="back-to-dashboard gs-back" onClick={() => navigate({ pathname: '/Dashboard', search: createSearchParams({ id }).toString() })}>Dashboard</button>

      {/* ── Profile / Level Banner ── */}
      <div className="profile-banner">
        <div className="profile-avatar">
          {profileImage && !profileImgError ? (
            <img
              src={getImageUrl(profileImage)}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={() => setProfileImgError(true)}
            />
          ) : (
            getInitial()
          )}
          </div>
 
        <div className="profile-details">
          <p className="profile-level">Level: {level}</p>
        </div>
 
        <div className="xp-bar-container">
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${getXpPercent()}%` }} />
          </div>
          <span className="xp-text">{xp}/{xpToNext}XP</span>
        </div>
      </div>
 
      {/* ── Active Challenges ── */}
      {activeChallenges.length > 0 && (
        <div className="gs-challenges-section">
          <h3 className="gs-challenges-title">Your Challenges</h3>
          <div className="gs-challenges-list">
            {activeChallenges.map((c) => (
              <div key={c.id} className="gs-challenge-card">
                <div className="gs-challenge-info">
                  <span className="gs-challenge-game">{gameLabel(c.gameType)}</span>
                  <span className="gs-challenge-opponent">vs {getOpponentName(c)}</span>
                </div>
                <button className="gs-challenge-play" onClick={() => playChallenge(c)}>
                  Play Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Games + Quests ── */}
      <div className="game-selection-body">

        {/* Left: Game buttons */}
        <div className="games-column">
          <button className="game-button" onClick={goToTermMatching}>
            Term Matching
          </button>
          <button className="game-button" onClick={goToGrammarQuiz}>
            Grammar Quiz
          </button>
          <button className="game-button" onClick={goToPronunciationDrill}>
            Pronunciation Drill
          </button>
        </div>
 
        {/* Right: Quests panel */}
        <div className="quests-panel">
          <h3 className="quests-title">Quests</h3>
 
          {quests.filter((q) => !q.completed).length === 0 ? (
            <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: 0 }}>
              {quests.length === 0 ? 'No quests available yet.' : 'All quests completed! 🎉'}
            </p>
          ) : (
            <div className="quest-list">
              {quests.filter((q) => !q.completed).map((challenge) => {
                const prog = challenge.progress ?? challenge.userProgress ?? challenge.teamProgress ?? 0;
                const pct = Math.min(100, Math.round((prog / challenge.goal) * 100));
                return (
                  <div key={challenge.id} className="quest-item">
                    <div className="quest-text">
                      <div style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 12 }}>
                        {challenge.title}
                        {challenge.isTeamQuest && <span style={{ fontSize: 9, color: '#6344A6', marginLeft: 4 }}>Team</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>
                        {challenge.description}
                      </div>
                      <div className="challenge-progress-bar-track">
                        <div
                          className="challenge-progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: '#6344A6',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 1 }}>
                        {prog}/{challenge.goal}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      {challenge.completed ? (
                        <div className="quest-done-check">✓</div>
                      ) : (
                        <input
                          type="checkbox"
                          className="quest-checkbox"
                          checked={false}
                          readOnly
                        />
                      )}
                      <span style={{ fontSize: 9, color: '#6344A6', fontWeight: 'bold' }}>
                        +{challenge.xpReward}XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
 
      </div>

      {/* ── Badge Progress Tracker ── */}
      {badges.length > 0 && (
        <div className="badges-section">
          <h3 className="badges-title">Badges</h3>
          <div className="badges-grid">
            {badges.map((badge) => {
              const pct = badge.criteriaValue > 0
                ? Math.min(100, Math.round((badge.currentProgress / badge.criteriaValue) * 100))
                : 0;
              return (
                <div
                  key={badge.id}
                  className={`badge-card ${badge.earned ? 'badge-earned' : 'badge-locked'} badge-${badge.tier}`}
                >
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.description}</div>
                  {!badge.earned && (
                    <div className="badge-progress-container">
                      <div className="badge-progress-track">
                        <div className="badge-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="badge-progress-text">
                        {badge.currentProgress}/{badge.criteriaValue}
                      </span>
                    </div>
                  )}
                  {badge.earned && (
                    <div className="badge-earned-label">Earned</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
 
export default GameSelect;