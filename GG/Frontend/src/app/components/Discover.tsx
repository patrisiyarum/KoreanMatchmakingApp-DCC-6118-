import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fetchDiscoverUsers } from '@/api/discoverApi';
import { fetchUserInterestNames } from '@/api/matchmakingProfileApi';
import { sendFriendRequest } from '@/api/friendsApi';
import { UserAvatar } from './UserAvatar';

export function Discover() {
  const { t, language } = useLanguage();
  const { userId } = useAuth();
  const [partners, setPartners] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileGate, setProfileGate] = useState(false);
  const [myInterests, setMyInterests] = useState<Set<string>>(() => new Set());
  const [sendingRequest, setSendingRequest] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setPartners([]);
      setLoading(false);
      setLoadError(null);
      setProfileGate(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setProfileGate(false);
    try {
      const [rows, mine] = await Promise.all([
        fetchDiscoverUsers(userId),
        fetchUserInterestNames(userId).catch(() => [] as string[]),
      ]);
      setMyInterests(new Set(mine));
      setPartners(rows);
      setCurrentIndex(0);
    } catch (e: unknown) {
      const err = e as Error & { code?: string };
      if (err.code === 'PROFILE_INCOMPLETE') {
        setProfileGate(true);
        setLoadError(err.message);
      } else {
        setLoadError(err.message || t('Could not load partners', '파트너를 불러오지 못했습니다'));
      }
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const currentPartner = partners[currentIndex];

  const handleSwipe = async (liked: boolean) => {
    if (!currentPartner) return;
    if (liked) {
      setMatches((prev) => [...prev, currentPartner]);
      if (userId) {
        setSendingRequest(true);
        try {
          await sendFriendRequest(userId, currentPartner.id);
          toast.success(t('Friend request sent', '친구 요청을 보냈습니다'));
        } catch (e: unknown) {
          const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
          toast.error(
            err.response?.data?.error ||
              err.response?.data?.message ||
              err.message ||
              t('Could not send request', '요청을 보내지 못했습니다')
          );
        } finally {
          setSendingRequest(false);
        }
      }
    }

    setTimeout(() => {
      if (currentIndex < partners.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(partners.length);
      }
    }, 300);
  };

  if (!userId) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <p className="text-neutral-600 text-center">
          <Link to="/login" className="text-violet-600 font-medium hover:underline">
            {t('Sign in', '로그인')}
          </Link>{' '}
          {t('to discover partners.', '하고 파트너를 찾아보세요.')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="size-full flex flex-col items-center justify-center p-6 gap-3 text-neutral-600">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm">{t('Loading partners…', '파트너 불러오는 중…')}</p>
      </div>
    );
  }

  if (profileGate) {
    const gateTitle =
      loadError ||
      t('Complete your profile to discover partners.', '파트너를 찾으려면 프로필을 완성하세요.');
    return (
      <div className="size-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="inline-flex rounded-full bg-violet-100 p-3 mx-auto">
            <Sparkles className="w-8 h-8 text-violet-600" aria-hidden />
          </div>
          <p className="text-neutral-900 font-semibold text-lg leading-snug">{gateTitle}</p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {t(
              'Finish creating your profile with languages, level, and interests so we can show you good matches.',
              '언어, 레벨, 관심사를 입력해 프로필을 완성하면 맞는 파트너를 보여 드려요.'
            )}
          </p>
          <div className="pt-1">
            <Link
              to="/edit-profile"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 text-white px-6 py-3 text-sm font-semibold hover:bg-violet-700 shadow-md"
            >
              {t('Complete profile', '프로필 완성하기')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadError && !partners.length) {
    return (
      <div className="size-full flex flex-col items-center justify-center p-6 gap-3">
        <p className="text-neutral-600 text-center text-sm">{loadError}</p>
        <button
          type="button"
          onClick={() => load()}
          className="text-violet-600 text-sm font-medium hover:underline"
        >
          {t('Retry', '다시 시도')}
        </button>
      </div>
    );
  }

  if (!currentPartner) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-neutral-600 mb-4">
            {t('No more partners to show right now.', '지금 보여줄 파트너가 없어요.')}
          </p>
          <button
            type="button"
            onClick={() => load()}
            className="text-violet-600 text-sm font-medium hover:underline"
          >
            {t('Refresh', '새로고침')}
          </button>
        </div>
      </div>
    );
  }

  const sharedInterests = currentPartner.interests.filter((interest) => myInterests.has(interest));

  return (
    <div className="size-full flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md mb-4">
        <p className="text-center text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
            <span>
              {matches.length} {t('matches today', '오늘의 매치')}
            </span>
          </span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPartner.id}
          initial={{ scale: 0.9, opacity: 0, rotateY: -20 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotateY: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 sm:p-6 text-center">
              <div className="mb-3 flex justify-center">
                <UserAvatar
                  seed={currentPartner.id}
                  name={currentPartner.name}
                  profileImage={currentPartner.profileImage}
                  nativeLanguage={currentPartner.nativeLanguage}
                  size="xl"
                  className="border-4 border-white/40 shadow-md"
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-0.5">{currentPartner.name}</h3>
              <p className="text-white/85 text-xs font-medium mb-0.5">
                {t('Level', '레벨')}: {currentPartner.gameLevel ?? '—'}
              </p>
              <div className="flex items-center justify-center gap-2 text-white/90 text-xs">
                <span>{currentPartner.nativeLanguage}</span>
                <span>↔</span>
                <span>{currentPartner.learningLanguage}</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="text-xs font-medium text-neutral-500 mb-1">LEVEL</div>
                <div className="text-sm text-neutral-900">{currentPartner.level}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-neutral-500 mb-2">
                  {t('GAME PROFILE', '게임 프로필')}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(currentPartner.topBadges || []).length ? (
                    (currentPartner.topBadges || []).slice(0, 3).map((icon, idx) => (
                      <span
                        key={`${currentPartner.id}-badge-${idx}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm"
                        title={t('Top badge', '대표 배지')}
                      >
                        {icon}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500">{t('No badges yet', '아직 배지 없음')}</span>
                  )}
                </div>
                <Link
                  to={`/games/profile/${currentPartner.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-violet-700 hover:text-violet-800"
                >
                  {t('View games profile', '게임 프로필 보기')}
                </Link>
              </div>

              <div>
                <div className="text-xs font-medium text-neutral-500 mb-2">INTERESTS</div>
                <div className="flex flex-wrap gap-2">
                  {currentPartner.interests.length ? (
                    currentPartner.interests.map((interest) => (
                      <span
                        key={interest}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sharedInterests.includes(interest)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {interest}
                        {sharedInterests.includes(interest) && ' ✨'}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-500">—</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-neutral-500 mb-2">BIO</div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{currentPartner.bio}</p>
              </div>

              {sharedInterests.length > 0 && (
                <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
                  <p className="text-sm text-sky-900 text-center">
                    ❤️{' '}
                    {language === 'ko'
                      ? `공통 관심사가 ${sharedInterests.length}개 있어요!`
                      : `You have ${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}!`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-6 mt-8">
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (currentIndex > 0) setCurrentIndex((i) => i - 1);
          }}
          disabled={currentIndex === 0 || sendingRequest}
          aria-label={t('Undo last swipe', '되돌리기')}
          title={t('Undo last swipe', '되돌리기')}
          className="w-12 h-12 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center shadow-md hover:border-amber-400 transition-colors disabled:opacity-40"
        >
          <RotateCcw className="w-5 h-5 text-amber-600" />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => void handleSwipe(false)}
          disabled={sendingRequest}
          className="w-16 h-16 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center shadow-lg hover:border-red-400 transition-colors"
        >
          <X className="w-8 h-8 text-neutral-600" />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => void handleSwipe(true)}
          disabled={sendingRequest}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg disabled:opacity-60"
        >
          <Heart className="w-8 h-8 text-white fill-white" />
        </motion.button>
      </div>
    </div>
  );
}
