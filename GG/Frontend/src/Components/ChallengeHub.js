import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import {
  getUserChallenges,
  acceptChallenge,
  declineChallenge,
  createChallenge,
  getChallengeStats,
  getChallengeFriends,
} from '../Services/challengeService';
import Navbar from './NavBar';
import './ChallengeHub.css';

function ChallengeHub() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [gameType, setGameType] = useState('term-matching');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [friends, setFriends] = useState([]);

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [challengeData, statsData] = await Promise.all([
        getUserChallenges(id),
        getChallengeStats(id),
      ]);
      setChallenges(challengeData.challenges || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await getChallengeFriends(id);
      setFriends(Array.isArray(res.friends) ? res.friends : []);
    } catch (err) {
      console.error('Could not load friends:', err);
      setFriends([]);
    }
  };

  const handleBackToDashboard = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id }).toString(),
    });
  };

  // Poll so both players see status updates without refreshing.
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      await loadData();
    };
    loadData(true);
    const t = setInterval(tick, 5000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async (challengeId) => {
    try {
      await acceptChallenge(challengeId);
      loadData();
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleDecline = async (challengeId) => {
    try {
      await declineChallenge(challengeId);
      loadData();
    } catch (err) {
      console.error('Failed to decline:', err);
    }
  };

  const handleCreate = async () => {
    if (!friendId) return;
    try {
      await createChallenge(Number(id), Number(friendId), gameType, difficulty);
      setShowCreate(false);
      setFriendId('');
      loadData();
    } catch (err) {
      console.error('Failed to create challenge:', err);
    }
  };

  const getFriendOptionLabel = (friend) => {
    if (friend.label) return friend.label;
    const name = `${friend.firstName || ''} ${friend.lastName || ''}`.trim();
    return name || `User #${friend.id}`;
  };

  const handlePlayChallenge = (challenge) => {
    const gameRoutes = {
      'term-matching': '/TermMatching',
      'grammar-quiz': '/GrammarQuiz',
      'pronunciation-drill': '/PronunciationDrill',
    };
    const path = gameRoutes[challenge.gameType] || '/GameSelection';
    navigate(`${path}?id=${id}&challengeId=${challenge.id}&difficulty=${challenge.difficulty}`);
  };

  // Determine if it is the current user's turn in an active challenge
  const isMyTurn = (c) => {
    if (Number(c.challengerId) === Number(id)) return c.challengerScore === null;
    if (Number(c.challengedId) === Number(id)) return c.challengedScore === null;
    return false;
  };

  const filtered = challenges.filter(c => {
    if (tab === 'active') return ['accepted', 'in_progress'].includes(c.status);
    if (tab === 'pending') return c.status === 'pending';
    if (tab === 'completed') return c.status === 'completed';
    return true;
  });

  const getOpponentName = (c) => {
    if (Number(c.challengerId) === Number(id)) {
      return c.challenged ? `${c.challenged.firstName} ${c.challenged.lastName || ''}`.trim() : `User #${c.challengedId}`;
    }
    return c.challenger ? `${c.challenger.firstName} ${c.challenger.lastName || ''}`.trim() : `User #${c.challengerId}`;
  };

  const gameLabel = (gt) => {
    const labels = { 'term-matching': 'Term Matching', 'grammar-quiz': 'Grammar Quiz', 'pronunciation-drill': 'Pronunciation Drill' };
    return labels[gt] || gt;
  };

  const statusBadge = (status) => {
    const colors = { pending: '#f59e0b', accepted: '#3b82f6', in_progress: '#6344A6', completed: '#16a34a', declined: '#dc2626', expired: '#888' };
    return <span className="ch-status-badge" style={{ background: colors[status] || '#888' }}>{status.replace('_', ' ')}</span>;
  };

  if (loading) return <div className="ch-loading">Loading...</div>;

  return (
    <div className="ch-page">
      <Navbar id={id} />
      <div className="ch-page-content">
      <div className="ch-container">
        <div className="ch-header">
          <h2 className="ch-title">1v1 Challenges</h2>
          <button className="ch-create-btn" onClick={() => { setShowCreate(!showCreate); loadFriends(); }}>
            {showCreate ? 'Cancel' : '+ Challenge a Friend'}
          </button>
        </div>

        {stats && (
          <div className="ch-stats-bar">
            <div className="ch-stat"><span className="ch-stat-val">{stats.totalChallenges}</span><span className="ch-stat-label">Played</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.wins}</span><span className="ch-stat-label">Wins</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.losses}</span><span className="ch-stat-label">Losses</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.draws}</span><span className="ch-stat-label">Draws</span></div>
            <div className="ch-stat"><span className="ch-stat-val">{stats.winRate}%</span><span className="ch-stat-label">Win Rate</span></div>
          </div>
        )}

        {showCreate && (
          <div className="ch-create-form">
            <h4>Send a Challenge</h4>
            <div className="ch-form-row">
              <label>Opponent</label>
              <select
                value={friendId}
                onChange={e => setFriendId(e.target.value)}
                className="ch-select"
              >
                <option value="">Select a friend</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {getFriendOptionLabel(friend)}
                  </option>
                ))}
              </select>
            </div>
            <div className="ch-form-row">
              <label>Game</label>
              <select value={gameType} onChange={e => setGameType(e.target.value)} className="ch-select">
                <option value="term-matching">Term Matching</option>
                <option value="grammar-quiz">Grammar Quiz</option>
                <option value="pronunciation-drill">Pronunciation Drill</option>
              </select>
            </div>
            <div className="ch-form-row">
              <label>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="ch-select">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <button className="ch-send-btn" onClick={handleCreate} disabled={!friendId}>
              Send Challenge
            </button>
          </div>
        )}

        <div className="ch-tabs">
          {['active', 'pending', 'completed'].map(t => (
            <button key={t} className={`ch-tab ${tab === t ? 'ch-tab-active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="ch-list">
          {filtered.length === 0 ? (
            <p className="ch-empty">No {tab} challenges.</p>
          ) : (
            filtered.map(c => {
              const myTurn = isMyTurn(c);
              const iSentThis = Number(c.challengerId) === Number(id);
              return (
                <div key={c.id} className="ch-card">
                  <div className="ch-card-top">
                    <div className="ch-opponent">vs {getOpponentName(c)}</div>
                    {statusBadge(c.status)}
                  </div>
                  <div className="ch-card-details">
                    <span className="ch-game-label">{gameLabel(c.gameType)}</span>
                    <span className="ch-difficulty">{c.difficulty}</span>
                  </div>

                  {['accepted', 'in_progress'].includes(c.status) && (
                    <div className="ch-turn-indicator">
                      {myTurn
                        ? <span className="ch-your-turn">Your Turn</span>
                        : <span className="ch-waiting">Waiting for opponent...</span>
                      }
                    </div>
                  )}

                  {c.status === 'completed' && (
                    <div className="ch-score-row">
                      <span>
                        {c.challenger?.firstName}: {c.challengerScore ?? '—'} |{' '}
                        {c.challenged?.firstName}: {c.challengedScore ?? '—'}
                      </span>
                      {c.winnerId && (
                        <span className={Number(c.winnerId) === Number(id) ? 'ch-winner' : 'ch-loser'}>
                          {Number(c.winnerId) === Number(id) ? 'You Won! +25 XP' : 'You Lost'}
                        </span>
                      )}
                      {!c.winnerId && <span className="ch-draw">Draw</span>}
                    </div>
                  )}

                  <div className="ch-card-actions">
                    {c.status === 'pending' && Number(c.challengedId) === Number(id) && (
                      <>
                        <button className="ch-accept-btn" onClick={() => handleAccept(c.id)}>Accept</button>
                        <button className="ch-decline-btn" onClick={() => handleDecline(c.id)}>Decline</button>
                      </>
                    )}
                    {c.status === 'pending' && iSentThis && (
                      <span className="ch-waiting">Awaiting response...</span>
                    )}
                    {['accepted', 'in_progress'].includes(c.status) && myTurn && (
                      <button className="ch-play-btn" onClick={() => handlePlayChallenge(c)}>Play Now</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="ch-back-wrap">
          <button className="back-to-dashboard" onClick={handleBackToDashboard}>Dashboard</button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ChallengeHub;
