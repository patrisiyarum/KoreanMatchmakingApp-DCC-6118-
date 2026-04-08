import { useState, useEffect } from 'react';
import React from "react";
import './UpdateProfile.css';
import './ViewProfile.css';
import Navbar from './NavBar';
import { getImageUrl } from '../Services/uploadImageService';
import { handleGetUserProfileApi } from '../Services/findFriendsService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import { handleGetUserInterests, handleGetUserAvailability, handleUserLogout } from '../Services/userService';
import { handleUserDashBoardApi } from '../Services/dashboardService';
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";

function ViewProfile() {
  const [search] = useSearchParams();
  const id = search.get("id");
  const navigate = useNavigate();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);

  // User basics (from dashboard / stats endpoint)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Profile fields
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageProficiency, setTargetLanguageProficiency] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [mbti, setMBTI] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [defaultTimeZone, setDefaultTimeZone] = useState('');
  const [visibility, setVisibility] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState(null);
  const [interests, setInterests] = useState([]);
  const [availability, setAvailability] = useState([]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);


  useEffect(() => {
    if (!id) return;

    const loadAll = async () => {
      try {
        const [dashRes, profileRes, statsRes, interestsRes, availRes] = await Promise.allSettled([
          handleUserDashBoardApi(id),
          handleGetUserProfileApi(id),
          handleGetUserStatsApi(id),
          handleGetUserInterests(id),
          handleGetUserAvailability(id),
        ]);

        // Name + email live on the dashboard endpoint (same source as Dashboard.js)
        if (dashRes.status === 'fulfilled') {
          const user = dashRes.value?.user || {};
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
          setEmail(user.email || '');
          if (user.profileImage) setProfileImage(user.profileImage);
        }

        if (profileRes.status === 'fulfilled') {
          const raw = profileRes.value;
          const profile = raw?.data ?? raw;
          if (profile) {
            setNativeLanguage(profile.native_language || '');
            setTargetLanguage(profile.target_language || '');
            setTargetLanguageProficiency(profile.target_language_proficiency || '');
            setAge(profile.age || '');
            setGender(profile.gender || '');
            setProfession(profile.profession || '');
            setMBTI(profile.mbti || '');
            setZodiac(profile.zodiac || '');
            setDefaultTimeZone(profile.default_time_zone || '');
            setVisibility(profile.visibility || '');
            setLearningGoal(profile.learning_goal || '');
            setCommunicationStyle(profile.communication_style || '');
            if (profile.commitment_level != null && profile.commitment_level !== '') {
              setCommitmentLevel(Number(profile.commitment_level));
            }
          }
        }

        // Profile image fallback from stats if dashboard didn't have it
        if (statsRes.status === 'fulfilled' && statsRes.value?.profileImage && !profileImage) {
          setProfileImage(statsRes.value.profileImage);
        }

        if (interestsRes.status === 'fulfilled') {
          const raw = interestsRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setInterests(arr.map(i => i.interest_name || i.name || '').filter(Boolean));
        }

        if (availRes.status === 'fulfilled') {
          const raw = availRes.value;
          const slots = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAvailability(slots);
        }
      } catch (err) {
        console.error('Error loading view profile:', err);
      } finally {
        setDataLoaded(true);
      }
    };

    loadAll();
  }, [id]);

  const goTo = (path) => {
    navigate({ pathname: path, search: createSearchParams({ id }).toString() });
  };

  const getInitial = () => (firstName ? firstName.charAt(0).toUpperCase() : '?');

  const formatAvailability = (slots) => {
    const grouped = {};
    slots.forEach((s) => {
      const day = s.day_of_week || s.day || '';
      if (!grouped[day]) grouped[day] = [];
      const start = s.start_time || '';
      const end = s.end_time || '';
      if (start) grouped[day].push(`${start.slice(0, 5)}–${end.slice(0, 5)}`);
    });
    return grouped;
  };
    const handleLogout = async () => {
        try {
            await handleUserLogout(id);
        } catch (error) {
            console.error('Logout failed (non-blocking):', error);
        } finally {
            navigate({ pathname: "/" });
        }
    };
    const availGrouped = formatAvailability(availability);

  if (!dataLoaded) {
    return (
      <div className="up-page">
        <Navbar id={id} />
        <div className="up-center">
          <div className="up-card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#364659', fontFamily: 'var(--dl-font)', fontSize: 18 }}>
              Loading your profile…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-page">
      <Navbar id={id} />
      <div className="up-center">
        <div className="up-card vp-card">

          {/* ── Header ── */}
          <div className="vp-hero">
            <div className="vp-avatar-wrap">
              {profileImage && !profileImgError ? (
                <img
                  src={getImageUrl(profileImage)}
                  alt="Profile"
                  className="vp-avatar-img"
                  onError={() => setProfileImgError(true)}
                />
              ) : (
                <div className="vp-avatar-fallback">{getInitial()}</div>
              )}
            </div>
            <div className="vp-hero-info">
              <h1 className="vp-name">{firstName} {lastName}</h1>
              {email && <p className="vp-email">{email}</p>}
              {visibility && (
                <span className={`vp-badge ${visibility === 'Show' ? 'vp-badge-show' : 'vp-badge-hide'}`}>
                  {visibility === 'Show' ? '🌐 Public Profile' : '🔒 Private Profile'}
                </span>
              )}
            </div>
          </div>

          {/* ── Languages ── */}
          <section className="vp-section">
            <h2 className="vp-section-title">Languages</h2>
            <div className="vp-grid">
              <InfoCard label="Native Language"   value={nativeLanguage} />
              <InfoCard label="Target Language"   value={targetLanguage} />
              <InfoCard label="Proficiency Level" value={targetLanguageProficiency} />
            </div>
          </section>

          {/* ── About ── */}
          <section className="vp-section">
            <h2 className="vp-section-title">About</h2>
            <div className="vp-grid">
              <InfoCard label="Age"        value={age} />
              <InfoCard label="Gender"     value={gender} />
              <InfoCard label="Profession" value={profession} />
              <InfoCard label="MBTI"       value={mbti} />
              <InfoCard label="Zodiac"     value={zodiac} />
            </div>
          </section>

          {/* ── Learning Style ── */}
          <section className="vp-section">
            <h2 className="vp-section-title">Learning Style</h2>
            <div className="vp-grid">
              <InfoCard label="Learning Goal"        value={learningGoal} />
              <InfoCard label="Communication Style"  value={communicationStyle} />
              <InfoCard label="Time Zone"            value={defaultTimeZone} />
            </div>
            {commitmentLevel != null && (
              <div className="vp-commitment">
                <span className="vp-field-label">Commitment Level</span>
                <div className="vp-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`up-star ${n <= commitmentLevel ? 'up-star-active' : 'up-star-inactive'}`}
                    >
                      &#9733;
                    </span>
                  ))}
                  <span className="vp-commitment-hint">
                    {commitmentLevel <= 2 ? 'Casual' : commitmentLevel >= 4 ? 'Very committed' : 'Moderate'}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ── Interests ── */}
          {interests.length > 0 && (
            <section className="vp-section">
              <h2 className="vp-section-title">Interests</h2>
              <div className="vp-tags">
                {interests.map((interest, i) => (
                  <span key={i} className="vp-tag">{interest}</span>
                ))}
              </div>
            </section>
          )}

          {/* ── Availability ── */}
          {Object.keys(availGrouped).length > 0 && (
            <section className="vp-section">
              <h2 className="vp-section-title">Availability</h2>
              <div className="vp-avail-grid">
                {Object.entries(availGrouped).map(([day, times]) => (
                  <div key={day} className="vp-avail-day">
                    <span className="vp-avail-day-label">{day}</span>
                    <div className="vp-avail-times">
                      {times.map((t, i) => (
                        <span key={i} className="vp-avail-chip">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Footer Actions ── */}
          <div className="up-wizard-footer">
            <button
              className="back-to-dashboard"
              type="button"
              onClick={() => goTo('/Dashboard')}
            >
              Dashboard
            </button>
            <button
              className="up-btn-primary"
              type="button"
              onClick={() => goTo('/UpdateProfile')}
            >
              Edit Profile
            </button>
            <button
                className="dash-logout-btn"
                onClick={() => setShowLogoutModal(true)}
            >
                Log Out
            </button>
          </div>
        </div>
      </div>
      
        {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="logout-modal-title">Log out?</h3>
            <p className="logout-modal-msg">Are you sure you want to log out?</p>
            <div className="logout-modal-actions">
                <button
                className="logout-modal-cancel"
                onClick={() => setShowLogoutModal(false)}
                >
                Cancel
                </button>
                <button
                className="logout-modal-confirm"
                onClick={handleLogout}
                >
                Log Out
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
    

  );
}

// Small reusable card for a labelled field
function InfoCard({ label, value }) {
  if (!value) return null;
  return (
    <div className="vp-info-card">
      <span className="vp-field-label">{label}</span>
      <span className="vp-field-value">{value}</span>
    </div>
  );
}



export default ViewProfile;