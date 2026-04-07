import { useState, useEffect } from 'react';
import React from "react";
import './Dashboard.css';
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import { handleUserDashBoardApi } from '../Services/dashboardService';
import { handleGetTrueFriendsList, handleGetMeetings } from '../Services/userService';
import { getUserChallenges } from '../Services/challengeService';
import { setUserData } from '../Utils/userData';
import { getImageUrl } from '../Services/uploadImageService';
import Navbar from './NavBar';


function Dashboard() {
  const [search] = useSearchParams();
  const id = search.get("id");
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [yourTurnChallenges, setYourTurnChallenges] = useState(0);
  const [friendsList, setFriendsList] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    const load = async () => {
      try {
        const data = await handleUserDashBoardApi(id);
        const user = data.user || {};
        console.log('User data:', user);
        console.log('Profile image:', user.profileImage);
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        if (user.profileImage) {
          setProfileImage(user.profileImage);
          setProfileImgError(false);
        }
        setUserData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
        });
      } catch (err) {
        console.log(err);
      }
    };
    if (id) load();
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

  const upcomingMeeting = meetings && meetings.length > 0 ? meetings[0] : null;

  return (
    <div className="dashboard-page">
      <Navbar id={id} />

      {(pendingChallenges > 0 || yourTurnChallenges > 0) && (
        <div className="dash-challenge-banner-wrap">
          {pendingChallenges > 0 && (
            <div className="dash-challenge-banner dash-challenge-banner-pending">
              <span>You have {pendingChallenges} pending challenge{pendingChallenges !== 1 ? 's' : ''} waiting for your response.</span>
              <button className="dash-challenge-banner-btn" onClick={() => goTo('/Challenges')}>View Challenges</button>
            </div>
          )}
          {yourTurnChallenges > 0 && pendingChallenges === 0 && (
            <div className="dash-challenge-banner dash-challenge-banner-turn">
              <span>It&apos;s your turn to play in {yourTurnChallenges} challenge{yourTurnChallenges !== 1 ? 's' : ''}!</span>
              <button className="dash-challenge-banner-btn" onClick={() => goTo('/Challenges')}>Play Now</button>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-welcome">
        <h1>Welcome back, {firstName} {lastName || ''}</h1>
        <p>Select a section to continue</p>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-panel">
          <section className="dashboard-card profile-card">
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
              <button className="profile-edit-btn" onClick={() => goTo('/UpdateProfile')}>Edit Profile</button>
            </div>
          </section>

          <section className="dashboard-card schedule-card">
            <div className="panel-header">
              <h3>Today’s Schedule</h3>
              <button className="small-btn" onClick={() => goTo('/Scheduler')}>View All</button>
            </div>
            {meetings.length > 0 ? (
              <div className="schedule-list">
                {meetings.map((meeting, idx) => {
                  const displayName = meeting.friendName || meeting.user2_name || meeting.user_name || 'Friend';
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
              <p className="schedule-empty">No meetings for today — schedule your first session!</p>
            )}
          </section>
        </div>

        <div className="dashboard-right-panel">
          <section className="dashboard-card friends-card">
            <div className="panel-header">
              <h3>Friends</h3>
              <button className="small-btn" onClick={() => goTo('/FriendsList')}>View All</button>
            </div>
            <ul className="friends-list">
              {friendsList.slice(0, 5).map((friend) => (
                <li key={friend.id} className="friend-item" onClick={() => goTo('/FriendsList')}>
                  <span className="friend-name">{friend.firstName} {friend.lastName}</span>
                  <span className="friend-status">{friend.online ? 'Online' : 'Offline'}</span>
                </li>
              ))}
              {friendsList.length === 0 && <li className="friend-empty">No friends yet. Add someone to start!</li>}
            </ul>
          </section>
        </div>
      </div>


      <div className="dashboard-footer">
        <button
          className="dash-logout-btn"
          onClick={() => goTo('/LogoutConfirmation')}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
