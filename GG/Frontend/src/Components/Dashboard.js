import { useState, useEffect } from 'react';
import React from "react";
import './Dashboard.css';
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import { handleUserDashBoardApi } from '../Services/dashboardService';
import { getUserChallenges } from '../Services/challengeService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import { setUserData } from '../Utils/userData';
import { getImageUrl } from '../Services/uploadImageService';
import Navbar from './NavBar';

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
    if (!id) return;

    const fetchChallenges = async () => {
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
    };

    fetchChallenges();
    const interval = setInterval(fetchChallenges, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const goTo = (path) => {
    navigate({ pathname: path, search: createSearchParams({ id }).toString() });
  };
  const getInitial   = () => firstName ? firstName.charAt(0).toUpperCase() : '?';

  return (
    <div className="dashboard-page dashboard-page--lm-home">
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

      {id ? (
        <div className="lm-home-wrap">
          <header className="lm-home-hero">
            <h1 className="lm-home-hero-title">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
            <p className="lm-home-hero-tagline">Connect with language partners worldwide</p>
            <p className="lm-home-hero-ko" lang="ko">전 세계 언어 파트너와 연결하세요</p>
          </header>

          <div className="lm-home-profile-card">
            <div className="lm-home-avatar-wrap">
              <div className="lm-home-avatar">
                {profileImage && !profileImgError ? (
                  <img
                    src={getImageUrl(profileImage)}
                    alt=""
                    onError={() => setProfileImgError(true)}
                  />
                ) : (
                  <span className="lm-home-avatar-initial">{getInitial()}</span>
                )}
              </div>
            </div>
            <div className="lm-home-profile-body">
              <h2 className="lm-home-profile-name">{firstName || lastName ? `${firstName} ${lastName || ''}`.trim() : 'Your profile'}</h2>
              {email ? <p className="lm-home-profile-email">{email}</p> : null}
              <p className="lm-home-profile-hint">
                Set up languages, goals, and interests so Discover can match you with the right partners.
              </p>
              <button
                type="button"
                className="lm-home-btn-primary"
                onClick={() => goTo('/UpdateProfile')}
              >
                Make your profile
                <span className="lm-home-btn-ko" lang="ko">프로필 만들기</span>
              </button>
              <button
                type="button"
                className="lm-home-btn-secondary"
                onClick={() => goTo('/ViewProfile')}
              >
                View profile
              </button>
            </div>
          </div>

          <p className="lm-home-nav-hint">
            Use <strong>Discover</strong> to find people, <strong>Partners</strong> to call or chat, and <strong>Games</strong> to practice.
          </p>

          <div className="lm-home-more">
            <span className="lm-home-more-label">More in the menu</span>
            <button type="button" className="lm-home-more-link" onClick={() => goTo('/Scheduler')}>
              Scheduler
            </button>
            <button type="button" className="lm-home-more-link" onClick={() => goTo('/GameSelection')}>
              All games &amp; XP
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}

export default Dashboard;
