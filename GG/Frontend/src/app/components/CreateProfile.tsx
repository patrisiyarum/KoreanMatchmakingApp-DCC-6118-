import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, Loader2, UserRound } from 'lucide-react';
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
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
  }, [userId, navigate, t]);

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
        bio: profile.bio.trim() || '',
      });
      if (!res.ok) {
        toast.error(res.message || 'Could not save your profile');
        return;
      }
      navigate('/discover');
    } catch {
      toast.error('Could not save your profile');
    } finally {
      setStarting(false);
    }
  };

  const canContinue = Boolean(profile.name.trim()) && profile.interests.length > 0;
  const photoSrc = publicAssetUrl(profileImage);
  if (bootLoading) {
    return (
      <div className="flex justify-center py-16 text-neutral-500">
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

  return (
    <div className="size-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5">
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('Your Name', '이름')} <span className="text-neutral-500">{t('이름', '이름')}</span>
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
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
                value={profile.nativeLanguage}
                onChange={(e) => setProfile((prev) => ({ ...prev, nativeLanguage: e.target.value }))}
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
                value={profile.learningLanguage}
                onChange={(e) => setProfile((prev) => ({ ...prev, learningLanguage: e.target.value }))}
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
              value={profile.level}
              onChange={(e) => setProfile((prev) => ({ ...prev, level: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Beginner 초급</option>
              <option>Intermediate 중급</option>
              <option>Advanced 고급</option>
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio <span className="text-neutral-500">{t('(optional)', '(선택)')}</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              rows={2}
              maxLength={2000}
              placeholder={t('Short intro…', '짧은 소개…')}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={starting || !canContinue}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{t('Save profile', '프로필 저장')}</span>
            <span className="text-blue-100">•</span>
            <span>{t('프로필 저장', '프로필 저장')}</span>
            {!starting ? <ChevronRight className="w-5 h-5" /> : null}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
