import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, Loader2 } from 'lucide-react';
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

  if (bootLoading) {
    return (
      <div className="flex justify-center py-16 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 max-h-[calc(100dvh-10rem)] sm:max-h-[calc(100dvh-11rem)] max-w-lg mx-auto w-full px-3 pt-2 pb-2 gap-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <div className="shrink-0 text-center px-1">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <span className="text-2xl leading-none" aria-hidden>
              🇰🇷
            </span>
            <span className="text-2xl leading-none" aria-hidden>
              🇺🇸
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
            {t('Create your profile', '프로필 만들기')}
          </h2>
          <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
            {t('Shown on Discover', '디스커버에 표시')}
          </p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3">
            <div className="flex flex-col items-center text-center pb-2 border-b border-neutral-100">
              <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1.5">
                {t('Profile photo', '프로필 사진')}{' '}
                <span className="text-neutral-500 font-normal">({t('optional', '선택')})</span>
              </label>
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:border-blue-300 transition-colors overflow-hidden shadow-sm"
                aria-label={t('Upload profile photo', '프로필 사진 업로드')}
              >
                {displayedPhotoSrc ? (
                  <img src={displayedPhotoSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
                <span className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Camera className="w-3.5 h-3.5" />
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
              <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-2 max-w-[260px] leading-snug">
                {t('Tap to choose · uploads when you continue.', '탭해서 선택 · 계속할 때 업로드')}
              </p>
              {pendingPhoto ? (
                <p className="text-[10px] text-blue-600 mt-0.5">{t('Ready to upload', '업로드 준비됨')}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1">
                {t('Name', '이름')}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('Enter your name', '이름을 입력하세요')}
                className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1">
                  {t('I speak', '모국어')}
                </label>
                <select
                  value={profile.nativeLanguage}
                  onChange={(e) => setProfile((prev) => ({ ...prev, nativeLanguage: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 text-xs sm:text-sm"
                >
                  <option>English</option>
                  <option>Korean 한국어</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1">
                  {t('Learning', '배우는 언어')}
                </label>
                <select
                  value={profile.learningLanguage}
                  onChange={(e) => setProfile((prev) => ({ ...prev, learningLanguage: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 text-xs sm:text-sm"
                >
                  <option>Korean 한국어</option>
                  <option>English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1">
                {t('Level', '레벨')}
              </label>
              <select
                value={profile.level}
                onChange={(e) => setProfile((prev) => ({ ...prev, level: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 text-xs sm:text-sm"
              >
                <option>Beginner 초급</option>
                <option>Intermediate 중급</option>
                <option>Advanced 고급</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1.5">
                {t('Interests', '관심사')}{' '}
                <span className="text-neutral-500 font-normal">({t('one+', '1+')})</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PROFILE_INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-1.5 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors leading-tight ${
                      profile.interests.includes(interest)
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-neutral-700 mb-1">
                Bio <span className="text-neutral-500">({t('optional', '선택')})</span>
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                rows={2}
                maxLength={2000}
                placeholder={t('Short intro…', '짧은 소개…')}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm resize-none min-h-[52px]"
              />
            </div>

            <p className="text-center pb-1">
              <Link to="/home" className="text-xs text-neutral-500 hover:text-neutral-800 hover:underline">
                {t('Skip for now', '나중에 하기')}
              </Link>
            </p>
          </div>

          <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <button
              type="button"
              onClick={handleContinue}
              disabled={starting || !canContinue}
              className="w-full rounded-xl bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{t('Continue to Discover', '디스커버로 계속')}</span>
              {!starting ? <ChevronRight className="w-5 h-5" /> : null}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
