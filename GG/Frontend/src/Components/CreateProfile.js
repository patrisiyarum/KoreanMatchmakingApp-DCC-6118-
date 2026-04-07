import { useState, useEffect } from 'react';
import React from "react";
import './Registration.css'; 
import './UpdateProfile.css';  // ← Use UpdateProfile.css for white box
import Select from "react-select";
import ProfileImageSection from './ProfileImageSection';

import {
  handleProfileCreationAPI,
  handleGetAllInterests,
  handleReplaceUserInterests,
  handleReplaceUserAvailability
} from '../Services/userService';

import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";

function CreateProfile() {
  // Profile fields
  const [profileImage, setProfileImage] = useState(null);
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

  // Interests
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Availability
  const [availability, setAvailability] = useState([]);

  // UI state
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const [showOptional, setShowOptional] = useState(false);

  const [search] = useSearchParams();
  const id = search.get("id");
  const navigate = useNavigate();

  // Options (exact same as UpdateProfile)
  const NativeLanguage = [
    { value: "English", label: "English" },
    { value: "Korean", label: "Korean" },
  ];

  const TargetLanguage = [
    { value: "English", label: "English" },
    { value: "Korean", label: "Korean" },
  ];

  const TargetLanguageProficiency = [
    { value: "Beginner", label: "Beginner" },
    { value: "Elementary", label: "Elementary" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Proficient", label: "Proficient" },
    { value: "Fluent", label: "Fluent" },
  ];

  const Gender = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const Profession = [
    { value: "Education", label: "Education" },
    { value: "Engineering", label: "Engineering" },
    { value: "Retail", label: "Retail" },
    { value: "Finance", label: "Finance" },
    { value: "Law", label: "Law" },
    { value: "Medicine", label: "Medicine" },
    { value: "Scientist", label: "Scientist" },
  ];

  const Zodiac = [
    { value: "Aries", label: "Aries" },
    { value: "Taurus", label: "Taurus" },
    { value: "Gemini", label: "Gemini" },
    { value: "Cancer", label: "Cancer" },
    { value: "Leo", label: "Leo" },
    { value: "Virgo", label: "Virgo" },
    { value: "Libra", label: "Libra" },
    { value: "Scorpio", label: "Scorpio" },
    { value: "Sagittarius", label: "Sagittarius" },
    { value: "Capricorn", label: "Capricorn" },
    { value: "Aquarius", label: "Aquarius" },
    { value: "Pisces", label: "Pisces" },
  ];

  const TimeZones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "America/New_York" },
    { value: "America/Chicago", label: "America/Chicago" },
    { value: "America/Denver", label: "America/Denver" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles" },
    { value: "Europe/London", label: "Europe/London" },
    { value: "Europe/Paris", label: "Europe/Paris" },
    { value: "Asia/Seoul", label: "Asia/Seoul" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  ];

  const MBTI = [
    { value: "INTJ", label: "INTJ" },
    { value: "INTP", label: "INTP" },
    { value: "ENTJ", label: "ENTJ" },
    { value: "ENTP", label: "ENTP" },
    { value: "INFJ", label: "INFJ" },
    { value: "INFP", label: "INFP" },
    { value: "ENFJ", label: "ENFJ" },
    { value: "ENFP", label: "ENFP" },
    { value: "ISTJ", label: "ISTJ" },
    { value: "ISFJ", label: "ISFJ" },
    { value: "ESTJ", label: "ESTJ" },
    { value: "ESFJ", label: "ESFJ" },
    { value: "ISTP", label: "ISTP" },
    { value: "ISFP", label: "ISFP" },
    { value: "ESTP", label: "ESTP" },
    { value: "ESFP", label: "ESFP" },
  ];

  const VisibilityOptions = [
    { value: "Show", label: "Show" },
    { value: "Hide", label: "Hide" },
  ];

  // Availability options builder
  const generateHourlySlots = (day) => {
    const slots = [];
    for (let hour = 8; hour < 21; hour++) {
      const start = String(hour).padStart(2, '0') + ':00';
      const end = String(hour + 1).padStart(2, '0') + ':00';

      const formatHour = (h) => {
        const suffix = h >= 12 ? 'pm' : 'am';
        const display = ((h + 11) % 12 + 1);
        return `${display}${suffix}`;
      };

      const label = `${day} ${formatHour(hour)}-${formatHour(hour + 1)}`;

      slots.push({
        value: { day_of_week: day, start_time: start, end_time: end },
        label,
      });
    }
    return slots;
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const availabilityOptions = days.flatMap(generateHourlySlots);

  const pickSingle = (options, value) => options.find(o => o.value === value) || null;

  const selectStyles = {
    control: (base) => ({ ...base, borderRadius: 6, borderColor: '#d4d4d8', fontSize: 14, fontFamily: "var(--dl-font)" }),
    option: (base) => ({ ...base, fontSize: 14, fontFamily: "var(--dl-font)" }),
    menu: (base) => ({ ...base, zIndex: 10 }),
  };

  // Fetch all interests
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await handleGetAllInterests();
        const interestArray = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        const formatted = interestArray.map(i => ({
          value: i.id,
          label: i.interest_name
        }));
        setAllInterests(formatted);
      } catch (err) {
        console.error('Failed to fetch interests:', err);
      }
    };
    fetchInterests();
  }, []);

  // Handlers
  const handleNativeLanguage = (selectedOption) => setNativeLanguage(selectedOption?.value ?? '');
  const handleTargetLanguage = (selectedOption) => setTargetLanguage(selectedOption?.value ?? '');
  const handleTargetLanguageProficiency = (selectedOption) => setTargetLanguageProficiency(selectedOption?.value ?? '');
  const handleAge = (e) => setAge(e.target.value);
  const handleGender = (selectedOption) => setGender(selectedOption?.value ?? '');
  const handleProfession = (selectedOption) => setProfession(selectedOption?.value ?? '');
  const handleZodiac = (selectedOption) => setZodiac(selectedOption?.value ?? '');
  const handleMBTI = (selectedOption) => setMBTI(selectedOption?.value ?? '');
  const handleInterestsChange = (selectedOptions) => setSelectedInterests(selectedOptions || []);
  const handleDefaultTimeZone = (selectedOption) => setDefaultTimeZone(selectedOption?.value ?? '');
  const handleAvailability = (selectedOptions) => setAvailability(selectedOptions || []);
  const handleVisibility = (selectedOption) => setVisibility(selectedOption?.value ?? '');

  const STEPS = [
    { title: 'Basics', subtitle: 'Languages + your current level' },
    { title: 'About you', subtitle: 'A couple quick details' },
    { title: 'Schedule', subtitle: 'Timezone + availability' },
    { title: 'Optional', subtitle: 'Extras that help matching' },
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

  const handlePrev = () => {
    setError(false);
    setStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrMsg('');

    if (
      nativeLanguage === '' ||
      targetLanguage === '' ||
      targetLanguageProficiency === '' ||
      age === '' ||
      profession === ''
    ) {
      setError(true);
      return;
    }

    setSubmitted(true);
    setError(false);

    try {
      await handleProfileCreationAPI(
        id,
        nativeLanguage,
        targetLanguage,
        targetLanguageProficiency,
        age,
        gender,
        profession,
        mbti,
        zodiac,
        defaultTimeZone,
        visibility
      );

      const interestIds = selectedInterests.map(i => i.value);
      await handleReplaceUserInterests(id, interestIds);

      const slots = availability.map(a => a.value);
      await handleReplaceUserAvailability(id, slots);

      navigate({
        pathname: "/Dashboard",
        search: createSearchParams({ id }).toString()
      });
    } catch (err) {
      if (err?.response?.data?.message) {
        setErrMsg(err.response.data.message);
      } else {
        setErrMsg("Failed to create profile.");
      }
      console.error(err);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate({
      pathname: "/Dashboard",
      search: createSearchParams({ id }).toString()
    });
  };

  return (
    <div className="up-page">
      <div className="up-center">
        <div className="up-card">
          <div className="up-header">
            <div>
              <h1 className="up-title">Set Profile</h1>
              <p className="up-subtitle">Quick quiz—answer a few questions to get started.</p>
            </div>
            <div className="up-progress">
              <div className="up-progress-top">
                <span className="up-progress-step">{STEPS[step].title}</span>
                <span className="up-progress-pct">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
              </div>
              <div className="up-progress-track">
                <div className="up-progress-fill" style={{ width: `${Math.round(((step + 1) / STEPS.length) * 100)}%` }} />
              </div>
              <div className="up-progress-sub">{STEPS[step].subtitle}</div>
            </div>
          </div>

          <div className="up-messages">
            {error && <div className="up-error">Please enter all required fields.</div>}
            {submitted && !errMsg && <div className="up-success">Profile created successfully!</div>}
            {errMsg && <div className="up-error">{errMsg}</div>}
          </div>

          <form className="up-form" onSubmit={(e) => e.preventDefault()}>
            {step === 0 && (
              <div className="up-step">
                <div className="up-group">
                  <ProfileImageSection
                    id={id}
                    currentImage={profileImage}
                    onImageChange={(path) => setProfileImage(path)}
                  />
                </div>

                <div className="up-step-grid">
                  <div className="up-group">
                    <label className="up-label">Native Language *</label>
                    <Select styles={selectStyles} options={NativeLanguage} onChange={handleNativeLanguage} value={pickSingle(NativeLanguage, nativeLanguage)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Target Language *</label>
                    <Select styles={selectStyles} options={TargetLanguage} onChange={handleTargetLanguage} value={pickSingle(TargetLanguage, targetLanguage)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Proficiency Level *</label>
                    <Select styles={selectStyles} options={TargetLanguageProficiency} onChange={handleTargetLanguageProficiency} value={pickSingle(TargetLanguageProficiency, targetLanguageProficiency)} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="up-step">
                <div className="up-step-grid">
                  <div className="up-group">
                    <label className="up-label">Age *</label>
                    <input placeholder="Enter age" onChange={handleAge} className="up-input" type="text" value={age} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Profession *</label>
                    <Select styles={selectStyles} options={Profession} onChange={handleProfession} value={pickSingle(Profession, profession)} />
                  </div>
                </div>

                <button className="up-accordion" type="button" onClick={() => setShowOptional(v => !v)}>
                  {showOptional ? 'Hide optional details' : 'Add optional details'}
                </button>

                {showOptional && (
                  <div className="up-step-grid">
                    <div className="up-group">
                      <label className="up-label">Gender</label>
                      <Select styles={selectStyles} options={Gender} onChange={handleGender} value={pickSingle(Gender, gender)} />
                    </div>
                    <div className="up-group">
                      <label className="up-label">Personality Type (MBTI)</label>
                      <Select styles={selectStyles} options={MBTI} onChange={handleMBTI} value={pickSingle(MBTI, mbti)} />
                    </div>
                    <div className="up-group">
                      <label className="up-label">Zodiac</label>
                      <Select styles={selectStyles} options={Zodiac} onChange={handleZodiac} value={pickSingle(Zodiac, zodiac)} />
                    </div>
                    <div className="up-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="up-label">Interests</label>
                      <Select styles={selectStyles} isMulti options={allInterests} onChange={handleInterestsChange} value={selectedInterests} />
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
                    <Select styles={selectStyles} options={TimeZones} onChange={handleDefaultTimeZone} value={pickSingle(TimeZones, defaultTimeZone)} />
                  </div>
                  <div className="up-group">
                    <label className="up-label">Visibility</label>
                    <Select styles={selectStyles} options={VisibilityOptions} onChange={handleVisibility} value={pickSingle(VisibilityOptions, visibility)} />
                  </div>
                  <div className="up-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="up-label">Availability</label>
                    <Select styles={selectStyles} isMulti options={availabilityOptions} value={availability} onChange={handleAvailability} placeholder="Pick a few times you're usually free..." />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="up-step">
                <div className="up-step-grid">
                  <div className="up-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="up-label">You’re all set</label>
                    <div className="up-hint">
                      You can always edit your profile later. Ready to start matching and playing games?
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="up-wizard-footer">
              <button
                className="up-btn-secondary"
                type="button"
                onClick={step === 0 ? handleBack : handlePrev}
              >
                {step === 0 ? 'Back' : 'Back'}
              </button>

              {step < STEPS.length - 1 ? (
                <button className="up-btn-primary" type="button" onClick={handleNext}>
                  Continue
                </button>
              ) : (
                <button className="up-btn-primary" type="button" onClick={handleSubmit}>
                  Create Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateProfile;
