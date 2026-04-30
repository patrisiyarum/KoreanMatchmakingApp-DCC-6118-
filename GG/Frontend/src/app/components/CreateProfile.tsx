import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserInterestNames, replaceUserInterestsApi, resolveInterestIds } from '@/api/matchmakingProfileApi';
import { fetchUserAccount, fetchUserProfilePayload, uploadProfileImage, createProfile } from '@/api/profileApi';
import { PROFILE_INTEREST_OPTIONS } from '../constants/profileInterests';
import { UserAvatar } from './UserAvatar';

// ─── Option lists ─────────────────────────────────────────────────────────────

const NativeLanguageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Korean', label: 'Korean' },
];

const TargetLanguageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Korean', label: 'Korean' },
];

const TargetLanguageProficiencyOptions = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Elementary', label: 'Elementary' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Proficient', label: 'Proficient' },
  { value: 'Fluent', label: 'Fluent' },
];

const GenderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const ProfessionOptions = [
  { value: 'Education', label: 'Education' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Law', label: 'Law' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Scientist', label: 'Scientist' },
];

const ZodiacOptions = [
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

const TimeZoneOptions = [
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

const MBTIOptions = [
  { value: 'INTJ', label: 'INTJ' }, { value: 'INTP', label: 'INTP' },
  { value: 'ENTJ', label: 'ENTJ' }, { value: 'ENTP', label: 'ENTP' },
  { value: 'INFJ', label: 'INFJ' }, { value: 'INFP', label: 'INFP' },
  { value: 'ENFJ', label: 'ENFJ' }, { value: 'ENFP', label: 'ENFP' },
  { value: 'ISTJ', label: 'ISTJ' }, { value: 'ISFJ', label: 'ISFJ' },
  { value: 'ESTJ', label: 'ESTJ' }, { value: 'ESFJ', label: 'ESFJ' },
  { value: 'ISTP', label: 'ISTP' }, { value: 'ISFP', label: 'ISFP' },
  { value: 'ESTP', label: 'ESTP' }, { value: 'ESFP', label: 'ESFP' },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileMeetsDiscoverMinimum(
  p: Awaited<ReturnType<typeof fetchUserProfilePayload>>
): boolean {
  if (!p?.id) return false;
  const has = (v: unknown) => v != null && String(v).trim() !== '';
  return (
    has(p.native_language) &&
    has(p.target_language) &&
    has(p.target_language_proficiency) &&
    has(p.age) &&
    has(p.profession)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userId } = useAuth();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const [profile, setProfile] = useState({
    name: '',
    nativeLanguage: 'English',
    learningLanguage: 'Korean',
    level: 'Beginner',
    age: '' as number | '',
    gender: '',
    profession: '',
    mbti: '',
    zodiac: '',
    defaultTimeZone: '',
    visibility: 'Show',
    learningGoal: '',
    communicationStyle: '',
    commitmentLevel: 3,
    interests: [] as string[],
    bio: '',
  });

  const set = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!userId) {
      setBootLoading(false);
      return;
    }
    setBootLoading(true);
    let skipSpinnerOff = false;
    try {
      const [account, payload, interestNames] = await Promise.all([
        fetchUserAccount(userId),
        fetchUserProfilePayload(userId),
        fetchUserInterestNames(userId).catch(() => [] as string[]),
      ]);
      if (profileMeetsDiscoverMinimum(payload)) {
        skipSpinnerOff = true;
        navigate('/home', { replace: true });
        return;
      }
      if (account) {
        const n = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
        if (n) setProfile((prev) => ({ ...prev, name: prev.name || n }));
        setProfileImage(account.profileImage ?? null);
      }
      if (interestNames.length > 0) {
        setProfile((prev) => ({
          ...prev,
          interests: [...new Set([...prev.interests, ...interestNames])],
        }));
      }
    } catch {
      /* stay on form */
    } finally {
      if (!skipSpinnerOff) setBootLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleInterest = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleContinue = async () => {
    if (!userId) return;
    const fieldErrors: Record<string, string> = {};
    if (!profile.name.trim()) fieldErrors.name = t('Please enter your name', '이름을 입력해 주세요');
    if (profile.age === '' || Number(profile.age) <= 0) fieldErrors.age = t('Please enter a valid age', '유효한 나이를 입력해 주세요');
    if (!profile.gender) fieldErrors.gender = t('Please select your gender', '성별을 선택해 주세요');
    if (!profile.profession) fieldErrors.profession = t('Please select your profession', '직업을 선택해 주세요');
    if (profile.interests.length === 0) fieldErrors.interests = t('Please pick at least one interest', '관심사를 하나 이상 선택해 주세요');
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error(t('Please complete the highlighted fields', '강조된 항목을 완성해 주세요'));
      return;
    }
    setErrors({});
    const parts = profile.name.trim().split(/\s+/);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || '';
    setStarting(true);
    try {
      const res = await createProfile({
        id: Number(userId),
        native_language: profile.nativeLanguage,
        target_language: profile.learningLanguage,
        target_language_proficiency: profile.level,
        age: profile.age === '' ? undefined : profile.age,
        gender: profile.gender,
        profession: profile.profession,
        mbti: profile.mbti,
        zodiac: profile.zodiac,
        default_time_zone: profile.defaultTimeZone,
        visibility: profile.visibility,
        learning_goal: profile.learningGoal,
        communication_style: profile.communicationStyle,
        commitment_level: profile.commitmentLevel,
        bio: profile.bio.trim() || undefined,
        first_name: firstName,
        last_name: lastName,
      });
      if (res.errorCode !== 0) {
        toast.error(res.message || t('Could not save your profile', '프로필을 저장하지 못했습니다'));
        return;
      }
      try {
        const ids = await resolveInterestIds(profile.interests);
        await replaceUserInterestsApi(userId, ids);
      } catch {
        toast.error(t('Could not save interests', '관심사를 저장하지 못했습니다'));
      }
      navigate('/discover');
    } catch {
      toast.error(t('Could not save your profile', '프로필을 저장하지 못했습니다'));
    } finally {
      setStarting(false);
    }
  };

  const requiredAsterisk = <span className="text-red-500" aria-hidden> *</span>;
  const optionalTag = (
    <span className="text-xs text-neutral-400 font-normal ml-1">{t('(optional)', '(선택)')}</span>
  );
  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border ${
      errors[field] ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-blue-500'
    } focus:outline-none focus:ring-2`;
  const fieldError = (field: string) =>
    errors[field] ? <p className="text-xs text-red-600 mt-1">{errors[field]}</p> : null;

  // ── Loading / unauthenticated states ──────────────────────────────────────

  if (bootLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3 text-neutral-600">
        <p>{t('Sign in to set up your profile.', '로그인 후 프로필을 설정하세요.')}</p>
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          {t('Sign in', '로그인')}
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5">

          {/* ── Required-fields legend ── */}
          <p className="text-xs text-neutral-500 text-center">
            <span className="text-red-500">*</span> {t('Required field', '필수 항목')}
          </p>

          {/* ── Photo ── */}
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file || !userId) return;
                  try {
                    const res = await uploadProfileImage(userId, file);
                    setProfileImage(res.profileImage ?? null);
                    toast.success(t('Photo updated', '사진이 업데이트되었습니다'));
                  } catch {
                    toast.error(t('Upload failed', '업로드 실패'));
                  }
                };
                input.click();
              }}
              className="relative"
              aria-label={t('Upload profile photo', '프로필 사진 업로드')}
            >
              <UserAvatar
                seed={userId ?? `${profile.name}-new`}
                name={profile.name || 'You'}
                profileImage={profileImage}
                nativeLanguage={profile.nativeLanguage}
                size="2xl"
                className="border-2 border-neutral-200 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
            <p className="mt-2 text-xs text-neutral-500">
              {t('Profile photo (optional)', '프로필 사진 (선택)')}
            </p>
          </div>

          {/* ── Name ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Your Name', '이름')}{requiredAsterisk}
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => { set('name', e.target.value); clearError('name'); }}
              placeholder={t('Enter your name • 이름을 입력하세요', '이름을 입력하세요')}
              className={inputClass('name')}
            />
            {fieldError('name')}
          </div>

          {/* ── Languages ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Native Language', '모국어')}{requiredAsterisk}
              </label>
              <select
                value={profile.nativeLanguage}
                onChange={(e) => set('nativeLanguage', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NativeLanguageOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("I'm learning", '배우는 언어')}{requiredAsterisk}
              </label>
              <select
                value={profile.learningLanguage}
                onChange={(e) => set('learningLanguage', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TargetLanguageOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Proficiency ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('My Level', '레벨')}{requiredAsterisk}
            </label>
            <select
              value={profile.level}
              onChange={(e) => set('level', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TargetLanguageProficiencyOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Age ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Age', '나이')}{requiredAsterisk}
            </label>
            <input
              type="number"
              min={13}
              max={120}
              value={profile.age}
              onChange={(e) => { set('age', Number(e.target.value)); clearError('age'); }}
              className={inputClass('age')}
            />
            {fieldError('age')}
          </div>

          {/* ── Gender & Profession ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Gender', '성별')}{requiredAsterisk}
              </label>
              <select
                value={profile.gender}
                onChange={(e) => { set('gender', e.target.value); clearError('gender'); }}
                className={inputClass('gender')}
              >
                <option value="" disabled>{t('Select gender', '성별 선택')}</option>
                {GenderOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {fieldError('gender')}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Profession', '직업')}{requiredAsterisk}
              </label>
              <select
                value={profile.profession}
                onChange={(e) => { set('profession', e.target.value); clearError('profession'); }}
                className={inputClass('profession')}
              >
                <option value="" disabled>{t('Select profession', '직업 선택')}</option>
                {ProfessionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {fieldError('profession')}
            </div>
          </div>

          {/* ── MBTI & Zodiac ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">MBTI{optionalTag}</label>
              <select
                value={profile.mbti}
                onChange={(e) => set('mbti', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>{t('Select MBTI', 'MBTI 선택')}</option>
                {MBTIOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Zodiac', '별자리')}{optionalTag}
              </label>
              <select
                value={profile.zodiac}
                onChange={(e) => set('zodiac', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>{t('Select zodiac', '별자리 선택')}</option>
                {ZodiacOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Time Zone ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Time Zone', '시간대')}{optionalTag}
            </label>
            <select
              value={profile.defaultTimeZone}
              onChange={(e) => set('defaultTimeZone', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>{t('Select time zone', '시간대 선택')}</option>
              {TimeZoneOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Visibility ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Profile Visibility', '프로필 공개')}{optionalTag}
            </label>
            <select
              value={profile.visibility}
              onChange={(e) => set('visibility', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VisibilityOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Learning Goal ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Learning Goal', '학습 목표')}{optionalTag}
            </label>
            <select
              value={profile.learningGoal}
              onChange={(e) => set('learningGoal', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>{t('Select learning goal', '학습 목표 선택')}</option>
              {LearningGoalOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Communication Style ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Communication Style', '소통 방식')}{optionalTag}
            </label>
            <select
              value={profile.communicationStyle}
              onChange={(e) => set('communicationStyle', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>{t('Select communication style', '소통 방식 선택')}</option>
              {CommunicationStyleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Commitment Level ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Commitment Level', '헌신도')}{optionalTag}{' '}
              <span className="text-xs text-neutral-500">
                ({profile.commitmentLevel <= 2
                  ? t('Casual', '캐주얼')
                  : profile.commitmentLevel >= 4
                  ? t('Very committed', '매우 헌신적')
                  : t('Moderate', '보통')})
              </span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('commitmentLevel', n)}
                  className={`text-2xl transition-colors ${
                    n <= profile.commitmentLevel ? 'text-yellow-400' : 'text-neutral-300'
                  }`}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* ── Interests ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              {t('Interests', '관심사')}{requiredAsterisk}{' '}
              <span className="text-xs text-neutral-500">({t('select at least one', '하나 이상 선택')})</span>
            </label>
            <div
              className={`flex flex-wrap gap-2 ${
                errors.interests ? 'p-2 rounded-lg border border-red-500' : ''
              }`}
            >
              {PROFILE_INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => { toggleInterest(interest); clearError('interests'); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    profile.interests.includes(interest)
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {fieldError('interests')}
          </div>

          {/* ── Bio ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio <span className="text-neutral-500">{t('(optional)', '(선택)')}</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={t('Short intro…', '짧은 소개…')}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* ── Submit ── */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={starting}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{t('Create profile', '프로필 만들기')}</span>
            {!starting ? <ChevronRight className="w-5 h-5" /> : null}
          </button>
        </div>
      </motion.div>
    </div>
  );
}