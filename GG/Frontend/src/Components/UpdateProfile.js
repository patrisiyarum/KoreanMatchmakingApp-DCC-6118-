import { useState, useEffect } from 'react';
import React from 'react';
import './UpdateProfile.css';
import Select from 'react-select';
import ProfileImageSection from './ProfileImageSection';
import Navbar from './NavBar';

import {
  handleProfileUpdateAPI,
  handleGetAllInterests,
  handleGetUserInterests,
  handleReplaceUserInterests,
  handleGetUserAvailability,
  handleReplaceUserAvailability,
} from '../Services/userService';
import WeeklyAvailabilityGrid from './WeeklyAvailabilityGrid';
import { normalizeTimeKey } from './weeklyAvailabilityUtils';

import { handleGetUserProfileApi } from '../Services/findFriendsService';
import { handleGetUserStatsApi } from '../Services/gameSelectionService';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: 10,
    borderColor: '#d4d4d8',
    minHeight: 48,
    fontSize: 15,
    fontFamily: 'var(--dl-font)',
  }),
  option: (base) => ({ ...base, fontSize: 14, fontFamily: 'var(--dl-font)' }),
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
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();

  const NativeLanguage = [
    { value: 'English', label: 'English' },
    { value: 'Korean', label: 'Korean' },
  ];
  const TargetLanguage = [
    { value: 'English', label: 'English' },
    { value: 'Korean', label: 'Korean' },
  ];
  const TargetLanguageProficiency = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Elementary', label: 'Elementary' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Proficient', label: 'Proficient' },
    { value: 'Fluent', label: 'Fluent' },
  ];
  const Gender = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];
  const Profession = [
    { value: 'Education', label: 'Education' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Law', label: 'Law' },
    { value: 'Medicine', label: 'Medicine' },
    { value: 'Scientist', label: 'Scientist' },
    { value: 'Marketing', label: 'Marketing' },
  ];
  const Zodiac = [
    { value: 'Aries', label: 'Aries' },
    { value: 'Taurus', label: 'Taurus' },
    { value: 'Gemini', label: 'Gemini' },
    { value: 'Cancer', label: 'Cancer' },
    { value: 'Leo', label: 'Leo' },
    { value: 'Virgo', label: 'Virgo' },
    { value: 'Libra', label: 'Libra' },
    { value: 'Scorpio', label: 'Scorpio' },
    { value: 'Sagittarius', label: 'Sagittarius' },
    { value: 'Capricorn', label: 'Capricorn' },
    { value: 'Aquarius', label: 'Aquarius' },
    { value: 'Pisces', label: 'Pisces' },
  ];
  const TimeZones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern (New York)' },
    { value: 'America/Chicago', label: 'Central (Chicago)' },
    { value: 'America/Denver', label: 'Mountain (Denver)' },
    { value: 'America/Los_Angeles', label: 'Pacific (LA)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Seoul', label: 'Seoul' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
  ];
  const MBTI = [
    { value: 'INTJ', label: 'INTJ' },
    { value: 'INTP', label: 'INTP' },
    { value: 'ENTJ', label: 'ENTJ' },
    { value: 'ENTP', label: 'ENTP' },
    { value: 'INFJ', label: 'INFJ' },
    { value: 'INFP', label: 'INFP' },
    { value: 'ENFJ', label: 'ENFJ' },
    { value: 'ENFP', label: 'ENFP' },
    { value: 'ISTJ', label: 'ISTJ' },
    { value: 'ISFJ', label: 'ISFJ' },
    { value: 'ESTJ', label: 'ESTJ' },
    { value: 'ESFJ', label: 'ESFJ' },
    { value: 'ISTP', label: 'ISTP' },
    { value: 'ISFP', label: 'ISFP' },
    { value: 'ESTP', label: 'ESTP' },
    { value: 'ESFP', label: 'ESFP' },
  ];
  const VisibilityOptions = [
    { value: 'Show', label: 'Show' },
    { value: 'Hide', label: 'Hide' },
  ];
  const LearningGoalOptions = [
    { value: 'Conversational fluency', label: 'Conversational fluency' },
    { value: 'Business/Professional', label: 'Business/Professional' },
    { value: 'Travel preparation', label: 'Travel preparation' },
    { value: 'Academic study', label: 'Academic study' },
    { value: 'Cultural appreciation', label: 'Cultural appreciation' },
    { value: 'K-pop/K-drama fan', label: 'K-pop/K-drama fan' },
  ];
  const CommunicationStyleOptions = [
    { value: 'Text-heavy', label: 'Text-heavy' },
    { value: 'Voice/Video preferred', label: 'Voice/Video preferred' },
    { value: 'Mixed', label: 'Mixed' },
    { value: 'Casual/Fun', label: 'Casual/Fun' },
    { value: 'Structured/Formal', label: 'Structured/Formal' },
  ];

  const pickSingle = (options, value) => options.find((o) => o.value === value) || null;

  useEffect(() => {
    if (!id) return;

    const loadAllData = async () => {
      try {
        const [profileRes, userStatsRes, interestsAllRes, interestsUserRes, availabilityRes] =
          await Promise.allSettled([
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
            if (profile.native_language) setNativeLanguage(profile.native_language);
            if (profile.target_language) setTargetLanguage(profile.target_language);
            if (profile.target_language_proficiency) {
              setTargetLanguageProficiency(profile.target_language_proficiency);
            }
            if (profile.age) setAge(String(profile.age));
            if (profile.gender) setGender(profile.gender);
            if (profile.profession) setProfession(profile.profession);
            if (profile.mbti) setMBTI(profile.mbti);
            if (profile.zodiac) setZodiac(profile.zodiac);
            if (profile.default_time_zone) setDefaultTimeZone(profile.default_time_zone);
            if (profile.visibility) setVisibility(profile.visibility);
            if (profile.learning_goal) setLearningGoal(profile.learning_goal);
            if (profile.communication_style) setCommunicationStyle(profile.communication_style);
            if (profile.commitment_level != null && profile.commitment_level !== '') {
              setCommitmentLevel(Number(profile.commitment_level));
            }
            if (profile.bio != null && profile.bio !== '') setBio(String(profile.bio));
          }
        }

        if (userStatsRes.status === 'fulfilled' && userStatsRes.value?.profileImage) {
          setProfileImage(userStatsRes.value.profileImage);
        }

        if (interestsAllRes.status === 'fulfilled') {
          const raw = interestsAllRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAllInterests(arr.map((i) => ({ value: i.id, label: i.interest_name })));
        }

        if (interestsUserRes.status === 'fulfilled') {
          const raw = interestsUserRes.value;
          const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setSelectedInterests(arr.map((i) => ({ value: i.id, label: i.interest_name })));
        }

        if (availabilityRes.status === 'fulfilled') {
          const raw = availabilityRes.value;
          const slots = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setAvailabilitySlots(
            slots.map((s) => ({
              day_of_week: s.day_of_week,
              start_time: normalizeTimeKey(s.start_time),
              end_time: normalizeTimeKey(s.end_time),
            }))
          );
        }
      } catch (err) {
        console.error('Unexpected error loading profile data:', err);
      } finally {
        setDataLoaded(true);
      }
    };

    loadAllData();
  }, [id]);

  const toggleInterest = (opt) => {
    setSelectedInterests((prev) => {
      const has = prev.some((p) => p.value === opt.value);
      if (has) return prev.filter((p) => p.value !== opt.value);
      return [...prev, opt];
    });
  };

  const handleSubmit = async () => {
    setErrMsg('');
    setSubmitted(true);
    if (
      !nativeLanguage ||
      !targetLanguage ||
      !targetLanguageProficiency ||
      !age ||
      !profession
    ) {
      setError(true);
      return;
    }
    setError(false);
    try {
      await handleProfileUpdateAPI(
        id,
        nativeLanguage,
        targetLanguage,
        targetLanguageProficiency,
        age,
        gender,
        profession,
        mbti,
        zodiac,
        defaultTimeZone || 'UTC',
        visibility,
        learningGoal,
        communicationStyle,
        commitmentLevel,
        bio.trim()
      );
      await handleReplaceUserInterests(
        id,
        selectedInterests.map((i) => i.value)
      );
      await handleReplaceUserAvailability(id, availabilitySlots);
      navigate({
        pathname: '/Dashboard',
        search: createSearchParams({ id }).toString(),
      });
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.message ||
        (Array.isArray(data?.validationErrors) ? data.validationErrors.join(' ') : null) ||
        'Failed to update profile.';
      setErrMsg(msg);
      console.error(err);
    }
  };

  const handleBack = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id }).toString(),
    });
  };

  if (!dataLoaded) {
    return (
      <div className="up-page">
        <Navbar id={id} />
        <div className="up-center">
          <div className="up-card" style={{ textAlign: 'center', padding: 60 }}>
            <p
              style={{
                color: '#364659',
                fontFamily: 'var(--dl-font)',
                fontSize: 18,
              }}
            >
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-page up-page--ref">
      <Navbar id={id} />
      <div className="up-center up-center--ref">
        <div className="up-card up-card--ref">
          <header className="up-ref-hero">
            <h1 className="up-title up-ref-title">Make your profile</h1>
            <p className="up-subtitle up-ref-sub">
              Add a photo and bio so partners know you. Languages and interests power Discover.
            </p>
            <p className="up-ref-sub-ko" lang="ko">
              사진과 소개를 추가해 주세요
            </p>
          </header>

          <div className="up-messages">
            {error && (
              <div className="up-error">
                Please fill in native language, target language, level, age, and profession.
              </div>
            )}
            {errMsg && <div className="up-error">{errMsg}</div>}
          </div>

          <form className="up-form up-form--ref" onSubmit={(e) => e.preventDefault()}>
            <div className="up-ref-photo">
              <ProfileImageSection
                id={id}
                currentImage={profileImage}
                onImageChange={(path) => setProfileImage(path)}
              />
              <p className="up-ref-photo-hint">Tap to upload or change your photo</p>
            </div>

            <div className="up-group">
              <label className="up-label up-ref-label" htmlFor="profile-bio">
                Bio
              </label>
              <textarea
                id="profile-bio"
                className="up-ref-textarea"
                rows={4}
                maxLength={2000}
                placeholder="Tell partners about yourself — why you’re learning, what you like to talk about…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="up-ref-grid2">
              <div className="up-group">
                <label className="up-label up-ref-label">I speak</label>
                <Select
                  styles={selectStyles}
                  options={NativeLanguage}
                  onChange={(s) => setNativeLanguage(s?.value ?? '')}
                  value={pickSingle(NativeLanguage, nativeLanguage)}
                  placeholder="Language"
                />
              </div>
              <div className="up-group">
                <label className="up-label up-ref-label">I&apos;m learning</label>
                <Select
                  styles={selectStyles}
                  options={TargetLanguage}
                  onChange={(s) => setTargetLanguage(s?.value ?? '')}
                  value={pickSingle(TargetLanguage, targetLanguage)}
                  placeholder="Language"
                />
              </div>
            </div>

            <div className="up-group">
              <label className="up-label up-ref-label">My level (target language)</label>
              <Select
                styles={selectStyles}
                options={TargetLanguageProficiency}
                onChange={(s) => setTargetLanguageProficiency(s?.value ?? '')}
                value={pickSingle(TargetLanguageProficiency, targetLanguageProficiency)}
                placeholder="Level"
              />
            </div>

            <div className="up-group">
              <label className="up-label up-ref-label">Interests (tap to select)</label>
              <div className="up-ref-pills" role="group" aria-label="Interests">
                {allInterests.map((opt) => {
                  const on = selectedInterests.some((p) => p.value === opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`up-ref-pill${on ? ' up-ref-pill--on' : ''}`}
                      onClick={() => toggleInterest(opt)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="up-ref-grid2">
              <div className="up-group">
                <label className="up-label up-ref-label" htmlFor="profile-age">
                  Age
                </label>
                <input
                  id="profile-age"
                  className="up-input up-ref-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="up-group">
                <label className="up-label up-ref-label">Profession</label>
                <Select
                  styles={selectStyles}
                  options={Profession}
                  onChange={(s) => setProfession(s?.value ?? '')}
                  value={pickSingle(Profession, profession)}
                  placeholder="Select"
                />
              </div>
            </div>

            <details className="up-ref-details">
              <summary className="up-ref-summary">Schedule &amp; visibility</summary>
              <div className="up-ref-details-body">
                <div className="up-group">
                  <label className="up-label up-ref-label">Time zone</label>
                  <Select
                    styles={selectStyles}
                    options={TimeZones}
                    onChange={(s) => setDefaultTimeZone(s?.value ?? '')}
                    value={pickSingle(TimeZones, defaultTimeZone)}
                  />
                </div>
                <div className="up-group">
                  <label className="up-label up-ref-label">Profile visibility</label>
                  <Select
                    styles={selectStyles}
                    options={VisibilityOptions}
                    onChange={(s) => setVisibility(s?.value ?? '')}
                    value={pickSingle(VisibilityOptions, visibility)}
                  />
                </div>
                <div className="up-group">
                  <label className="up-label up-ref-label">Weekly availability</label>
                  <WeeklyAvailabilityGrid
                    className="weekly-availability-grid--compact"
                    slots={availabilitySlots}
                    onSlotsChange={setAvailabilitySlots}
                    enableDrag
                  />
                </div>
              </div>
            </details>

            <details className="up-ref-details">
              <summary className="up-ref-summary">Learning preferences &amp; personality</summary>
              <div className="up-ref-details-body">
                <div className="up-group">
                  <label className="up-label up-ref-label">Learning focus (for matching)</label>
                  <Select
                    styles={selectStyles}
                    options={LearningGoalOptions}
                    onChange={(s) => setLearningGoal(s?.value ?? '')}
                    value={pickSingle(LearningGoalOptions, learningGoal)}
                    isClearable
                  />
                </div>
                <div className="up-group">
                  <label className="up-label up-ref-label">Communication style</label>
                  <Select
                    styles={selectStyles}
                    options={CommunicationStyleOptions}
                    onChange={(s) => setCommunicationStyle(s?.value ?? '')}
                    value={pickSingle(CommunicationStyleOptions, communicationStyle)}
                    isClearable
                  />
                </div>
                <div className="up-group">
                  <label className="up-label up-ref-label">Commitment</label>
                  <div className="up-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`up-star ${n <= commitmentLevel ? 'up-star-active' : 'up-star-inactive'}`}
                        onClick={() => setCommitmentLevel(n)}
                        aria-label={`${n} of 5`}
                      >
                        &#9733;
                      </button>
                    ))}
                  </div>
                </div>
                <div className="up-ref-grid2">
                  <div className="up-group">
                    <label className="up-label up-ref-label">Gender</label>
                    <Select
                      styles={selectStyles}
                      options={Gender}
                      onChange={(s) => setGender(s?.value ?? '')}
                      value={pickSingle(Gender, gender)}
                      isClearable
                    />
                  </div>
                  <div className="up-group">
                    <label className="up-label up-ref-label">MBTI</label>
                    <Select
                      styles={selectStyles}
                      options={MBTI}
                      onChange={(s) => setMBTI(s?.value ?? '')}
                      value={pickSingle(MBTI, mbti)}
                      isClearable
                    />
                  </div>
                </div>
                <div className="up-group">
                  <label className="up-label up-ref-label">Zodiac</label>
                  <Select
                    styles={selectStyles}
                    options={Zodiac}
                    onChange={(s) => setZodiac(s?.value ?? '')}
                    value={pickSingle(Zodiac, zodiac)}
                    isClearable
                  />
                </div>
              </div>
            </details>

            <div className="up-wizard-footer up-ref-footer">
              <button type="button" className="back-to-dashboard" onClick={handleBack}>
                Back
              </button>
              <button type="button" className="up-btn-primary up-ref-save" onClick={handleSubmit}>
                Save profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateProfile;
