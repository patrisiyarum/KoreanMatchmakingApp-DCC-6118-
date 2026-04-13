import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Camera, ChevronRight, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { publicAssetUrl } from '../utils/profileImage';
import {
  createProfile,
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

function profilePayloadHasBioKey(profile: Record<string, unknown> | null | undefined): boolean {
  return profile != null && Object.prototype.hasOwnProperty.call(profile, 'bio');
}

const PROFICIENCIES = ['Beginner', 'Elementary', 'Intermediate', 'Proficient', 'Fluent'];

export function Profile() {
  const { userId } = useAuth();
  const { t } = useLanguage();
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

  const saveLabel = hasProfile ? t('Save changes', '변경 저장') : t('Create profile', '프로필 만들기');
  const saveDisabled = saving || interests.filter((n) => n.trim()).length === 0;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const photoSrc = publicAssetUrl(profileImage);

  return (
    <div className="size-full flex items-center justify-center p-4">
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
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-100 shadow-sm">
                {photoSrc ? (
                  <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-10 w-10 text-neutral-500" />
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Your Name', '이름')} <span className="text-neutral-500">{t('이름', '이름')}</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('Native', '모국어')} <span className="text-neutral-500">{t('모국어', '모국어')}</span>
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>English</option>
                <option>Korean 한국어</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("I'm learning", '배우는 언어')} <span className="text-neutral-500">{t('배우는 언어', '배우는 언어')}</span>
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Korean 한국어</option>
                <option>English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('My Level', '레벨')} <span className="text-neutral-500">{t('레벨', '레벨')}</span>
            </label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROFICIENCIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              {t('Interests', '관심사')} <span className="text-neutral-500">{t('관심사', '관심사')}</span>{' '}
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
            {extraInterests.length > 0 ? (
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
            ) : null}
          </div>

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

          <button
            type="button"
            disabled={saveDisabled}
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{t('Save profile', '프로필 저장')}</span>
            {!saving ? <ChevronRight className="w-5 h-5" /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
