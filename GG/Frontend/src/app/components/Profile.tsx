import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getApiBase } from '@/api/apiBase';
import {
  createProfile,
  fetchProfileOptions,
  fetchUserAccount,
  fetchUserProfilePayload,
  removeProfileImage,
  updateProfile,
  uploadProfileImage,
  type ProfileOptions,
  type ProfileRow,
} from '@/api/profileApi';
import {
  fetchUserInterestNames,
  replaceUserInterestsApi,
  resolveInterestIds,
} from '@/api/matchmakingProfileApi';
import { PROFILE_INTEREST_OPTIONS } from '../constants/profileInterests';

function profilePayloadHasBioKey(profile: Record<string, unknown> | null | undefined): boolean {
  return profile != null && Object.prototype.hasOwnProperty.call(profile, 'bio');
}

const PROFICIENCIES = ['Beginner', 'Elementary', 'Intermediate', 'Proficient', 'Fluent'];

function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiBase()}${path}`;
}

export function Profile() {
  const { userId } = useAuth();
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [opts, setOpts] = useState<ProfileOptions | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Korean');
  const [proficiency, setProficiency] = useState('Beginner');
  const [learningGoal, setLearningGoal] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState(3);
  const [age, setAge] = useState(22);
  const [gender, setGender] = useState('Other');
  const [profession, setProfession] = useState('Other');
  const [interests, setInterests] = useState<string[]>([]);
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
      const [account, profileRow, options, interestNames] = await Promise.all([
        fetchUserAccount(userId),
        fetchUserProfilePayload(userId),
        fetchProfileOptions(),
        fetchUserInterestNames(userId).catch(() => [] as string[]),
      ]);
      profile = profileRow;
      setOpts(options);
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
        setGender(profile.gender || 'Other');
        setProfession(profile.profession || 'Other');
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

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    try {
      const { profileImage: path } = await uploadProfileImage(userId, file);
      setProfileImage(path);
      toast.success(t('Photo updated', '사진이 업데이트되었습니다'));
    } catch {
      toast.error(t('Upload failed', '업로드 실패'));
    }
    e.target.value = '';
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;
    try {
      await removeProfileImage(userId);
      setProfileImage(null);
      toast.success(t('Photo removed', '사진이 제거되었습니다'));
    } catch {
      toast.error(t('Could not remove photo', '사진을 제거하지 못했습니다'));
    }
  };

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
      if (!hasProfile) {
        const body = {
          id: Number(userId),
          native_language: nativeLanguage,
          target_language: targetLanguage,
          target_language_proficiency: proficiency,
          age,
          gender,
          profession,
          mbti: 'INTJ',
          zodiac: 'Aries',
          default_time_zone: 'UTC',
          visibility: 'Show',
          learning_goal: learningGoal || opts!.learningGoals[0],
          communication_style: communicationStyle || opts!.communicationStyles[0],
          commitment_level: commitmentLevel,
          bio: bio.trim() || undefined,
        };
        const res = await createProfile(body);
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
        try {
          const ids = await resolveInterestIds(trimmedInterests);
          await replaceUserInterestsApi(userId, ids);
        } catch (ie: unknown) {
          console.error(ie);
          toast.error(t('Could not save interests', '관심사를 저장하지 못했습니다'));
        }
      } else {
        const res = await updateProfile({
          id: Number(userId),
          native_language: nativeLanguage,
          target_language: targetLanguage,
          target_language_proficiency: proficiency,
          bio: bio.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          learning_goal: learningGoal,
          communication_style: communicationStyle,
          commitment_level: commitmentLevel,
          age,
          gender,
          profession,
          mbti: 'INTJ',
          zodiac: 'Aries',
          default_time_zone: 'UTC',
          visibility: 'Show',
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
        try {
          const ids = await resolveInterestIds(trimmedInterests);
          await replaceUserInterestsApi(userId, ids);
        } catch (ie: unknown) {
          console.error(ie);
          toast.error(t('Could not save interests', '관심사를 저장하지 못했습니다'));
        }
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
    } catch (e: unknown) {
      console.error(e);
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        ax.response?.data?.message ||
          ax.message ||
          t('Save failed', '저장 실패')
      );
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

  const photoSrc = imageUrl(profileImage);

  const saveLabel = hasProfile ? t('Save changes', '변경 저장') : t('Create profile', '프로필 만들기');
  const saveDisabled = saving || interests.filter((n) => n.trim()).length === 0;
  const primarySaveClass =
    'rounded-xl bg-blue-600 text-white py-2 px-4 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0';

  return (
    <div className="flex min-h-0 max-h-[calc(100dvh-10rem)] sm:max-h-[calc(100dvh-11rem)] max-w-lg mx-auto w-full flex-col px-3 pt-2 pb-2 gap-2">
      <div className="shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">{t('My profile', '내 프로필')}</h1>
          <p className="text-[11px] sm:text-xs text-neutral-600 mt-0.5">
            {t('Photo, bio, interests, and languages', '사진, 소개, 관심사, 언어')}
          </p>
        </div>
        <button type="button" disabled={saveDisabled} onClick={handleSave} className={primarySaveClass}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saveLabel}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-2 border-neutral-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-neutral-200 flex items-center justify-center text-2xl text-neutral-500">
                {(firstName[0] || '?').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700"
              title={t('Change photo', '사진 변경')}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handlePhoto}
            />
          </div>
          {photoSrc ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-xs text-red-600 hover:underline"
            >
              {t('Remove photo', '사진 제거')}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t('First name', '이름')}
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t('Last name', '성')}
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            {t('Bio', '소개')}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t('Tell partners about yourself…', '파트너에게 자신을 소개해 보세요…')}
            className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm resize-none min-h-[72px]"
          />
          <p className="text-[11px] text-neutral-400 mt-0.5">{bio.length}/2000</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            {t('Interests', '관심사')}{' '}
            <span className="text-neutral-500 font-normal">({t('at least one', '하나 이상')})</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {PROFILE_INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${
                  interests.includes(interest)
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          {extraInterests.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs text-neutral-500 mb-1.5">{t('Other interests', '기타 관심사')}</p>
              <div className="flex flex-wrap gap-2">
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
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t('I speak', '모국어')}
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs sm:text-sm"
            >
              <option>English</option>
              <option>Korean</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t('Learning', '배우는 언어')}
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs sm:text-sm"
            >
              <option>Korean</option>
              <option>English</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            {t('Level', '레벨')}
          </label>
          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs sm:text-sm"
          >
            {PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {!hasProfile ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Age</label>
              <input
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs sm:text-sm"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        ) : null}

        {opts ? (
          <>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {t('Learning goal', '학습 목표')}
              </label>
              <select
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs sm:text-sm"
              >
                {opts.learningGoals.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {t('Communication style', '소통 스타일')}
              </label>
              <select
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs sm:text-sm"
              >
                {opts.communicationStyles.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {t('Commitment (1–5)', '참여도 (1–5)')}
              </label>
              <input
                type="range"
                min={opts.commitmentLevel.min}
                max={opts.commitmentLevel.max}
                value={commitmentLevel}
                onChange={(e) => setCommitmentLevel(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[11px] text-neutral-500">{commitmentLevel}</p>
            </div>
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
}
