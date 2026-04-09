import { useState, useEffect } from 'react';
import React from "react";
import './Dashboard.css';
import './UpdateProfile.css';
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import { handleUserDashBoardApi } from '../Services/dashboardService';
import { handleGetTrueFriendsList, handleGetMeetings } from '../Services/userService';
import { getUserChallenges, getChallengeStats } from '../Services/challengeService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import { handleGetUserBadgesApi } from '../Services/badgeService';
import { setUserData } from '../Utils/userData';
import { getImageUrl } from '../Services/uploadImageService';
import { XP_PER_LEVEL } from '../config/gameRuntime.js';
import Navbar from './NavBar';

/**
 * GET /api/v1/meetings returns rows with user1_id / user2_id but no partner name.
 * Match the other participant to the friends list so we show a real name instead of a generic label.
 */
function getSchedulePartnerDisplayName(meeting, currentUserId, friendsList) {
  const uid = Number(currentUserId);
  const u1 = meeting.user1_id != null ? Number(meeting.user1_id) : null;
  const u2 = meeting.user2_id != null ? Number(meeting.user2_id) : null;
  const otherId = u1 === uid ? u2 : u1;
  if (otherId != null && Number.isFinite(otherId)) {
    const friend = friendsList.find((f) => Number(f.id) === otherId);
    if (friend) {
      const name = `${friend.firstName || ''} ${friend.lastName || ''}`.trim();
      if (name) return name;
    }
  }
  return (
    meeting.friendName ||
    meeting.partnerName ||
    meeting.displayName ||
    meeting.user2_name ||
    meeting.user_name ||
    'Partner'
  );
}

function Dashboard() {
  const [search] = useSearchParams();
  const id = search.get("id");
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [yourTurnChallenges, setYourTurnChallenges] = useState(0);
  const [friendsList, setFriendsList] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [challengeStats, setChallengeStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const navigate = useNavigate();


useEffect(() => {
  const load = async () => {
    try {
      const [dashData, statsData] = await Promise.allSettled([
        handleUserDashBoardApi(id),
        handleGetUserStatsApi(id),
      ]);

      const user = dashData.status === 'fulfilled' ? (dashData.value?.user || {}) : {};
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setUserData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });

      // Profile image lives on the stats endpoint (same source as UpdateProfile)
      const imgPath = statsData.status === 'fulfilled'
        ? statsData.value?.profileImage
        : user.profileImage;
      if (imgPath) {
        setProfileImage(imgPath);
        setProfileImgError(false);
      }
    } catch (err) {
      console.log(err);
    }
  };
  if (id) load();
}, [id]);

  useEffect(() => {
    if (!id) {
      setProgressLoaded(false);
      return;
    }
    let cancelled = false;
    const loadProgress = async () => {
      try {
        const [statsRes, chRes, badgeRes] = await Promise.allSettled([
          handleGetUserStatsApi(id),
          getChallengeStats(id),
          handleGetUserBadgesApi(id),
        ]);
        if (cancelled) return;
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setUserStats(statsRes.value);
        } else {
          setUserStats({ level: 1, xp: 0, xpToNext: XP_PER_LEVEL, gameActivity: null });
        }
        if (chRes.status === 'fulfilled' && chRes.value) {
          setChallengeStats(chRes.value);
        } else {
          setChallengeStats({
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            totalChallenges: 0,
            completedGameSessions: 0,
            xpFromSessions: 0,
          });
        }
        if (badgeRes.status === 'fulfilled') {
          setBadges(badgeRes.value?.badges || []);
        } else {
          setBadges([]);
        }
      } finally {
        if (!cancelled) setProgressLoaded(true);
      }
    };
    loadProgress();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await getUserChallenges(id);
        const list = res?.challenges || res?.data?.challenges || [];
        const pending = Array.isArray(list)
          ? list.filter((c) => c.status === 'pending' && Number(c.challengedId) === Number(id)).length
          : 0;
        const yourTurn = Array.isArray(list)
          ? list.filter((c) => {
              if (!['accepted', 'in_progress'].includes(c.status)) return false;
              if (Number(c.challengerId) === Number(id)) return c.challengerScore === null;
              if (Number(c.challengedId) === Number(id)) return c.challengedScore === null;
              return false;
            }).length
          : 0;

        setPendingChallenges(pending);
        setYourTurnChallenges(yourTurn);
      } catch (error) {
        setPendingChallenges(0);
        setYourTurnChallenges(0);
      }

      try {
        const friendData = await handleGetTrueFriendsList(id);
        setFriendsList(Array.isArray(friendData.friendsList) ? friendData.friendsList : friendData || []);
      } catch {
        setFriendsList([]);
      }

      try {
        const meetData = await handleGetMeetings(id);
        console.log('Meetings data:', meetData);
        const meetingsResult = Array.isArray(meetData)
          ? meetData
          : Array.isArray(meetData.data)
          ? meetData.data
          : [];
        setMeetings(meetingsResult);
      } catch (error) {
        console.log('Error fetching meetings:', error);
        setMeetings([]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const goTo = (path) => {
    navigate({ pathname: path, search: createSearchParams({ id }).toString() });
  };
  const getInitial   = () => firstName ? firstName.charAt(0).toUpperCase() : '?';

  return (
    <div className="dashboard-page">
      <Navbar id={id} />

      {(pendingChallenges > 0 || yourTurnChallenges > 0) && (
        <div className="dash-challenge-banner-wrap">
          {pendingChallenges > 0 && (
            <div className="dash-challenge-banner dash-challenge-banner-pending">
              <span>You have {pendingChallenges} pending challenge{pendingChallenges !== 1 ? 's' : ''} waiting for your response.</span>
              <button
                type="button"
                className="dash-games-btn dash-games-btn-secondary"
                onClick={() => goTo('/Challenges')}
              >
                View Challenges
              </button>
            </div>
          )}
          {yourTurnChallenges > 0 && pendingChallenges === 0 && (
            <div className="dash-challenge-banner dash-challenge-banner-turn">
              <span>It&apos;s your turn to play in {yourTurnChallenges} challenge{yourTurnChallenges !== 1 ? 's' : ''}!</span>
              <button
                type="button"
                className="dash-games-btn dash-games-btn-secondary"
                onClick={() => goTo('/Challenges')}
              >
                Play Now
              </button>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-welcome">
        <h1>Welcome back, {firstName} {lastName || ''}</h1>
      </div>

      {id && progressLoaded && userStats && challengeStats && (
        <div className="dashboard-progress-wrap">
          <div className="dashboard-progress-card dash-progress-vp dash-progress-vp--quiet">
            <h2 className="dash-progress-main-title">Points, games, and challenges</h2>

            <div className="dash-progress-xp-shell">
              <div className="dash-progress-level-row">
                <span className="dash-progress-level-text">Level {userStats.level ?? 1}</span>
                <span className="dash-progress-xp-caption">
                  {userStats.xp ?? 0} / {userStats.xpToNext ?? XP_PER_LEVEL} XP this level
                </span>
              </div>
              <div className="dash-progress-xp-track">
                <div
                  className="dash-progress-xp-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      ((userStats.xp ?? 0) / Math.max(1, userStats.xpToNext ?? XP_PER_LEVEL)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="dash-progress-split">
              <section className="dash-quiet-block">
                <h3 className="dash-quiet-heading">Challenge record</h3>
                <p className="dash-quiet-stats" aria-label="Challenge statistics">
                  <span>Wins <strong>{challengeStats.wins ?? 0}</strong></span>
                  <span className="dash-quiet-dot" aria-hidden="true">·</span>
                  <span>Losses <strong>{challengeStats.losses ?? 0}</strong></span>
                  <span className="dash-quiet-dot" aria-hidden="true">·</span>
                  <span>Draws <strong>{challengeStats.draws ?? 0}</strong></span>
                  <span className="dash-quiet-dot" aria-hidden="true">·</span>
                  <span>Win rate <strong>{challengeStats.winRate ?? 0}%</strong></span>
                  <span className="dash-quiet-dot" aria-hidden="true">·</span>
                  <span>Finished <strong>{challengeStats.totalChallenges ?? 0}</strong></span>
                </p>
                {((challengeStats.completedGameSessions ?? 0) > 0 || (challengeStats.xpFromSessions ?? 0) > 0) && (
                  <p className="dash-progress-footnote">
                    {challengeStats.completedGameSessions ?? 0} practice sessions completed
                    {(challengeStats.xpFromSessions ?? 0) > 0
                      ? ` · ${challengeStats.xpFromSessions} XP from games`
                      : ''}
                  </p>
                )}
              </section>

              {userStats.gameActivity && (
                <section className="dash-quiet-block">
                  <h3 className="dash-quiet-heading">Game activity</h3>
                  <p className="dash-quiet-stats" aria-label="Game activity counts">
                    <span>Term matching <strong>{userStats.gameActivity.termMatching}</strong></span>
                    <span className="dash-quiet-dot" aria-hidden="true">·</span>
                    <span>Grammar <strong>{userStats.gameActivity.grammarQuiz}</strong></span>
                    <span className="dash-quiet-dot" aria-hidden="true">·</span>
                    <span>Pronunciation <strong>{userStats.gameActivity.pronunciation}</strong></span>
                    <span className="dash-quiet-dot" aria-hidden="true">·</span>
                    <span>Perfect rounds <strong>{userStats.gameActivity.perfectRounds}</strong></span>
                    <span className="dash-quiet-dot" aria-hidden="true">·</span>
                    <span>Total games <strong>{userStats.gameActivity.gamesPlayed}</strong></span>
                  </p>
                </section>
              )}
            </div>

            {badges.length > 0 && (
              <section className="dash-quiet-block dash-quiet-block--badges">
                <h3 className="dash-quiet-heading">Badges ({badges.length})</h3>
                <p className="dash-quiet-badges">
                  {badges.map((b) => (
                    <span key={b.id} className="dash-quiet-badge-item" title={b.description}>
                      {b.icon ? `${b.icon} ` : ''}
                      {b.name}
                    </span>
                  ))}
                </p>
              </section>
            )}
          </div>
        </div>
      )}

      {id && (
        <div className="dashboard-home-tiles">
          <section className="dashboard-card dashboard-tile dash-tile-games dash-games-card">
            <div className="dash-games-card-inner dash-games-card-inner--stack dash-tile-fill">
              <div className="dash-games-copy">
                <h3 className="dash-games-title">Games & teams</h3>
                <p className="dash-games-desc">
                  Practice vocabulary, grammar, and pronunciation, challenge a friend to 1v1, or join your team lobby.
                </p>
              </div>
              <div className="dash-games-actions dash-games-actions--centered">
                <button
                  type="button"
                  className="dash-games-btn dash-games-btn-primary"
                  onClick={() => goTo('/GameSelection')}
                >
                  Play games
                </button>
                <button
                  type="button"
                  className="dash-games-btn dash-games-btn-secondary"
                  onClick={() => goTo('/Challenges')}
                >
                  1v1 challenges
                </button>
                <button
                  type="button"
                  className="dash-games-btn dash-games-btn-secondary"
                  onClick={() => goTo('/TeamLobby')}
                >
                  Teams
                </button>
              </div>
            </div>
          </section>

          <section className="dashboard-card dashboard-tile dash-tile-profile">
            <div className="profile-card dash-profile-tile">
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
                <h2>{firstName} {lastName}</h2>
                {email ? <p className="profile-email">{email}</p> : null}
                <div className="profile-card-actions-games">
                  <button
                    type="button"
                    className="dash-games-btn dash-games-btn-primary"
                    onClick={() => goTo('/ViewProfile')}
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    className="dash-games-btn dash-games-btn-secondary"
                    onClick={() => goTo('/UpdateProfile')}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card dashboard-tile dash-tile-friends friends-card">
            <div className="panel-header">
              <h3>Friends</h3>
              <button type="button" className="dash-games-btn dash-games-btn-secondary" onClick={() => goTo('/Friends')}>
                View All
              </button>
            </div>
            <ul className="friends-list">
              {friendsList.slice(0, 5).map((friend) => (
                <li key={friend.id} className="friend-item" onClick={() => goTo('/Friends')}>
                  <span className="friend-name">{friend.firstName} {friend.lastName}</span>
                  <span className="friend-status">{friend.online ? 'Online' : 'Offline'}</span>
                </li>
              ))}
              {friendsList.length === 0 && <li className="friend-empty">No friends yet. Add someone to start!</li>}
            </ul>
          </section>

          <section className="dashboard-card dashboard-tile dash-tile-schedule schedule-card">
            <div className="panel-header">
              <h3>Today’s Schedule</h3>
              <button type="button" className="dash-games-btn dash-games-btn-secondary" onClick={() => goTo('/Scheduler')}>
                View All
              </button>
            </div>
            {meetings.length > 0 ? (
              <div className="schedule-list">
                {meetings.map((meeting, idx) => {
                  const displayName = getSchedulePartnerDisplayName(meeting, id, friendsList);
                  const dayText = meeting.day_of_week || meeting.date || 'Today';
                  const start = meeting.start_time || meeting.startTime || meeting.start || 'TBD';
                  const end = meeting.end_time || meeting.endTime || meeting.end || 'TBD';
                  return (
                    <div key={`${meeting.id || idx}`} className="schedule-item">
                      <div>
                        <strong>{displayName}</strong>
                        <span className="schedule-subtitle">{dayText} • {start} - {end}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="schedule-empty">No meetings for today. Schedule your first session!</p>
            )}
          </section>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
