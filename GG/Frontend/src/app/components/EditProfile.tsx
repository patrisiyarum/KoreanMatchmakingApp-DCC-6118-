import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Camera, ChevronRight, Loader2, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { publicAssetUrl } from '../utils/profileImage';
import {
  createProfile,
  deleteUserAccount,
  fetchUserGameStats,
  fetchProfileOptions,
  fetchUserAccount,
  fetchUserProfilePayload,
  uploadProfileImage,
  updateProfile,
  type ProfileOptions,
  type ProfileRow,
} from '@/api/profileApi';
import {
  fetchUserInterestNames,
  replaceUserInterestsApi,
  resolveInterestIds,
} from '@/api/matchmakingProfileApi';
import { PROFILE_INTEREST_OPTIONS } from '../constants/profileInterests';

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
  { value: 'Student', label: 'Student' },
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

function profilePayloadHasBioKey(profile: Record<string, unknown> | null | undefined): boolean {
  return profile != null && Object.prototype.hasOwnProperty.call(profile, 'bio');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditProfile() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [opts, setOpts] = useState<ProfileOptions | null>(null);

  // Account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Profile fields
  const [bio, setBio] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Korean');
  const [proficiency, setProficiency] = useState('Beginner');
  const [learningGoal, setLearningGoal] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState(3);
  const [age, setAge] = useState<number | ''>(22);
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [mbti, setMbti] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [defaultTimeZone, setDefaultTimeZone] = useState('');
  const [visibility, setVisibility] = useState('Show');
  const [interests, setInterests] = useState<string[]>([]);

  const [gameStats, setGameStats] = useState<{
    gamesPlayed: number;
    termMatching: number;
    grammarQuiz: number;
    pronunciation: number;
    perfectRounds: number;
  } | null>(null);

  const warnedBioColumnRef = useRef(false);

  const optionSet = new Set<string>([...PROFILE_INTEREST_OPTIONS]);
  const extraInterests = interests.filter((n) => !optionSet.has(n));

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const removeInterest = (label: string) => {
    setInterests((prev) => prev.filter((x) => x !== label));
  };

  const load = useCallback(async (): Promise<ProfileRow | null> => {
    if (!userId) return null;
    setLoading(true);
    let profile: ProfileRow | null = null;
    try {
      const [account, profileRow, statsRes, options, interestNames] = await Promise.all([
        fetchUserAccount(userId),
        fetchUserProfilePayload(userId),
        fetchUserGameStats(userId),
        fetchProfileOptions(),
        fetchUserInterestNames(userId).catch(() => [] as string[]),
      ]);
      profile = profileRow;
      setOpts(options);
      setGameStats(
        statsRes?.gameActivity
          ? {
              gamesPlayed: statsRes.gameActivity.gamesPlayed || 0,
              termMatching: statsRes.gameActivity.termMatching || 0,
              grammarQuiz: statsRes.gameActivity.grammarQuiz || 0,
              pronunciation: statsRes.gameActivity.pronunciation || 0,
              perfectRounds: statsRes.gameActivity.perfectRounds || 0,
            }
          : null
      );
      if (account) {
        setFirstName(account.firstName || '');
        setLastName(account.lastName || '');
        setProfileImage(account.profileImage ?? null);
      }
      if (profile && profile.id != null) {
        setHasProfile(true);
        setInterests(interestNames.length ? [...interestNames] : []);
        const raw = profile as Record<string, unknown>;
        if (profilePayloadHasBioKey(raw)) {
          setBio(profile.bio == null ? '' : String(profile.bio));
        }
        setNativeLanguage(profile.native_language || 'English');
        setTargetLanguage(profile.target_language || 'Korean');
        setProficiency(profile.target_language_proficiency || 'Beginner');
        setLearningGoal(profile.learning_goal || options?.learningGoals[0] || '');
        setCommunicationStyle(profile.communication_style || options?.communicationStyles[0] || '');
        setCommitmentLevel(profile.commitment_level ?? options?.commitmentLevel.default ?? 3);
        setAge(profile.age ?? 22);
        setGender(profile.gender || '');
        setProfession(profile.profession || '');
        setMbti(profile.mbti || '');
        setZodiac(profile.zodiac || '');
        setDefaultTimeZone(profile.default_time_zone || '');
        setVisibility(profile.visibility || 'Show');
      } else {
        setHasProfile(false);
        setBio('');
        setInterests([]);
        setLearningGoal(options?.learningGoals[0] || '');
        setCommunicationStyle(options?.communicationStyles[0] || '');
        setCommitmentLevel(options?.commitmentLevel.default ?? 3);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('Could not load profile', '프로필을 불러오지 못했습니다'));
    } finally {
      setLoading(false);
    }
    return profile;
  }, [userId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!userId) return;
    if (!opts && !hasProfile) {
      toast.error(t('Loading options… try again.', '옵션 로딩 중… 다시 시도하세요.'));
      return;
    }
    const trimmedInterests = [...new Set(interests.map((n) => n.trim()).filter(Boolean))];
    if (trimmedInterests.length === 0) {
      toast.error(t('Select at least one interest.', '관심사를 하나 이상 선택하세요.'));
      return;
    }
    setSaving(true);
    try {
      const profileBody = {
        id: Number(userId),
        native_language: nativeLanguage,
        target_language: targetLanguage,
        target_language_proficiency: proficiency,
        age: age === '' ? undefined : age,
        gender,
        profession,
        mbti,
        zodiac,
        default_time_zone: defaultTimeZone,
        visibility,
        learning_goal: learningGoal || opts?.learningGoals[0] || '',
        communication_style: communicationStyle || opts?.communicationStyles[0] || '',
        commitment_level: commitmentLevel,
        bio: bio.trim() || undefined,
      };

      if (!hasProfile) {
        const res = await createProfile(profileBody);
        if (res.errorCode !== 0) {
          toast.error(
            res.message ||
              t(
                'Save failed. Check required profile fields and try again.',
                '저장 실패. 필수 프로필 항목을 확인한 뒤 다시 시도하세요.'
              )
          );
          return;
        }
        setHasProfile(true);
        toast.success(t('Profile created', '프로필이 생성되었습니다'));
      } else {
        const res = await updateProfile({
          ...profileBody,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });
        if (res.errorCode !== 0) {
          toast.error(
            res.message ||
              t(
                'Save failed. Check required profile fields and try again.',
                '저장 실패. 필수 프로필 항목을 확인한 뒤 다시 시도하세요.'
              )
          );
          return;
        }
        toast.success(t('Profile saved', '프로필이 저장되었습니다'));
      }

      try {
        const ids = await resolveInterestIds(trimmedInterests);
        await replaceUserInterestsApi(userId, ids);
      } catch (ie: unknown) {
        console.error(ie);
        toast.error(t('Could not save interests', '관심사를 저장하지 못했습니다'));
      }

      const bioBeforeReload = bio.trim();
      const profileAfter = await load();
      const rawAfter = profileAfter as Record<string, unknown> | null;
      if (
        bioBeforeReload &&
        profileAfter?.id != null &&
        !profilePayloadHasBioKey(rawAfter) &&
        !warnedBioColumnRef.current
      ) {
        warnedBioColumnRef.current = true;
        toast.warning(
          t(
            'Bio is not stored on the server yet (database may be missing the UserProfile.bio column). Your text stays in this form until you refresh. Run migration 22 or import schema.mysql.sql.',
            '서버에 bio 컬럼이 없어 소개가 저장되지 않을 수 있습니다. 마이그레이션 22 또는 schema.mysql.sql을 적용하세요.'
          ),
          { duration: 8000 }
        );
      }
      navigate('/view-profile');
    } catch (e: unknown) {
      console.error(e);
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(ax.response?.data?.message || ax.message || t('Save failed', '저장 실패'));
    } finally {
      setSaving(false);
    }
  };

  if (!userId) {
    return (
      <div className="p-6 text-center text-neutral-600">
        <Link to="/login" className="text-blue-600 font-medium">
          {t('Sign in to edit your profile', '로그인하여 프로필을 편집하세요')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const saveDisabled = saving || interests.filter((n) => n.trim()).length === 0;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const photoSrc = publicAssetUrl(profileImage);

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5">

          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={async () => {
                if (!userId) return;
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
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
              <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-100 shadow-sm">
                {photoSrc ? (
                  <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-neutral-500" />
                )}
              </span>
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
              {t('Your Name', '이름')}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                const parts = e.target.value.trim().split(/\s+/);
                setFirstName(parts[0] || '');
                setLastName(parts.slice(1).join(' '));
              }}
              placeholder={t('Enter your name • 이름을 입력하세요', '이름을 입력하세요')}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ── Languages ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Native Language', '모국어')}
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NativeLanguageOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("I'm learning", '배우는 언어')}
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
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
              {t('My Level', '레벨')}
            </label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
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
              {t('Age', '나이')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={age === '' ? '' : String(age)}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                setAge(digits === '' ? '' : Number(digits));
              }}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ── Gender & Profession ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Gender', '성별')}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>{t('Select gender', '성별 선택')}</option>
                {GenderOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Profession', '직업')}
              </label>
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>{t('Select profession', '직업 선택')}</option>
                {ProfessionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── MBTI & Zodiac ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">MBTI</label>
              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
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
                {t('Zodiac', '별자리')}
              </label>
              <select
                value={zodiac}
                onChange={(e) => setZodiac(e.target.value)}
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
              {t('Time Zone', '시간대')}
            </label>
            <select
              value={defaultTimeZone}
              onChange={(e) => setDefaultTimeZone(e.target.value)}
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
              {t('Profile Visibility', '프로필 공개')}
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
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
              {t('Learning Goal', '학습 목표')}
            </label>
            <select
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
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
              {t('Communication Style', '소통 방식')}
            </label>
            <select
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
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
              {t('Commitment Level', '헌신도')}{' '}
              <span className="text-xs text-neutral-500">
                ({commitmentLevel <= 2 ? t('Casual', '캐주얼') : commitmentLevel >= 4 ? t('Very committed', '매우 헌신적') : t('Moderate', '보통')})
              </span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCommitmentLevel(n)}
                  className={`text-2xl transition-colors ${n <= commitmentLevel ? 'text-yellow-400' : 'text-neutral-300'}`}
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
              {t('Interests', '관심사')}{' '}
              <span className="text-xs text-neutral-500">({t('select at least one', '하나 이상 선택')})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PROFILE_INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    interests.includes(interest)
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {extraInterests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {extraInterests.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-800"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeInterest(name)}
                      className="rounded-full p-0.5 hover:bg-neutral-300 leading-none"
                      aria-label={t('Remove', '제거')}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Bio ── */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio <span className="text-neutral-500">{t('(optional)', '(선택)')}</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={t('Short intro…', '짧은 소개…')}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* ── Save ── */}
          <button
            type="button"
            disabled={saveDisabled}
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{hasProfile ? t('Save changes', '변경 저장') : t('Create profile', '프로필 만들기')}</span>
            {!saving ? <ChevronRight className="w-5 h-5" /> : null}
          </button>

          {/* ── Delete profile ── */}
          {hasProfile && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('Delete profile', '프로필 삭제')}
            </button>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => { if (!deleting) setShowDeleteModal(false); }}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-200 p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-neutral-900">
              {t('Delete your profile?', '프로필을 삭제하시겠습니까?')}
            </h3>
            <p className="text-sm text-neutral-600">
              {t(
                'This permanently removes your account, profile, friends, messages, and game progress. This cannot be undone.',
                '계정, 프로필, 친구, 메시지, 게임 진행 상황이 영구적으로 삭제됩니다. 되돌릴 수 없습니다.'
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 transition-colors"
              >
                {t('Cancel', '취소')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (!userId) return;
                  setDeleting(true);
                  const res = await deleteUserAccount(userId);
                  setDeleting(false);
                  if (!res.ok) {
                    toast.error(res.message || t('Could not delete profile', '프로필을 삭제하지 못했습니다'));
                    return;
                  }
                  toast.success(t('Profile deleted', '프로필이 삭제되었습니다'));
                  setShowDeleteModal(false);
                  logout();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('Delete', '삭제')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}