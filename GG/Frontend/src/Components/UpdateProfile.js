import { useState, useEffect } from 'react';
import React from "react";
import './UpdateProfile.css';
import Select from "react-select";
import ProfileImageSection from './ProfileImageSection';
import Navbar from './NavBar';

import {
  handleProfileUpdateAPI,
  handleGetAllInterests,
  handleGetUserInterests,
  handleReplaceUserInterests,
  handleGetUserAvailability,
  handleReplaceUserAvailability
} from '../Services/userService';

import { handleGetUserProfileApi } from '../Services/findFriendsService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import { handleGetUserBadgesApi } from '../Services/badgeService';
import { getChallengeStats } from '../Services/challengeService';
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";

const selectStyles = {
  control: (base) => ({ ...base, borderRadius: 6, borderColor: '#d4d4d8', fontSize: 14, fontFamily: "var(--dl-font)" }),
  option: (base) => ({ ...base, fontSize: 14, fontFamily: "var(--dl-font)" }),
};

function UpdateProfile() {
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
  const [commitmentLevel, setCommitmentLevel] = useState(3);
  const [profileImage, setProfileImage] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [search] = useSearchParams();
  const id = search.get("id");
  const navigate = useNavigate();

  const NativeLanguage = [{ value: "English", label: "English" }, { value: "Korean", label: "Korean" }];
  const TargetLanguage = [{ value: "English", label: "English" }, { value: "Korean", label: "Korean" }];
  const TargetLanguageProficiency = [
    { value: "Beginner", label: "Beginner" }, { value: "Elementary", label: "Elementary" },
    { value: "Intermediate", label: "Intermediate" }, { value: "Proficient", label: "Proficient" },
    { value: "Fluent", label: "Fluent" },
  ];
  const Gender = [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }];
  const Profession = [
    { value: "Education", label: "Education" }, { value: "Engineering", label: "Engineering" },
    { value: "Retail", label: "Retail" }, { value: "Finance", label: "Finance" },
    { value: "Law", label: "Law" }, { value: "Medicine", label: "Medicine" },
    { value: "Scientist", label: "Scientist" },
  ];
  const Zodiac = [
    { value: "Aries", label: "Aries" }, { value: "Taurus", label: "Taurus" },
    { value: "Gemini", label: "Gemini" }, { value: "Cancer", label: "Cancer" },
    { value: "Leo", label: "Leo" }, { value: "Virgo", label: "Virgo" },
    { value: "Libra", label: "Libra" }, { value: "Scorpio", label: "Scorpio" },
    { value: "Sagittarius", label: "Sagittarius" }, { value: "Capricorn", label: "Capricorn" },
    { value: "Aquarius", label: "Aquarius" }, { value: "Pisces", label: "Pisces" },
  ];
  const TimeZones = [
    { value: "UTC", label: "UTC" }, { value: "America/New_York", label: "Eastern (New York)" },
    { value: "America/Chicago", label: "Central (Chicago)" }, { value: "America/Denver", label: "Mountain (Denver)" },
    { value: "America/Los_Angeles", label: "Pacific (LA)" }, { value: "Europe/London", label: "London" },
    { value: "Europe/Paris", label: "Paris" }, { value: "Asia/Seoul", label: "Seoul" },
    { value: "Asia/Tokyo", label: "Tokyo" },
  ];
  const MBTI = [
    { value: "INTJ", label: "INTJ" }, { value: "INTP", label: "INTP" },
    { value: "ENTJ", label: "ENTJ" }, { value: "ENTP", label: "ENTP" },
    { value: "INFJ", label: "INFJ" }, { value: "INFP", label: "INFP" },
    { value: "ENFJ", label: "ENFJ" }, { value: "ENFP", label: "ENFP" },
    { value: "ISTJ", label: "ISTJ" }, { value: "ISFJ", label: "ISFJ" },
    { value: "ESTJ", label: "ESTJ" }, { value: "ESFJ", label: "ESFJ" },
    { value: "ISTP", label: "ISTP" }, { value: "ISFP", label: "ISFP" },
    { value: "ESTP", label: "ESTP" }, { value: "ESFP", label: "ESFP" },
  ];
  const VisibilityOptions = [{ value: "Show", label: "Show" }, { value: "Hide", label: "Hide" }];
  const LearningGoalOptions = [
    { value: "Conversational fluency", label: "Conversational fluency" },
    { value: "Business/Professional", label: "Business/Professional" },
    { value: "Travel preparation", label: "Travel preparation" },
    { value: "Academic study", label: "Academic study" },
    { value: "Cultural appreciation", label: "Cultural appreciation" },
    { value: "K-pop/K-drama fan", label: "K-pop/K-drama fan" },
  ];
  const CommunicationStyleOptions = [
    { value: "Text-heavy", label: "Text-heavy" },
    { value: "Voice/Video preferred", label: "Voice/Video preferred" },
    { value: "Mixed", label: "Mixed" },
    { value: "Casual/Fun", label: "Casual/Fun" },
    { value: "Structured/Formal", label: "Structured/Formal" },
  ];

  const generateHourlySlots = (day) => {
    const slots = [];
    for (let hour = 8; hour < 21; hour++) {
      const start = String(hour).padStart(2, '0') + ':00';
      const end   = String(hour + 1).padStart(2, '0') + ':00';
      const fmt   = (h) => `${((h + 11) % 12 + 1)}${h >= 12 ? 'pm' : 'am'}`;
      slots.push({ value: { day_of_week: day, start_time: start, end_time: end }, label: `${day} ${fmt(hour)}-${fmt(hour + 1)}` });
    }
    return slots;
  };
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const availabilityOptions = days.flatMap(generateHourlySlots);
  const pickSingle = (options, value) => options.find(o => o.value === value) || null;

  useEffect(() => {
    if (!id) return;

    const loadAllData = async () => {
      try {
        const [profileRes, userStatsRes, interestsAllRes, interestsUserRes, availabilityRes] = await Promise.allSettled([
          handleGetUserProfileApi(id),
          handleGetUserStatsApi(id),
          handleGetAllInterests(),
          handleGetUserInterests(id),
          handleGetUserAvailability(id),
        ]);

        if (profileRes.status === 'fulfilled') {
          const raw = profileRes.value;
          const profile = raw?.data ?? raw;
          if (profile) {
            if (profile.native_language)              setNativeLanguage(profile.native_language);
            if (profile.target_language)              setTargetLanguage(profile.target_language);
            if (profile.target_language_proficiency)  setTargetLanguageProficiency(profile.target_language_proficiency);
            if (profile.age)                          setAge(profile.age);
            if (profile.gender)                       setGender(profile.gender);
            if (profile.profession)                   setProfession(profile.profession);
            if (profile.mbti)                         setMBTI(profile.mbti);
            if (profile.zodiac)                       setZodiac(profile.zodiac);
            if (profile.default_time_zone)            setDefaultTimeZone(profile.default_time_zone);
            if (profile.visibility)                   setVisibility(profile.visibility);
            if (profile.learning_goal)                setLearningGoal(profile.learning_goal);
            if (profile.communication_style)          setCommunicationStyle(profile.communication_style);
            if (profile.commitment_level)             setCommitmentLevel(profile.commitment_level);
          }
        }

        if (userStatsRes.status === 'fulfilled') {
          setUserStats(userStatsRes.value);
          if (userStatsRes.value?.profileImage) setProfileImage(userStatsRes.value.profileImage);
        }

        try {
          const [badgeRes, challengeStatsRes] = await Promise.allSettled([
            handleGetUserBadgesApi(id),
            getChallengeStats(id),
          ]);
          if (badgeRes.status === 'fulfilled') setBadges(badgeRes.value?.badges || []);
          if (challengeStatsRes.status === 'fulfilled') setChallengeStats(challengeStatsRes.value);
        } catch {}

        if (interestsAllRes.status === 'fulfilled') {
          const raw = interestsAllRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAllInterests(arr.map(i => ({ value: i.id, label: i.interest_name })));
        }

        if (interestsUserRes.status === 'fulfilled') {
          const raw = interestsUserRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setSelectedInterests(arr.map(i => ({ value: i.id, label: i.interest_name })));
        }

        if (availabilityRes.status === 'fulfilled') {
          const raw = availabilityRes.value;
          const slots = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAvailability(slots.map(s => {
            const match = availabilityOptions.find(o =>
              o.value.day_of_week === s.day_of_week &&
              o.value.start_time === s.start_time &&
              o.value.end_time === s.end_time
            );
            return match || {
              value: { day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time },
              label: `${s.day_of_week} ${s.start_time}-${s.end_time}`
            };
          }));
        }
      } catch (err) {
        console.error('Unexpected error loading profile data:', err);
      } finally {
        setDataLoaded(true);
      }
    };

    loadAllData();
  }, [id]);

  const handleSubmit = async () => {
    setErrMsg('');
    setSubmitted(true); setError(false);
    try {
      await handleProfileUpdateAPI(id, nativeLanguage, targetLanguage, targetLanguageProficiency, age, gender, profession, mbti, zodiac, defaultTimeZone, visibility, learningGoal, communicationStyle, commitmentLevel);
      await handleReplaceUserInterests(id, selectedInterests.map(i => i.value));
      await handleReplaceUserAvailability(id, availability.map(a => a.value));
      navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
    } catch (err) {
      setErrMsg(err?.response?.data?.message || "Failed to update profile.");
      console.error(err);
    }
  };

  const handleBack = () => {
    navigate({ pathname: "/Dashboard", search: createSearchParams({ id }).toString() });
  };

  const STEPS = [
    { title: 'Basics', subtitle: 'Pick your languages + level' },
    { title: 'About you', subtitle: 'A few quick details' },
    { title: 'Schedule', subtitle: 'Timezone + when you\'re free' },
    { title: 'Style', subtitle: 'How you like to learn' },
  ];

  const stepRequiredFields = {
    0: [nativeLanguage, targetLanguage, targetLanguageProficiency],
    1: [age, profession],
  };

  const handleNext = () => {
    const required = stepRequiredFields[step];
    if (required && required.some(v => !v)) {
      setError(true);
      return;
    }
    setError(false);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => { setError(false); setStep(s => Math.max(s - 1, 0)); };
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  if (!dataLoaded) {
    return (
      <div className="up-page">
        <Navbar id={id} />
        <div className="up-center">
          <div className="up-card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#364659', fontFamily: 'var(--dl-font)', fontSize: 18 }}>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-page">
      <Navbar id={id} />
      <div className="up-center">
        <div className="up-card">
          <div className="up-header">
            <div>
              <h1 className="up-title">Edit Profile</h1>
              <p className="up-subtitle">Update your profile details anytime.</p>
            </div>
            <div className="up-progress">
              <div className="up-progress-top">
                <span className="up-progress-step">{STEPS[step].title}</span>
                <span className="up-progress-pct">{progressPct}%</span>
              </div>
              <div className="up-progress-track">
                <div className="up-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="up-progress-sub">{STEPS[step].subtitle}</div>
            </div>
          </div>

          <div className="up-messages">
            {error && <div className="up-error">Please enter all required fields.</div>}
            {submitted && !errMsg && <div className="up-success">Profile updated successfully!</div>}
            {errMsg && <div className="up-error">{errMsg}</div>}
          </div>

          <form className="up-form" onSubmit={(e) => e.preventDefault()}>

            <div className="up-group">
              <ProfileImageSection id={id} currentImage={profileImage} onImageChange={(path) => setProfileImage(path)} />
            </div>

            {/* Step content */}
            {step === 0 && (
              <div className="up-step">
                <div className="up-step-grid">
                  <div className="up-group">
                    <label className="up-label">Native Language *</label>
                    <Select styles={selectStyles} options={NativeLanguage} onChange={s => setNativeLanguage(s?.value ?? '')} value={pickSingle(NativeLanguage, nativeLanguage)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Target Language *</label>
                    <Select styles={selectStyles} options={TargetLanguage} onChange={s => setTargetLanguage(s?.value ?? '')} value={pickSingle(TargetLanguage, targetLanguage)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Proficiency Level *</label>
                    <Select styles={selectStyles} options={TargetLanguageProficiency} onChange={s => setTargetLanguageProficiency(s?.value ?? '')} value={pickSingle(TargetLanguageProficiency, targetLanguageProficiency)} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="up-step">
                <div className="up-step-grid">
                  <div className="up-group">
                    <label className="up-label">Age *</label>
                    <input placeholder="Enter age" onChange={e => setAge(e.target.value)} className="up-input" type="text" value={age} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Profession *</label>
                    <Select styles={selectStyles} options={Profession} onChange={s => setProfession(s?.value ?? '')} value={pickSingle(Profession, profession)} />
                  </div>
                </div>

                <button className="up-accordion" type="button" onClick={() => setShowAdvanced(v => !v)}>
                  {showAdvanced ? 'Hide extra details' : 'Add extra details (optional)'}
                </button>

                {showAdvanced && (
                  <div className="up-step-grid">
                    <div className="up-group">
                      <label className="up-label">Gender</label>
                      <Select styles={selectStyles} options={Gender} onChange={s => setGender(s?.value ?? '')} value={pickSingle(Gender, gender)} />
                    </div>
                    <div className="up-group">
                      <label className="up-label">Personality Type (MBTI)</label>
                      <Select styles={selectStyles} options={MBTI} onChange={s => setMBTI(s?.value ?? '')} value={pickSingle(MBTI, mbti)} />
                    </div>
                    <div className="up-group">
                      <label className="up-label">Zodiac</label>
                      <Select styles={selectStyles} options={Zodiac} onChange={s => setZodiac(s?.value ?? '')} value={pickSingle(Zodiac, zodiac)} />
                    </div>
                    <div className="up-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="up-label">Interests</label>
                      <Select styles={selectStyles} isMulti options={allInterests} onChange={s => setSelectedInterests(s || [])} value={selectedInterests} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="up-step">
                <div className="up-step-grid">
                  <div className="up-group">
                    <label className="up-label">Time Zone</label>
                    <Select styles={selectStyles} options={TimeZones} onChange={s => setDefaultTimeZone(s?.value ?? '')} value={pickSingle(TimeZones, defaultTimeZone)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Profile Visibility</label>
                    <Select styles={selectStyles} options={VisibilityOptions} onChange={s => setVisibility(s?.value ?? '')} value={pickSingle(VisibilityOptions, visibility)} />
                  </div>
                  <div className="up-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="up-label">Availability</label>
                    <Select styles={selectStyles} isMulti options={availabilityOptions} value={availability} onChange={s => setAvailability(s || [])} placeholder="Pick a few times you're usually free..." />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="up-step">
                <div className="up-step-grid">
                  <div className="up-group">
                    <label className="up-label">Learning Goal</label>
                    <Select styles={selectStyles} options={LearningGoalOptions} onChange={s => setLearningGoal(s?.value ?? '')} value={pickSingle(LearningGoalOptions, learningGoal)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Communication Style</label>
                    <Select styles={selectStyles} options={CommunicationStyleOptions} onChange={s => setCommunicationStyle(s?.value ?? '')} value={pickSingle(CommunicationStyleOptions, communicationStyle)} />
                  </div>
                  <div className="up-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="up-label">Commitment Level</label>
                    <div className="up-stars">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span
                          key={n}
                          className={`up-star ${n <= commitmentLevel ? 'up-star-active' : 'up-star-inactive'}`}
                          onClick={() => setCommitmentLevel(n)}
                        >
                          &#9733;
                        </span>
                      ))}
                    </div>
                    <div className="up-hint">Tip: 3 is casual, 5 is very committed.</div>
                  </div>
                </div>

                {(userStats || badges.length > 0 || challengeStats) && (
                  <button className="up-accordion" type="button" onClick={() => setShowStats(v => !v)}>
                    {showStats ? 'Hide my stats' : 'Show my stats'}
                  </button>
                )}

                {showStats && (userStats || badges.length > 0 || challengeStats) && (
                  <div className="up-stats-wrap">
                    {userStats && (
                      <div className="up-stats-grid">
                        <div className="up-stat-card">
                          <div className="up-stat-val">{userStats.level || 1}</div>
                          <div className="up-stat-label">Level</div>
                        </div>
                        <div className="up-stat-card">
                          <div className="up-stat-val">{userStats.xp || 0}</div>
                          <div className="up-stat-label">XP</div>
                        </div>
                        {challengeStats && (
                          <>
                            <div className="up-stat-card">
                              <div className="up-stat-val">{challengeStats.wins || 0}</div>
                              <div className="up-stat-label">Challenge Wins</div>
                            </div>
                            <div className="up-stat-card">
                              <div className="up-stat-val">{challengeStats.winRate || 0}%</div>
                              <div className="up-stat-label">Win Rate</div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {badges.length > 0 && (
                      <div>
                        <label className="up-label" style={{ margin: '12px 0 6px' }}>Badges Earned</label>
                        <div className="up-badge-list">
                          {badges.map(b => (
                            <span key={b.id} className="up-badge-chip" title={b.description}>
                              {b.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="up-wizard-footer">
              <button
                className={step === 0 ? 'back-to-dashboard' : 'up-btn-secondary'}
                type="button"
                onClick={step === 0 ? handleBack : prevStep}
              >
                {step === 0 ? 'Dashboard' : 'Back'}
              </button>

              {step < STEPS.length - 1 ? (
                <button className="up-btn-primary" type="button" onClick={handleNext}>
                  Continue
                </button>
              ) : (
                <button className="up-btn-primary" type="button" onClick={handleSubmit}>
                  Save & Finish
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateProfile;
