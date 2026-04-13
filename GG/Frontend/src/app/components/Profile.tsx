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

function fieldLabel(text: string) {
  return (
    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
      {text}
    </div>
  );
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
        <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700">
          {t('Sign in to edit your profile', '로그인하여 프로필을 편집하세요')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const photoSrc = imageUrl(profileImage);

  const saveLabel = hasProfile ? t('Save changes', '변경 저장') : t('Create profile', '프로필 만들기');
  const saveDisabled = saving || interests.filter((n) => n.trim()).length === 0;
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || t('My profile', '내 프로필');

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500';
  const selectClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500';

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl max-h-[calc(100dvh-8rem)] flex-col px-4 py-3 sm:max-h-[calc(100dvh-9rem)] sm:px-5 sm:py-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
        <div className="shrink-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-5 pb-5 pt-5 text-center sm:px-6 sm:pb-6 sm:pt-6">
          <div className="mb-2 flex justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative block"
                title={t('Change photo', '사진 변경')}
              >
                <span className="block h-20 w-20 overflow-hidden rounded-full border-4 border-white/40 shadow-md sm:h-24 sm:w-24">
                  {photoSrc ? (
                    <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-semibold text-white">
                      {(firstName[0] || '?').toUpperCase()}
                    </span>
                  )}
                </span>
                {!photoSrc ? (
                  <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-violet-700 shadow-md hover:bg-violet-50">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">{t('My profile', '내 프로필')}</h1>
          <p className="mt-0.5 text-base font-semibold text-white/95 sm:text-lg">{displayName}</p>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/90 sm:text-sm">
            <span>{nativeLanguage}</span>
            <span aria-hidden>↔</span>
            <span>{targetLanguage}</span>
          </div>
          {photoSrc ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="mt-3 text-sm font-medium text-white/90 underline-offset-2 hover:text-white hover:underline"
            >
              {t('Remove photo', '사진 제거')}
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4 pb-5 space-y-3 sm:p-5 sm:pb-6 sm:space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              {fieldLabel(t('First name', '이름'))}
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel(t('Last name', '성'))}
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            {fieldLabel(t('Bio', '소개'))}
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={t('Tell partners about yourself…', '파트너에게 자신을 소개해 보세요…')}
              className={`${inputClass} min-h-[56px] resize-none`}
            />
            <p className="mt-1 text-xs text-neutral-400">{bio.length}/2000</p>
          </div>

          <div>
            {fieldLabel(
              `${t('Interests', '관심사')} · ${t('at least one', '하나 이상')}`
            )}
            <div className="grid grid-cols-4 gap-1.5">
              {PROFILE_INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    interests.includes(interest)
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {extraInterests.length > 0 ? (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-neutral-500">{t('Other interests', '기타 관심사')}</p>
                <div className="flex flex-wrap gap-2">
                  {extraInterests.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeInterest(name)}
                        className="rounded-full p-0.5 leading-none hover:bg-neutral-200"
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
              {fieldLabel(t('I speak', '모국어'))}
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className={selectClass}
              >
                <option>English</option>
                <option>Korean</option>
              </select>
            </div>
            <div>
              {fieldLabel(t('Learning', '배우는 언어'))}
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className={selectClass}
              >
                <option>Korean</option>
                <option>English</option>
              </select>
            </div>
          </div>

          <div>
            {fieldLabel(t('Level', '레벨'))}
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className={selectClass}
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
                {fieldLabel('Age')}
                <input
                  type="number"
                  min={13}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                {fieldLabel('Gender')}
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={selectClass}
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
                {fieldLabel(t('Learning goal', '학습 목표'))}
                <select
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  className={selectClass}
                >
                  {opts.learningGoals.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {fieldLabel(t('Communication style', '소통 스타일'))}
                <select
                  value={communicationStyle}
                  onChange={(e) => setCommunicationStyle(e.target.value)}
                  className={selectClass}
                >
                  {opts.communicationStyles.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {fieldLabel(t('Commitment (1–5)', '참여도 (1–5)'))}
                <input
                  type="range"
                  min={opts.commitmentLevel.min}
                  max={opts.commitmentLevel.max}
                  value={commitmentLevel}
                  onChange={(e) => setCommitmentLevel(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <p className="mt-0.5 text-xs text-neutral-500">{commitmentLevel}</p>
              </div>
            </>
          ) : null}

          <button
            type="button"
            disabled={saveDisabled}
            onClick={handleSave}
            className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
