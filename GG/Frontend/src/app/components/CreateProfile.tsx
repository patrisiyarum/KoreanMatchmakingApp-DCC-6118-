import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserInterestNames, saveWelcomeProfile } from '@/api/matchmakingProfileApi';
import { fetchUserAccount, fetchUserProfilePayload, uploadProfileImage } from '@/api/profileApi';
import { publicAssetUrl } from '../utils/profileImage';
import { PROFILE_INTEREST_OPTIONS } from '../constants/profileInterests';

function profileMeetsDiscoverMinimum(p: Awaited<ReturnType<typeof fetchUserProfilePayload>>): boolean {
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

function fieldLabel(text: string) {
  return (
    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
      {text}
    </div>
  );
}

/**
 * First-time profile setup (languages, level, interests, bio, photo). Lives under authenticated shell.
 */
export function CreateProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const photoRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverPhotoPath, setServerPhotoPath] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    nativeLanguage: 'English',
    learningLanguage: 'Korean',
    interests: [] as string[],
    level: 'Beginner',
    bio: '',
  });

  const load = useCallback(async () => {
    if (!userId) return;
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
        setServerPhotoPath(account.profileImage && String(account.profileImage).trim() ? account.profileImage : null);
      } else {
        setServerPhotoPath(null);
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
    if (!(profile.name && profile.interests.length > 0) || !userId) return;
    const trimmed = profile.name.trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || '';
    setStarting(true);
    try {
      const res = await saveWelcomeProfile({
        userId,
        firstName,
        lastName,
        nativeLanguage: profile.nativeLanguage,
        learningLanguage: profile.learningLanguage,
        proficiency: profile.level,
        interestNames: profile.interests,
        bio: profile.bio,
      });
      if (!res.ok) {
        toast.error(res.message || 'Could not save your profile');
        return;
      }
      if (pendingPhoto) {
        try {
          await uploadProfileImage(userId, pendingPhoto);
        } catch {
          toast.error('Photo upload failed — you can add one later in Profile.');
        }
      }
      navigate('/discover');
    } catch {
      toast.error('Could not save your profile');
    } finally {
      setStarting(false);
    }
  };

  const displayedPhotoSrc = photoPreview || publicAssetUrl(serverPhotoPath);
  const canContinue = Boolean(profile.name.trim()) && profile.interests.length > 0;
  const displayName = profile.name.trim() || t('Your name', '이름');

  if (bootLoading) {
    return (
      <div className="flex justify-center py-16 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500';
  const selectClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500';

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg max-h-[calc(100dvh-10rem)] flex-col px-4 py-4 sm:max-h-[calc(100dvh-11rem)] sm:px-6 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg"
      >
        <div className="shrink-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pb-8 pt-8 text-center sm:px-8 sm:pb-10 sm:pt-10">
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="block"
              aria-label={t('Upload profile photo', '프로필 사진 업로드')}
            >
              <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 shadow-md sm:h-32 sm:w-32">
                {displayedPhotoSrc ? (
                  <img src={displayedPhotoSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-white/15 text-white">
                    <UserRound className="h-14 w-14 opacity-95 sm:h-16 sm:w-16" strokeWidth={1.25} />
                  </span>
                )}
              </span>
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPendingPhoto(file);
                setPhotoPreview(URL.createObjectURL(file));
                e.target.value = '';
              }}
            />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('Create your profile', '프로필 만들기')}</h2>
          <p className="mt-1 text-lg font-semibold text-white/95">{displayName}</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/90">
            <span>{profile.nativeLanguage}</span>
            <span aria-hidden>↔</span>
            <span>{profile.learningLanguage}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
          <div>
            {fieldLabel(t('Name', '이름'))}
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('Enter your name', '이름을 입력하세요')}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              {fieldLabel(t('Native', '모국어'))}
              <select
                value={profile.nativeLanguage}
                onChange={(e) => setProfile((prev) => ({ ...prev, nativeLanguage: e.target.value }))}
                className={selectClass}
              >
                <option>English</option>
                <option>Korean 한국어</option>
              </select>
            </div>
            <div>
              {fieldLabel(t('Learning', '배우는 언어'))}
              <select
                value={profile.learningLanguage}
                onChange={(e) => setProfile((prev) => ({ ...prev, learningLanguage: e.target.value }))}
                className={selectClass}
              >
                <option>Korean 한국어</option>
                <option>English</option>
              </select>
            </div>
          </div>

          <div>
            {fieldLabel(t('Level', '레벨'))}
            <select
              value={profile.level}
              onChange={(e) => setProfile((prev) => ({ ...prev, level: e.target.value }))}
              className={selectClass}
            >
              <option>Beginner 초급</option>
              <option>Intermediate 중급</option>
              <option>Advanced 고급</option>
            </select>
          </div>

          <div>
            {fieldLabel(
              `${t('Interests', '관심사')} · ${t('pick one or more', '하나 이상')}`
            )}
            <div className="flex flex-wrap gap-2">
              {PROFILE_INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    profile.interests.includes(interest)
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            {fieldLabel(`${t('Bio', '소개')} · ${t('optional', '선택')}`)}
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder={t('Short intro…', '짧은 소개…')}
              className={`${inputClass} min-h-[88px] resize-none`}
            />
          </div>

          <p className="text-center">
            <Link to="/home" className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline">
              {t('Skip for now', '나중에 하기')}
            </Link>
          </p>

          <button
            type="button"
            onClick={handleContinue}
            disabled={starting || !canContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
          >
            {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>{t('Continue to Discover', '디스커버로 계속')}</span>
            {!starting ? <ChevronRight className="h-5 w-5" /> : null}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
