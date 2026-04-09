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
} from '@/api/profileApi';

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

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [account, profile, options] = await Promise.all([
        fetchUserAccount(userId),
        fetchUserProfilePayload(userId),
        fetchProfileOptions(),
      ]);
      setOpts(options);
      if (account) {
        setFirstName(account.firstName || '');
        setLastName(account.lastName || '');
        setProfileImage(account.profileImage ?? null);
      }
      if (profile && profile.id != null) {
        setHasProfile(true);
        setBio(profile.bio ?? '');
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
          toast.error(res.message || t('Save failed', '저장 실패'));
          return;
        }
        setHasProfile(true);
        toast.success(t('Profile created', '프로필이 생성되었습니다'));
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
          toast.error(res.message || t('Save failed', '저장 실패'));
          return;
        }
        toast.success(t('Profile saved', '프로필이 저장되었습니다'));
      }
      await load();
    } catch (e) {
      console.error(e);
      toast.error(t('Save failed', '저장 실패'));
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

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">
        {t('My profile', '내 프로필')}
      </h1>
      <p className="text-sm text-neutral-600 mb-6">
        {t('Photo, bio, and languages', '사진, 소개, 언어 설정')}
      </p>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt=""
                className="w-28 h-28 rounded-full object-cover border-4 border-neutral-100"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-neutral-200 flex items-center justify-center text-3xl text-neutral-500">
                {(firstName[0] || '?').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700"
              title={t('Change photo', '사진 변경')}
            >
              <Camera className="w-5 h-5" />
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
              className="text-sm text-red-600 hover:underline"
            >
              {t('Remove photo', '사진 제거')}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('First name', '이름')}
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('Last name', '성')}
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('Bio', '소개')}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t('Tell partners about yourself…', '파트너에게 자신을 소개해 보세요…')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-y min-h-[100px]"
          />
          <p className="text-xs text-neutral-400 mt-1">{bio.length}/2000</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('I speak', '모국어')}
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option>English</option>
              <option>Korean</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('Learning', '배우는 언어')}
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option>Korean</option>
              <option>English</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('Level', '레벨')}
          </label>
          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {!hasProfile ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Age</label>
              <input
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('Learning goal', '학습 목표')}
              </label>
              <select
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {opts.learningGoals.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('Communication style', '소통 스타일')}
              </label>
              <select
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {opts.communicationStyles.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
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
              <p className="text-xs text-neutral-500">{commitmentLevel}</p>
            </div>
          </>
        ) : null}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {hasProfile ? t('Save changes', '변경 저장') : t('Create profile', '프로필 만들기')}
        </button>
      </div>
    </div>
  );
}
