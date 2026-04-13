import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { saveWelcomeProfile } from '@/api/matchmakingProfileApi';
import { fetchUserAccount, fetchUserProfilePayload, uploadProfileImage } from '@/api/profileApi';
import { publicAssetUrl } from '../utils/profileImage';

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
  /** Saved on server already (from Profile or a previous upload). */
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

  const interestOptions = [
    'K-pop',
    'Gaming',
    'Cooking',
    'Movies',
    'Sports',
    'Art',
    'Music',
    'Technology',
    'Travel',
    'Anime',
  ];

  const load = useCallback(async () => {
    if (!userId) return;
    setBootLoading(true);
    let skipSpinnerOff = false;
    try {
      const [account, payload] = await Promise.all([
        fetchUserAccount(userId),
        fetchUserProfilePayload(userId),
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

  if (bootLoading) {
    return (
      <div className="flex justify-center py-16 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 sm:py-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="text-center mb-5 sm:mb-6">
          <div className="text-4xl sm:text-5xl mb-2">🇰🇷 🇺🇸</div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">
            {t('Create your profile', '프로필 만들기')}
          </h2>
          <p className="text-sm text-blue-600 mb-0.5">환영합니다</p>
          <p className="text-sm text-neutral-600">
            {t('Shown on Discover and when you match', '디스커버와 매칭에 표시돼요')}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 space-y-4 shadow-sm">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5">
              {t('Your name', '이름')}{' '}
              <span className="text-neutral-500 font-normal">Your Name</span>
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name • 이름을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5">
                {t('I speak', '모국어')}
              </label>
              <select
                value={profile.nativeLanguage}
                onChange={(e) => setProfile((prev) => ({ ...prev, nativeLanguage: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option>English</option>
                <option>Korean 한국어</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5">
                {t("I'm learning", '배우는 언어')}
              </label>
              <select
                value={profile.learningLanguage}
                onChange={(e) => setProfile((prev) => ({ ...prev, learningLanguage: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option>Korean 한국어</option>
                <option>English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5">
              {t('My level', '레벨')}
            </label>
            <select
              value={profile.level}
              onChange={(e) => setProfile((prev) => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option>Beginner 초급</option>
              <option>Intermediate 중급</option>
              <option>Advanced 고급</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
              {t('Interests', '관심사')}{' '}
              <span className="text-neutral-500 font-normal text-xs">({t('at least one', '하나 이상')})</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
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
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5">
              Bio <span className="text-neutral-500">소개</span>{' '}
              <span className="text-neutral-500 font-normal text-xs">({t('optional', '선택')})</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              rows={2}
              maxLength={2000}
              placeholder="Short intro for Discover • 디스커버용 짧은 소개"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none sm:resize-y min-h-[64px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5">
              {t('Profile photo', '프로필 사진')}{' '}
              <span className="text-neutral-500 font-normal text-xs">({t('optional', '선택')})</span>
            </label>
            <p className="text-[11px] sm:text-xs text-neutral-500 mb-2">
              {t(
                'Shown on your Discover card and in the header Profile screen.',
                '디스커버 카드와 상단 프로필 화면에 표시됩니다.'
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="relative w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 shrink-0 overflow-hidden"
              >
                {displayedPhotoSrc ? (
                  <img src={displayedPhotoSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
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
              <p className="text-xs text-neutral-600 leading-snug">
                {pendingPhoto
                  ? t('New photo uploads when you tap Continue.', '새 사진은 계속을 누르면 업로드됩니다.')
                  : t('Tap the circle to choose a file. Change anytime under Profile.', '원을 눌러 파일을 고르세요. 프로필에서 언제든 바꿀 수 있어요.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={starting || !profile.name || profile.interests.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{t('Continue to Discover', '디스커버로 계속')}</span>
            {!starting ? <ChevronRight className="w-5 h-5" /> : null}
          </button>

          <p className="text-center">
            <Link to="/home" className="text-sm text-neutral-500 hover:text-neutral-800 hover:underline">
              {t('Skip for now', '나중에 하기')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
